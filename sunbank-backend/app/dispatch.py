"""Three strategies on identical inputs: none (B0), rule (B1), sunbank."""
from dataclasses import dataclass
import numpy as np
from .config import BLOCKS, DT
from . import dsm
from .market import price_curve, evening_weights
from .optimizer import solve

RISK_LAMBDA = {"p50": 0.0, "balanced": 0.25, "risk_aware": 0.5, "conservative": 0.75}


@dataclass
class Day:
    date: str
    avail: np.ndarray   # actual plant MW (truth)
    nwp: np.ndarray     # raw weather-model forecast as MW
    p10: np.ndarray
    p50: np.ndarray
    p90: np.ndarray
    cs: np.ndarray      # clear-sky MW

    @property
    def daytime(self):
        return self.cs > 0.05


def _finish(day, cfg, sched, inj, curt, c, d, soc_mwh):
    E = cfg["bess"]["mwh"]
    dev, inb, pen = dsm.evaluate(sched, inj, cfg)
    price = price_curve(cfg)
    thr = (c + d).sum() * DT
    deg = thr * cfg["bess"]["deg_inr_per_mwh"]
    ev = slice(cfg["market"]["evening_start_block"], cfg["market"]["evening_end_block"])
    dm = day.daytime
    kpis = {
        "curtailed_mwh": float(curt.sum() * DT), "delivered_mwh": float(inj.sum() * DT),
        "evening_shifted_mwh": float(d[ev].sum() * DT),
        "in_band_pct": float(inb[dm].mean() * 100) if dm.any() else 100.0,
        "penalty_inr": float(pen.sum()),
        "net_value_inr": float((price * inj * DT).sum() - pen.sum() - deg),
        "cycles": float(thr / (2 * E)),
    }
    return {"solar_avail": day.avail, "schedule": sched, "injection": inj, "curtailed": curt, "charge": c,
            "discharge": d, "soc": soc_mwh / E * 100, "deviation": dev, "penalty_inr": pen, "kpis": kpis}


def run_none(day, cfg):
    L = cfg["grid"]["limit_mw"]
    inj = np.minimum(day.avail, L); z = np.zeros(BLOCKS)
    soc = np.full(BLOCKS, cfg["bess"]["soc_start"] * cfg["bess"]["mwh"])
    return _finish(day, cfg, np.minimum(day.nwp, L), inj, day.avail - inj, z, z, soc)


def run_rule(day, cfg):
    b, L, r = cfg["bess"], cfg["grid"]["limit_mw"], cfg["rule_battery"]
    E, P = b["mwh"], b["mw"]; smin, smax = b["soc_min"] * E, b["soc_max"] * E
    s = b["soc_start"] * E
    c = np.zeros(BLOCKS); d = np.zeros(BLOCKS); inj = np.zeros(BLOCKS); curt = np.zeros(BLOCKS); soc = np.zeros(BLOCKS)
    for k in range(BLOCKS):
        a = day.avail[k]
        if a > L and s < smax - 1e-9:
            c[k] = min(a - L, P, (smax - s) / (b["eta_charge"] * DT))
        elif r["evening_start_block"] <= k < r["evening_end_block"] and s > smin:
            d[k] = max(0.0, min(r["discharge_mw"], P, (s - smin) * b["eta_discharge"] / DT, L - a))
        s += b["eta_charge"] * c[k] * DT - d[k] * DT / b["eta_discharge"]
        x = a - c[k] + d[k]
        curt[k] = max(0.0, x - L); inj[k] = x - curt[k]; soc[k] = s
    return _finish(day, cfg, np.minimum(day.nwp, L), inj, curt, c, d, soc)


def run_sunbank(day, cfg):
    b, L = cfg["bess"], cfg["grid"]["limit_mw"]
    E, P = b["mwh"], b["mw"]; smin, smax = b["soc_min"] * E, b["soc_max"] * E
    ec, ed = b["eta_charge"], b["eta_discharge"]
    lam = RISK_LAMBDA.get(cfg["optimizer"]["risk_mode"], 0.0)
    price, tb = price_curve(cfg), evening_weights(cfg) * cfg["market"]["tie_break_inr_per_mwh"]
    s0 = b["soc_start"] * E
    a_plan = np.maximum(day.p50 - lam * (day.p50 - day.p10), 0)
    plan = solve(a_plan, price, tb, s0, cfg, sch=None, use_milp=cfg["optimizer"]["use_milp_plan"], s_target=s0)
    sched = np.maximum(plan["i"], 0)
    sched[sched < 1e-3] = 0
    prev = {"c": plan["c"], "d": plan["d"], "start": 0, "af": a_plan.copy()}
    s = s0
    c = np.zeros(BLOCKS); d = np.zeros(BLOCKS); inj = np.zeros(BLOCKS); curt = np.zeros(BLOCKS); soc = np.zeros(BLOCKS)
    tol = cfg["optimizer"]["reopt_tol_mw"]
    for k in range(BLOCKS):
        a = day.avail[k]
        err = abs(a - prev["af"][k])
        if err > tol:
            den = day.p50[max(0, k - 4):k].sum()
            r = float(np.clip(day.avail[max(0, k - 4):k].sum() / den, .4, 1.6)) if den > 1 else 1.0
            decay = np.exp(-np.arange(BLOCKS - k) / 4.0)
            af = a_plan[k:] * (1 + (r - 1) * decay)
            af[0] = a
            sol = solve(af, price[k:], tb[k:], s, cfg, sch=sched[k:], use_milp=cfg["optimizer"]["use_milp_rolling"], s_target=s0)
            ck, dk = sol["c"][0], sol["d"][0]
            prev = {"c": np.concatenate([np.zeros(k), sol["c"]]), "d": np.concatenate([np.zeros(k), sol["d"]]),
                    "af": np.concatenate([np.zeros(k), af])}
        else:
            ck, dk = prev["c"][k], prev["d"][k]
        ck = min(ck, a, P, (smax - s) / (ec * DT)); dk = min(dk, P, (s - smin) * ed / DT)
        if ck > 0 and dk > 0:
            m = min(ck, dk); ck -= m; dk -= m
        x = a - ck + dk
        curt[k] = max(0.0, x - L); inj[k] = x - curt[k]
        c[k], d[k] = ck, dk
        s += ec * ck * DT - dk * DT / ed
        soc[k] = s
    return _finish(day, cfg, sched, inj, curt, c, d, soc)


STRATEGIES = {"none": run_none, "rule": run_rule, "sunbank": run_sunbank}


def run_all(day, cfg):
    return {k: f(day, cfg) for k, f in STRATEGIES.items()}
