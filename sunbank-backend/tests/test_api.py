import pytest
from fastapi.testclient import TestClient
from app.api import app
from app.store import get_store

pytestmark = pytest.mark.skipif(not get_store().ready, reason="run make build first")
c = TestClient(app)
D = "2024-07-18"


def test_all_get_endpoints():
    for u in ["/api/config", f"/api/forecast?date={D}", f"/api/dispatch?date={D}&strategy=rule", f"/api/compare?date={D}",
              "/api/backtest/summary", "/api/problem-proof", "/api/scenario?regime=monsoon", f"/api/bess?date={D}",
              f"/api/events?date={D}&strategy=sunbank"]:
        assert c.get(u).status_code == 200, u


def test_shapes():
    f = c.get(f"/api/forecast?date={D}").json()
    assert len(f["blocks"]) == 96 and set(f["blocks"][0]) == {"t", "p10", "p50", "p90", "actual", "clearsky"}
    assert all(b["p10"] <= b["p50"] <= b["p90"] for b in f["blocks"])
    assert 70 <= f["metrics"]["coverage"] <= 90
    assert len(c.get(f"/api/dispatch?date={D}").json()["blocks"]) == 96


def test_simulate_responds_to_sliders():
    body = {"date": D, "limit_mw": 30, "bess_mw": 20, "bess_mwh": 80, "risk_mode": "p50", "price_mode": "flat"}
    a = c.post("/api/simulate", json=body).json()
    body["bess_mwh"] = 20
    b = c.post("/api/simulate", json=body).json()
    assert a["sunbank"]["curtailed_mwh"] <= b["sunbank"]["curtailed_mwh"]


def test_bad_date():
    assert c.get("/api/compare?date=2020-01-01").status_code == 404
