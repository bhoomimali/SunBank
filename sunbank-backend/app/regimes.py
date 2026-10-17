import numpy as np
import pandas as pd

LABEL = {"clear": "Clear Sky", "winter_fog": "Winter Fog", "monsoon": "Monsoon",
         "summer_heat": "Summer Heat", "stubble_haze": "Stubble Haze", "normal": "Other"}


def tag_days(df):
    day = df.index.floor("D")
    g = df.assign(d=day).groupby("d")
    daily = pd.DataFrame({
        "kt": g["ghi"].sum() / g["cs_ghi"].sum(),
        "tmax": g["temp"].max(), "ghi_peak": g["ghi"].max(), "aod": g["aod"].mean(),
    })
    m = daily.index.month
    r = np.full(len(daily), "normal", dtype=object)
    r[(daily.kt > .85).to_numpy()] = "clear"
    r[(np.isin(m, [4, 5, 6]) & (daily.tmax >= 40) & (daily.kt > .8)).to_numpy()] = "summer_heat"
    r[(np.isin(m, [7, 8, 9]) & (daily.kt < .65)).to_numpy()] = "monsoon"
    r[(np.isin(m, [12, 1]) & (daily.kt < .70)).to_numpy()] = "winter_fog"
    r[(np.isin(m, [10, 11]) & (daily.aod > .5)).to_numpy()] = "stubble_haze"
    daily["regime"] = r
    return daily


def representative(daily, regime, n=6):
    d = daily[daily.regime == regime]
    if len(d) <= n:
        return list(d.index.strftime("%Y-%m-%d"))
    pick = (d.kt - d.kt.median()).abs().nsmallest(n).index
    return sorted(pick.strftime("%Y-%m-%d"))
