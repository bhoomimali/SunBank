"""Synthetic but physically-shaped weather for Bhadla. Replace with ERA5/Open-Meteo later (same columns)."""
import numpy as np
import pandas as pd
from pvlib.location import Location

KT = {1: .94, 2: .96, 3: .97, 4: .97, 5: .96, 6: .86, 7: .68, 8: .70, 9: .80, 10: .95, 11: .94, 12: .92}
KT_STD = {1: .12, 2: .10, 3: .07, 4: .05, 5: .06, 6: .14, 7: .18, 8: .18, 9: .16, 10: .08, 11: .09, 12: .12}
TMAX = {1: 23, 2: 27, 3: 33, 4: 39, 5: 43, 6: 42, 7: 36, 8: 34, 9: 35, 10: 35, 11: 29, 12: 24}


def _hourly_to_15min(vals, days, idx):
    ts = pd.DatetimeIndex([d + pd.Timedelta(hours=h) for d in days for h in range(24)]).tz_localize(idx.tz)
    s = pd.Series(vals, index=ts).reindex(idx.union(ts)).interpolate(method="time").reindex(idx)
    return s.bfill().ffill().to_numpy()


def generate(cfg):
    sc, site = cfg["synthetic"], cfg["site"]
    rng = np.random.default_rng(sc["seed"])
    idx = pd.date_range(sc["start"], sc["end"] + " 23:45", freq="15min", tz=site["tz"])
    loc = Location(site["lat"], site["lon"], tz=site["tz"], altitude=site["altitude_m"])
    sp = loc.get_solarposition(idx)
    cs = loc.get_clearsky(idx, model="ineichen", linke_turbidity=site["linke_turbidity"])
    days = pd.date_range(sc["start"], sc["end"], freq="D")
    kt_h, nwp_h, aod_d, tmax_d, fog_d, ktd_obs = [], [], [], [], [], []
    res = 0.0
    for d in days:
        m = d.month
        res = 0.55 * res + rng.normal(0, KT_STD[m])
        kd = float(np.clip(KT[m] + res, 0.12, 0.97))
        aod = float(np.clip(rng.normal({10: .55, 11: .55, 4: .35, 5: .38, 6: .38}.get(m, .22),
                                       .2 if m in (10, 11) else .1), .05, 1.2))
        kd_pre = kd
        kd *= 1 - 0.2 * np.clip(aod - 0.3, 0, 0.8)
        mon = m in (6, 7, 8, 9)
        h = np.clip(kd + rng.normal(0, .20 if mon else .05, 24), .05, 1.0)
        fog = m in (12, 1, 2) and rng.random() < .30
        hn = h.copy()
        if fog:
            h[6:10] *= .30; h[5] *= .6; h[10] *= .6
        n_base = .35 * hn + .65 * kd_pre * (1 - .1 * np.clip(aod - .3, 0, .8))
        n = np.clip(n_base + rng.normal(0, .18 if mon else .10) + rng.normal(0, .14 if mon else .08, 24), .05, 1.0)
        kt_h.append(h); nwp_h.append(n); aod_d.append(aod); fog_d.append(fog)
        tmax_d.append(TMAX[m] + rng.normal(0, 2) - 5 * (1 - kd))
    kt15 = _hourly_to_15min(np.concatenate(kt_h), days, idx)
    nk15 = _hourly_to_15min(np.concatenate(nwp_h), days, idx)
    di = ((idx.floor("D") - idx[0].floor("D")).days).to_numpy()
    tmax = np.array(tmax_d)[di]
    tmin = tmax - 13
    hr = idx.hour.to_numpy() + idx.minute.to_numpy() / 60
    temp = (tmax + tmin) / 2 + (tmax - tmin) / 2 * np.sin(2 * np.pi * (hr - 9) / 24)
    bias = rng.normal(0, 1.5, len(days))[di]
    df = pd.DataFrame({
        "ghi": kt15 * cs["ghi"].to_numpy(), "nwp_ghi": nk15 * cs["ghi"].to_numpy(),
        "cs_ghi": cs["ghi"].to_numpy(), "temp": temp, "nwp_temp": temp + bias,
        "nwp_cloud": np.clip((1 - nk15) * 115 + rng.normal(0, 4, len(idx)), 0, 100),
        "aod": np.array(aod_d)[di], "fog": np.array(fog_d)[di],
        "zenith": sp["zenith"].to_numpy(), "apparent_zenith": sp["apparent_zenith"].to_numpy(),
        "azimuth": sp["azimuth"].to_numpy(),
    }, index=idx)
    return df
