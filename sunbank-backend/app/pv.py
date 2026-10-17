import numpy as np
import pandas as pd
from pvlib import irradiance


def ghi_to_mw(ghi, temp, df, cfg):
    p = cfg["plant"]
    ghi = np.asarray(ghi, float)
    dec = irradiance.erbs(pd.Series(ghi, index=df.index), pd.Series(df["zenith"].to_numpy(), index=df.index),
                          df.index.dayofyear)
    dni = pd.Series(np.clip(np.nan_to_num(np.asarray(dec["dni"], float)), 0, 1100), index=df.index)
    dhi = pd.Series(np.clip(np.nan_to_num(np.asarray(dec["dhi"], float)), 0, None), index=df.index)
    poa = irradiance.get_total_irradiance(p["tilt_deg"], p["azimuth_deg"], df["apparent_zenith"], df["azimuth"],
                                          dni, pd.Series(ghi, index=df.index), dhi, albedo=0.25,
                                          model="isotropic")["poa_global"].fillna(0).clip(lower=0).to_numpy()
    tc = np.asarray(temp) + p["noct_rise_per_wm2"] * poa
    dc = p["dc_mwp"] * poa / 1000 * (1 + p["temp_coeff_per_c"] * (tc - 25)) * (1 - p["soiling"]) * (1 - p["other_losses"])
    return np.clip(dc * p["inverter_eff"], 0, p["ac_mw"])


def add_power(df, cfg):
    df = df.copy()
    df["actual_mw"] = ghi_to_mw(df["ghi"], df["temp"], df, cfg)
    df["nwp_mw"] = ghi_to_mw(df["nwp_ghi"], df["nwp_temp"], df, cfg)
    df["cs_mw"] = ghi_to_mw(df["cs_ghi"], df["temp"], df, cfg)
    return df


def capacity_factor(df, cfg):
    return float(df["actual_mw"].mean() / cfg["plant"]["ac_mw"])
