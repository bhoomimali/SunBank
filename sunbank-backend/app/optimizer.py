"""Battery dispatch LP / MILP (scipy HiGHS). Variables per block: u (solar used), c, d, s (SoC MWh), i (injection), e (DSM excess)."""
import numpy as np
from scipy.optimize import milp, LinearConstraint, Bounds
from .config import DT


def solve(a, price, tb, s0, cfg, sch=None, use_milp=False, s_target=None):
    """a: available solar MW per remaining block. sch: declared schedule (None => no DSM term). Returns dict of arrays."""
    n = len(a)
    b, L = cfg["bess"], cfg["grid"]["limit_mw"]
    E, P = b["mwh"], b["mw"]
    smin, smax = b["soc_min"] * E, b["soc_max"] * E
    ec, ed = b["eta_charge"], b["eta_discharge"]
    s0 = float(np.clip(s0, smin, smax))
    s_target = s0 if s_target is None else s_target
    pen = cfg["dsm"]["rate_inr_per_mwh"] * cfg["dsm"]["multiplier"]
    band = cfg["dsm"]["band_pct"] / 100 * cfg["plant"]["ac_mw"]
    U, C, D, S, I, EX = (np.arange(n) + k * n for k in range(6))
    W = 6 * n
    nv = 6 * n + 1 + (n if use_milp else 0)
    BI = 6 * n + 1 + np.arange(n)
    cost = np.zeros(nv)
    cost[I] = -price * DT
    cost[C] = b["deg_inr_per_mwh"] * DT
    cost[D] = b["deg_inr_per_mwh"] * DT - tb * DT
    cost[EX] = (pen * DT) if sch is not None else 0.0
    cost[W] = 1.2 * float(np.max(price))
    lb = np.zeros(nv); ub = np.full(nv, np.inf)
    ub[U] = np.maximum(a, 0); ub[C] = P; ub[D] = P; lb[S] = smin; ub[S] = smax; ub[I] = L
    if use_milp: ub[BI] = 1
    # equalities
    A_eq = np.zeros((2 * n, nv)); rhs = np.zeros(2 * n)
    for t in range(n):
        A_eq[t, I[t]] = 1; A_eq[t, U[t]] = -1; A_eq[t, C[t]] = 1; A_eq[t, D[t]] = -1
        r = n + t
        A_eq[r, S[t]] = 1; A_eq[r, C[t]] = -ec * DT; A_eq[r, D[t]] = DT / ed
        if t == 0: rhs[r] = s0
        else: A_eq[r, S[t - 1]] = -1
    rows, lo, hi = [], [], []
    def add(vec_idx, vec_val, l, h):
        row = np.zeros(nv); row[vec_idx] = vec_val; rows.append(row); lo.append(l); hi.append(h)
    if sch is not None:
        for t in range(n):
            add([I[t], EX[t]], [1, -1], -np.inf, sch[t] + band)
            add([I[t], EX[t]], [-1, -1], -np.inf, band - sch[t])
    add([S[n - 1], W], [1, 1], s_target, np.inf)
    if use_milp:
        for t in range(n):
            add([C[t], BI[t]], [1, -P], -np.inf, 0)
            add([D[t], BI[t]], [1, P], -np.inf, P)
    cons = [LinearConstraint(A_eq, rhs, rhs), LinearConstraint(np.array(rows), np.array(lo), np.array(hi))]
    integ = np.zeros(nv); 
    if use_milp: integ[BI] = 1
    res = milp(cost, constraints=cons, integrality=integ, bounds=Bounds(lb, ub))
    if not res.success or res.x is None:
        z = np.zeros(n)
        return {"ok": False, "u": np.minimum(a, L), "c": z, "d": z, "s": np.full(n, s0), "i": np.minimum(a, L), "e": z}
    x = res.x
    return {"ok": True, "u": x[U], "c": x[C], "d": x[D], "s": x[S], "i": x[I], "e": x[EX]}
