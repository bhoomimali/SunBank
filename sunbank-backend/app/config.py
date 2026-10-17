import copy
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "processed"
RESULTS = ROOT / "results"
REPORTS = ROOT / "reports"
BLOCKS, DT = 96, 0.25
LABELS = [f"{(i * 15) // 60:02d}:{(i * 15) % 60:02d}" for i in range(BLOCKS)]


def load_config(path=None):
    with open(path or ROOT / "config" / "config.yaml") as f:
        return yaml.safe_load(f)


def override(cfg, limit_mw=None, bess_mw=None, bess_mwh=None, risk_mode=None, price_mode=None):
    c = copy.deepcopy(cfg)
    if limit_mw is not None: c["grid"]["limit_mw"] = float(limit_mw)
    if bess_mw is not None: c["bess"]["mw"] = float(bess_mw)
    if bess_mwh is not None: c["bess"]["mwh"] = float(bess_mwh)
    if risk_mode: c["optimizer"]["risk_mode"] = {"aggressive": "p50"}.get(risk_mode, risk_mode)
    if price_mode: c["market"]["mode"] = {"flat": "flat_ppa", "flat_ppa": "flat_ppa", "tod_peak": "market", "market": "market"}[price_mode]
    return c
