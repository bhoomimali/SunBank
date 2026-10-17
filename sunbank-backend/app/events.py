import numpy as np
from .config import LABELS
from .dsm import band_mw


def make_events(blocks, fc, cfg, strategy, limit=60):
    """One line per notable block, every line traces to a number in the dispatch result. Newest first."""
    L, band, ev = cfg["grid"]["limit_mw"], band_mw(cfg), []
    for k in range(96):
        t = LABELS[k]
        a, c, d, cu = blocks["solar_avail"][k], blocks["charge"][k], blocks["discharge"][k], blocks["curtailed"][k]
        soc, pen, dev = blocks["soc"][k], blocks["penalty_inr"][k], blocks["deviation"][k]
        if fc is not None and k % 8 == 4 and fc["p90"][k] > 0.5:
            ev.append({"t": t, "tag": "FCST", "text": f"Block {k+1}: P10/P50/P90 = {fc['p10'][k]:.1f}/{fc['p50'][k]:.1f}/{fc['p90'][k]:.1f} MW"})
        if c > 0.05:
            ev.append({"t": t, "tag": "OPT", "text": f"Block {k+1}: solar {a:.1f} MW vs {L:.0f} MW limit, charge {c:.1f} MW, SoC {soc:.0f}%"})
        if d > 0.05:
            ev.append({"t": t, "tag": "OPT", "text": f"Block {k+1}: discharge {d:.1f} MW, SoC {soc:.0f}%"})
        if cu > 0.05:
            ev.append({"t": t, "tag": "DSM", "text": f"Block {k+1}: {cu:.1f} MW curtailed ({a:.1f} MW available, {L:.0f} MW limit)"})
        if pen > 0:
            ev.append({"t": t, "tag": "DSM", "text": f"Block {k+1}: deviation {dev:+.1f} MW outside +/-{band:.1f} MW band, penalty Rs {pen:,.0f}"})
    return ev[::-1][:limit]
