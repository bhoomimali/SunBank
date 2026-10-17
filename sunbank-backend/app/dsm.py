"""DSM engine. Penalty = energy outside the +/-band x reference rate x multiplier.
VERIFY the formula against CERC DSM Regulations 2024 + the 2026 order before claiming compliance."""
import numpy as np
from .config import DT


def band_mw(cfg):
    return cfg["dsm"]["band_pct"] / 100.0 * cfg["plant"]["ac_mw"]


def evaluate(schedule, injection, cfg):
    dev = np.asarray(injection, float) - np.asarray(schedule, float)
    band = band_mw(cfg)
    excess = np.maximum(0.0, np.abs(dev) - band)
    penalty = excess * DT * cfg["dsm"]["rate_inr_per_mwh"] * cfg["dsm"]["multiplier"]
    return dev, np.abs(dev) <= band + 1e-9, penalty
