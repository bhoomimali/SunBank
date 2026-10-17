"""Day-ahead probabilistic forecast: LightGBM quantiles + conformalized (CQR) calibration."""
import json
import numpy as np
import pandas as pd
import lightgbm as lgb
from .config import REPORTS
from .regimes import LABEL

ALPHAS = [0.1, 0.3, 0.5, 0.7, 0.9]
FEATS = ["nwp_mw", "cs_mw", "nwp_kt", "nwp_cloud", "nwp_temp", "aod", "zen", "hsin", "hcos", "dsin", "dcos", "prev_day_err"]


def build_features(df):
    f = df.copy()
    f["nwp_kt"] = (f["nwp_ghi"] / f["cs_ghi"].where(f["cs_ghi"] > 1)).fillna(0).clip(0, 1.2)
    f["zen"] = f["zenith"]
    h = f.index.hour + f.index.minute / 60
    f["hsin"], f["hcos"] = np.sin(2 * np.pi * h / 24), np.cos(2 * np.pi * h / 24)
    doy = f.index.dayofyear
    f["dsin"], f["dcos"] = np.sin(2 * np.pi * doy / 365.25), np.cos(2 * np.pi * doy / 365.25)
    day = f.index.floor("D")
    dm = f["cs_mw"] > 0.05
    err = (f["actual_mw"] - f["nwp_mw"]).where(dm).groupby(day).mean()
    f["prev_day_err"] = pd.Series(day, index=f.index).map(err.shift(1)).fillna(0).to_numpy()
    f["persist_mw"] = f["actual_mw"].shift(96).fillna(0)
    f["daytime"] = dm
    return f


def _split(f, cfg):
    d = f.index.tz_localize(None)
    t1 = pd.Timestamp(cfg["split"]["train_end"]) + pd.Timedelta(days=1)
    t2 = pd.Timestamp(cfg["split"]["calib_end"]) + pd.Timedelta(days=1)
    tr = d < t1
    ca = (d >= t1) & (d < t2)
    te = d >= t2
    return tr & f["daytime"].to_numpy(), ca & f["daytime"].to_numpy(), te


def pinball(y, q, a):
    e = y - q
    return float(np.mean(np.maximum(a * e, (a - 1) * e)))


def train_and_predict(f, cfg):
    ac = cfg["plant"]["ac_mw"]
    tr, ca, te = _split(f, cfg)
    models = {a: lgb.LGBMRegressor(objective="quantile", alpha=a, n_estimators=300, learning_rate=0.05, num_leaves=31,
                                   min_child_samples=40, subsample=0.8, subsample_freq=1, colsample_bytree=0.9,
                                   verbose=-1, random_state=1).fit(f.loc[tr, FEATS], f.loc[tr, "actual_mw"])
              for a in ALPHAS}
    def raw(mask):
        q = np.column_stack([models[a].predict(f.loc[mask, FEATS]) for a in ALPHAS])
        return np.sort(np.clip(q, 0, ac), axis=1)
    qc = raw(ca)
    yc = f.loc[ca, "actual_mw"].to_numpy()
    score = np.maximum(qc[:, 0] - yc, yc - qc[:, -1])
    n = len(score)
    qhat = float(np.quantile(score, min(1.0, np.ceil((n + 1) * 0.8) / n)))
    out = f.loc[te & f["daytime"].to_numpy()].copy()
    q = raw(te & f["daytime"].to_numpy())
    out["p10_raw"], out["p90_raw"] = q[:, 0], q[:, -1]
    out["p50"] = q[:, 2]
    out["p10"] = np.clip(np.minimum(q[:, 0] - qhat, q[:, 2]), 0, ac)
    out["p90"] = np.clip(np.maximum(q[:, -1] + qhat, q[:, 2]), 0, ac)
    for i, a in enumerate(ALPHAS): out[f"q{int(a * 100)}"] = q[:, i]
    full = f.loc[te].copy()
    for c in ["p10", "p50", "p90"]: full[c] = 0.0
    full.loc[out.index, ["p10", "p50", "p90"]] = out[["p10", "p50", "p90"]].to_numpy()
    return full, out, qhat


def metrics(out, cfg, qhat):
    ac = cfg["plant"]["ac_mw"]
    y, p50, raw, per = (out[c].to_numpy() for c in ["actual_mw", "p50", "nwp_mw", "persist_mw"])
    mae = lambda p: float(np.mean(np.abs(y - p)))
    cover = lambda m: float(np.mean((y[m] >= out["p10"].to_numpy()[m]) & (y[m] <= out["p90"].to_numpy()[m])) * 100)
    pin = np.mean([pinball(y, out["p10"], .1), pinball(y, out["p50"], .5), pinball(y, out["p90"], .9)])
    allm = np.ones(len(y), bool)
    by = []
    for r, lab in LABEL.items():
        m = (out["regime"] == r).to_numpy()
        if m.sum() < 20 or r == "normal": continue
        by.append({"regime": lab, "nmae": round(float(np.mean(np.abs(y[m] - p50[m])) / ac * 100), 2), "coverage": round(cover(m), 1)})
    cal = []
    for a in ALPHAS:
        col = {0.1: "p10", 0.9: "p90"}.get(a, f"q{int(a * 100)}")
        cal.append({"nominal": int(a * 100), "observed": round(float(np.mean(y <= out[col].to_numpy()) * 100), 1)})
    res = {"nmae": round(mae(p50) / ac * 100, 2), "nrmse": round(float(np.sqrt(np.mean((y - p50) ** 2)) / ac * 100), 2),
           "pinball": round(float(pin), 3), "coverage": round(cover(allm), 1),
           "skill_vs_raw": round((1 - mae(p50) / mae(raw)) * 100, 1),
           "skill_vs_persistence": round((1 - mae(p50) / mae(per)) * 100, 1),
           "cqr_qhat_mw": round(qhat, 3), "test_blocks": int(len(y))}
    return res, by, cal


def save_report(res, by, cal):
    REPORTS.mkdir(exist_ok=True, parents=True)
    (REPORTS / "forecast_metrics.json").write_text(json.dumps({"metrics": res, "by_regime": by, "calibration": cal}, indent=2))
    lines = ["# Forecast metrics (time-held-out test set, daytime blocks, SYNTHETIC data)", ""] + [f"- {k}: {v}" for k, v in res.items()]
    (REPORTS / "forecast_metrics.md").write_text("\n".join(lines) + "\n")
