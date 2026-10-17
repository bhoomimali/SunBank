from typing import Literal, Optional
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .config import LABELS, override
from .store import get_store
from .dispatch import run_all
from .pipeline import day_from_frame
from .bess import twin
from .events import make_events
from .regimes import representative
from .dsm import band_mw

app = FastAPI(title="SunBank API", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
KP = ["curtailed_mwh", "delivered_mwh", "evening_shifted_mwh", "in_band_pct", "penalty_inr", "net_value_inr", "cycles"]
STRATS = ("none", "rule", "sunbank")
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def S():
    s = get_store()
    if not s.ready:
        raise HTTPException(503, "Results not built. Run `make build` first.")
    return s


def chk(s, date):
    if date not in s.dates:
        raise HTTPException(404, f"date must be one of the backtest dates {s.dates[0]}..{s.dates[-1]}")


def kp(row):
    return {k: round(float(row[k]), 3 if k == "cycles" else 1) for k in KP}


def kp_day(s, date):
    return {st: kp(s.kpis_idx.loc[(date, st)]) for st in STRATS}


def deltas(c):
    return {"curtailment_saved_mwh": round(c["none"]["curtailed_mwh"] - c["sunbank"]["curtailed_mwh"], 1),
            "revenue_gain_inr": round(c["sunbank"]["net_value_inr"] - c["none"]["net_value_inr"]),
            "penalty_avoided_inr": round(c["none"]["penalty_inr"] - c["sunbank"]["penalty_inr"]),
            "in_band_gain_pct": round(c["sunbank"]["in_band_pct"] - c["none"]["in_band_pct"], 1)}


def blocks_payload(df):
    cols = ["solar_avail", "schedule", "injection", "curtailed", "charge", "discharge", "soc", "deviation", "penalty_inr"]
    return [{"t": r.t, **{c: round(float(getattr(r, c)), 2) for c in cols}} for r in df.itertuples()]


@app.get("/api/health")
def health():
    return {"ok": True, "ready": get_store().ready}


@app.get("/api/config")
def config():
    c, s = get_store().cfg, get_store()
    b, rng = c["bess"], (f"{s.dates[0]} to {s.dates[-1]}" if s.ready else "not built")
    return {"plant": {"ac_mw": c["plant"]["ac_mw"], "dc_mwp": c["plant"]["dc_mwp"]},
            "bess": {"mw": b["mw"], "mwh": b["mwh"], "soc_min": b["soc_min"] * 100, "soc_max": b["soc_max"] * 100,
                     "rte": round(b["eta_charge"] * b["eta_discharge"], 4)},
            "grid_limit_mw": c["grid"]["limit_mw"], "band_pct": c["dsm"]["band_pct"],
            "assumptions": [
                "ASSUMPTION: weather is SYNTHETIC (Bhadla-shaped) until ERA5/Open-Meteo data is loaded",
                f"Plant output computed with pvlib from irradiance ({c['plant']['ac_mw']} MW AC, {c['plant']['dc_mwp']} MWp DC); no SCADA data",
                f"ASSUMPTION: {c['grid']['limit_mw']} MW grid export limit (adjustable)",
                f"Battery {b['mw']} MW / {b['mwh']} MWh, SoC {b['soc_min']*100:.0f}-{b['soc_max']*100:.0f}%, round trip {b['eta_charge']*b['eta_discharge']:.1%}",
                f"DSM band +/-{c['dsm']['band_pct']}% of plant capacity; ASSUMPTION rate Rs {c['dsm']['rate_inr_per_mwh']}/MWh x {c['dsm']['multiplier']}",
                "15-minute data interpolated from hourly using the clear-sky index; no minute-scale cloud flicker",
                "Schedule revisions are not modelled; day-ahead schedule is fixed",
                f"ASSUMPTION: emission factor {c['co2_factor_t_per_mwh']} tCO2/MWh (verify against current CEA value)",
                "Backtest only. No live SCADA/Modbus control, no real-time operation, no guaranteed savings"],
            "sources": [{"name": "Synthetic weather generator (Bhadla climate shape)", "range": f"{c['synthetic']['start']} to {c['synthetic']['end']}"},
                        {"name": "pvlib clear-sky and PV model", "range": "computed"},
                        {"name": "Time-held-out test set", "range": rng}],
            "data_mode": "MOCK", "co2_factor_t_per_mwh": c["co2_factor_t_per_mwh"]}


@app.get("/api/forecast")
def forecast(date: str):
    s = S(); chk(s, date)
    d = s.day_frame(date)
    blocks = [{"t": LABELS[i], "p10": round(float(r.p10), 2), "p50": round(float(r.p50), 2), "p90": round(float(r.p90), 2),
               "actual": round(float(r.actual_mw), 2), "clearsky": round(float(r.cs_mw), 2)} for i, r in enumerate(d.itertuples())]
    m = s.fmetrics
    return {"blocks": blocks, "metrics": {k: m["metrics"][k] for k in ["nmae", "nrmse", "pinball", "coverage", "skill_vs_raw", "skill_vs_persistence"]},
            "by_regime": m["by_regime"], "calibration": m["calibration"]}


@app.get("/api/dispatch")
def dispatch(date: str, strategy: Literal["none", "rule", "sunbank"] = "sunbank"):
    s = S(); chk(s, date)
    return {"blocks": blocks_payload(s.blocks_idx.loc[(date, strategy)].sort_values("blk")), "kpis": kp(s.kpis_idx.loc[(date, strategy)])}


@app.get("/api/compare")
def compare(date: str):
    s = S(); chk(s, date)
    c = kp_day(s, date)
    return {**c, "deltas": deltas(c)}


def _agg(g):
    out = {}
    for st in STRATS:
        x = g[g.strategy == st]
        o = {k: float(x[k].sum()) for k in ["curtailed_mwh", "delivered_mwh", "evening_shifted_mwh", "penalty_inr", "net_value_inr"]}
        o.update({"in_band_pct": float(x["in_band_pct"].mean()), "cycles": float(x["cycles"].mean())})
        out[st] = kp(o)
    return out


@app.get("/api/backtest/summary")
def backtest_summary(date_from: Optional[str] = Query(None, alias="from"), to: Optional[str] = None):
    s = S(); k = s.kpis.copy()
    if date_from: k = k[k.date >= date_from]
    if to: k = k[k.date <= to]
    k["m"] = pd.to_datetime(k.date).dt.month
    months = [{"month": MONTHS[m - 1], **_agg(g)} for m, g in k.groupby("m")]
    tot = _agg(k)
    rec = (tot["none"]["curtailed_mwh"] - tot["sunbank"]["curtailed_mwh"]) / max(tot["none"]["curtailed_mwh"], 1e-9) * 100
    return {"months": months, "total": tot, "recovered_pct": round(rec, 1), "days": int(k.date.nunique())}


@app.get("/api/problem-proof")
def problem_proof():
    s = S(); c = s.cfg
    a = s.fc["actual_mw"].to_numpy(); dm = (s.fc["cs_mw"] > .05).to_numpy()
    sweep = [{"limit_pct": p, "curtailed_pct": round(float(np.maximum(a - c["plant"]["ac_mw"] * p / 100, 0).sum() / a.sum() * 100), 2)}
             for p in range(40, 101, 10)]
    n = s.kpis[s.kpis.strategy == "none"]
    return {"limit_sweep": sweep, "inband_baseline_pct": round(float(n.in_band_pct.mean()), 1),
            "baseline_penalty_inr": round(float(n.penalty_inr.sum()))}


REG = {"monsoon": "monsoon", "winter_fog": "winter_fog", "summer_heat": "summer_heat", "stubble_haze": "stubble_haze", "clear": "clear"}


@app.get("/api/scenario")
def scenario(regime: str = "monsoon"):
    s = S()
    if regime not in REG: raise HTTPException(422, f"regime must be one of {list(REG)}")
    test_days = pd.DatetimeIndex(sorted(pd.to_datetime(s.dates)))
    daily = s.daily.loc[s.daily.index.tz_localize(None).isin(test_days) if s.daily.index.tz is not None else s.daily.index.isin(test_days)]
    dates = representative(daily, regime)
    if not dates: raise HTTPException(404, "no days for this regime")
    days, nm = [], []
    for d in dates:
        r = daily.loc[daily.index.strftime("%Y-%m-%d") == d].iloc[0]
        days.append({"date": d, "tmax": round(float(r.tmax)), "ghi_peak": round(float(r.ghi_peak)), "compare": kp_day(s, d)})
        f = s.day_frame(d); m = (f.cs_mw > .05).to_numpy()
        nm.append(float(np.mean(np.abs(f.actual_mw.to_numpy()[m] - f.p50.to_numpy()[m])) / s.cfg["plant"]["ac_mw"] * 100))
    return {"days": days, "summary": {"avg_curtailment": round(float(np.mean([x["compare"]["none"]["curtailed_mwh"] for x in days])), 1),
                                      "in_band_pct": round(float(np.mean([x["compare"]["sunbank"]["in_band_pct"] for x in days])), 1),
                                      "nmae": round(float(np.mean(nm)), 2)}}


class SimReq(BaseModel):
    date: str
    limit_mw: float
    bess_mw: float
    bess_mwh: float
    risk_mode: Literal["conservative", "balanced", "aggressive", "p50", "risk_aware"] = "p50"
    price_mode: Literal["flat", "tod_peak", "flat_ppa", "market"] = "flat_ppa"


@app.post("/api/simulate")
def simulate(req: SimReq):
    s = S(); chk(s, req.date)
    if not (0 < req.limit_mw <= 200 and 0 < req.bess_mw <= 200 and 0 < req.bess_mwh <= 1000):
        raise HTTPException(422, "parameters out of range")
    cfg = override(s.cfg, req.limit_mw, req.bess_mw, req.bess_mwh, req.risk_mode, req.price_mode)
    res = run_all(day_from_frame(s.day_frame(req.date), req.date), cfg)
    c = {k: kp(v["kpis"]) for k, v in res.items()}
    return {**c, "deltas": deltas(c)}


@app.get("/api/bess")
def bess(date: str):
    s = S(); chk(s, date)
    b = s.blocks_idx.loc[(date, "sunbank")].sort_values("blk")
    amb = s.weather.loc[date, "temp"].to_numpy()
    return twin({k: b[k].to_numpy() for k in ["charge", "discharge", "soc"]}, amb, s.cfg)


@app.get("/api/events")
def events(date: str, strategy: Literal["none", "rule", "sunbank"] = "sunbank"):
    s = S(); chk(s, date)
    b = s.blocks_idx.loc[(date, strategy)].sort_values("blk")
    f = s.day_frame(date)
    return make_events({k: b[k].to_numpy() for k in b.columns if k not in ("t", "blk")},
                       {k: f[k].to_numpy() for k in ["p10", "p50", "p90"]}, s.cfg, strategy)
