import numpy as np
import pytest
from app.config import load_config, BLOCKS
from app import dsm
from app.dispatch import Day, run_none, run_rule, run_sunbank
from app.optimizer import solve

CFG = load_config()


def synth_day(scale=1.0, cloud=False):
    h = np.arange(BLOCKS) * .25
    cs = np.clip(55 * np.sin(np.pi * (h - 6) / 12.5), 0, None) * (h > 6) * (h < 18.5) * scale
    act = cs * (np.where((h > 11) & (h < 13), .6, 1) if cloud else 1)
    return Day("t", act, cs * .97, cs * .85, cs * .97, cs * 1.05, cs)


def test_dsm_band_edges():
    sch = np.full(4, 20.0); band = dsm.band_mw(CFG)
    inj = np.array([20 + band, 20 + band + .1, 20 - band, 20 - band - 1])
    _, inb, pen = dsm.evaluate(sch, inj, CFG)
    assert inb.tolist() == [True, False, True, False]
    assert pen[0] == 0 and pen[2] == 0 and pen[1] > 0 and pen[3] > pen[1]


@pytest.mark.parametrize("fn", [run_none, run_rule, run_sunbank])
@pytest.mark.parametrize("day", [synth_day(), synth_day(cloud=True), synth_day(scale=0)])
def test_physical_limits(fn, day):
    r = fn(day, CFG); b = CFG["bess"]; E = b["mwh"]
    assert r["soc"].min() >= b["soc_min"] * 100 - 1e-6 and r["soc"].max() <= b["soc_max"] * 100 + 1e-6 or fn is run_none
    assert r["charge"].max() <= b["mw"] + 1e-6 and r["discharge"].max() <= b["mw"] + 1e-6
    assert (r["charge"] * r["discharge"] > 1e-9).sum() == 0
    assert r["injection"].max() <= CFG["grid"]["limit_mw"] + 1e-6
    # energy balance: available - curtailed - charge + discharge = injection
    bal = r["solar_avail"] - r["curtailed"] - r["charge"] + r["discharge"] - r["injection"]
    assert np.abs(bal).sum() * .25 <= 1e-3 * max(r["solar_avail"].sum() * .25, 1)


def test_battery_recovers_curtailment():
    d = synth_day()
    usable = (CFG["bess"]["soc_max"] - CFG["bess"]["soc_start"]) * CFG["bess"]["mwh"]  # MWh of headroom
    saved = run_none(d, CFG)["kpis"]["curtailed_mwh"] - run_sunbank(d, CFG)["kpis"]["curtailed_mwh"]
    assert saved >= 0.8 * usable  # day has more surplus than the battery can hold, so it should fill up


def test_milp_exclusivity():
    a = np.full(8, 40.0); p = np.full(8, 2500.0)
    r = solve(a, p, np.zeros(8), 16.0, CFG, use_milp=True)
    assert r["ok"] and (r["c"] * r["d"] < 1e-6).all()


def test_zero_sun_day_feasible():
    r = run_sunbank(synth_day(scale=0), CFG)
    assert r["kpis"]["delivered_mwh"] >= 0
