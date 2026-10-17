import numpy as np
from .config import BLOCKS


def price_curve(cfg):
    """Rs/MWh per block. 'market' is a SYNTHETIC IEX-like shape until real IEX data is loaded."""
    m = cfg["market"]
    flat = m["flat_tariff_inr_per_mwh"]
    if m["mode"] == "flat_ppa":
        return np.full(BLOCKS, float(flat))
    h = np.arange(BLOCKS) * 0.25
    return flat * (1 - 0.35 * np.exp(-((h - 13) / 3) ** 2) + 1.2 * np.exp(-((h - 20) / 1.6) ** 2))


def evening_weights(cfg):
    w = np.zeros(BLOCKS)
    w[cfg["market"]["evening_start_block"]:cfg["market"]["evening_end_block"]] = 1.0
    return w
