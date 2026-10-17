"""python -m app.pipeline  ->  synthetic data, PV, forecast, regimes, backtest. Writes data/processed + results + reports."""
import time
import numpy as np
import pandas as pd
from .config import load_config, DATA, RESULTS, BLOCKS, LABELS
from .synthetic import generate
from .pv import add_power, capacity_factor
from .forecast import build_features, train_and_predict, metrics, save_report
from .regimes import tag_days
from .dispatch import Day, run_all


def day_from_frame(g, date):
    return Day(date, g["actual_mw"].to_numpy(), g["nwp_mw"].to_numpy(), g["p10"].to_numpy(), g["p50"].to_numpy(),
               g["p90"].to_numpy(), g["cs_mw"].to_numpy())


def _work(day, cfg):
    out = run_all(day, cfg)
    rows = [{"date": day.date, "strategy": s, **r["kpis"]} for s, r in out.items()]
    blocks = pd.DataFrame([{"date": day.date, "strategy": s, "blk": k, "t": LABELS[k],
                            **{n: float(r[n][k]) for n in ["solar_avail", "schedule", "injection", "curtailed", "charge",
                                                           "discharge", "soc", "deviation", "penalty_inr"]}}
                           for s, r in out.items() for k in range(BLOCKS)])
    return rows, blocks


def main():
    cfg = load_config(); t0 = time.time()
    DATA.mkdir(parents=True, exist_ok=True); RESULTS.mkdir(parents=True, exist_ok=True)
    df = add_power(generate(cfg), cfg)
    cf = capacity_factor(df, cfg)
    print(f"[pv] annual capacity factor (AC) = {cf:.1%}  (expect mid-20s to ~30%)")
    daily = tag_days(df)
    f = build_features(df)
    full, out, qhat = train_and_predict(f, cfg)
    full["regime"] = pd.Series(full.index.floor("D"), index=full.index).map(daily["regime"]).to_numpy()
    out["regime"] = pd.Series(out.index.floor("D"), index=out.index).map(daily["regime"]).to_numpy()
    res, by, cal = metrics(out, cfg, qhat)
    save_report(res, by, cal)
    print("[forecast]", res)
    df.to_parquet(DATA / "weather.parquet"); full.to_parquet(DATA / "forecast_test.parquet"); daily.to_parquet(DATA / "daily.parquet")
    dates = sorted({d.strftime("%Y-%m-%d") for d in full.index})
    parts = []
    for i, d in enumerate(dates, 1):
        parts.append(_work(day_from_frame(full.loc[d], d), cfg))
        if i % 50 == 0:
            print(f"[backtest] {i}/{len(dates)} days")
    pd.DataFrame([r for rows, _ in parts for r in rows]).to_parquet(RESULTS / "daily_kpis.parquet")
    pd.concat([b for _, b in parts]).to_parquet(RESULTS / "dispatch_blocks.parquet")
    print(f"[backtest] {len(dates)} days x 3 strategies in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()