import numpy as np
from .config import DT


def twin(blocks, ambient, cfg):
    b = cfg["bess"]
    c, d = np.asarray(blocks["charge"]), np.asarray(blocks["discharge"])
    thr = float((c + d).sum() * DT)
    loss = float((c * (1 - b["eta_charge"]) + d * (1 / b["eta_discharge"] - 1)).sum() * DT)
    T, temps = float(ambient[0]), []
    a = DT / b["thermal_tau_h"]
    for k in range(len(c)):
        T += a * ((ambient[k] + b["thermal_k_c_per_mw"] * (c[k] + d[k])) - T)
        temps.append(round(T, 1))
    return {"soc": [round(float(x), 2) for x in blocks["soc"]], "throughput_mwh": round(thr, 2),
            "cycles": round(thr / (2 * b["mwh"]), 3), "rt_loss_mwh": round(loss, 2),
            "degradation_inr": round(thr * b["deg_inr_per_mwh"]), "temp_model": temps}
