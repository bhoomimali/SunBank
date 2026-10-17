# SunBank backend (CodeNoir 2026 prototype)

Pilot: 50 MW solar + 20 MW / 80 MWh BESS at Bhadla. **All weather data is SYNTHETIC for now**; swap `app/synthetic.py`
for ERA5 / Open-Meteo loaders that return the same columns (see `generate()`), nothing else changes.

## Run
    make setup && make build && make test && make api     # or: make demo
Frontend: in the React project create `.env.local`
    VITE_USE_MOCK=false
    VITE_API_BASE_URL=http://localhost:8000
then `npm run dev`.

## Pipeline
synthetic weather -> pvlib PV model -> LightGBM P10..P90 + conformal calibration -> DSM engine ->
strategies (none / rule / sunbank) -> backtest (366 test days) -> parquet -> FastAPI.
Split (by time): train to 2023-06, calibrate 2023-07..12, test 2024.

## Definitions
curtailed = sum(avail - used)*dt | recovered % = (none - sunbank)/none | in-band % = daytime blocks with |inj - schedule| <= 5% of 50 MW |
net value = price*injection - DSM penalty - degradation.
DSM penalty (IMPLEMENTED, verify vs CERC order): excess MW beyond band * 0.25 h * rate * multiplier (config).

## Honest scope
Not modelled: live SCADA/Modbus, satellite ingestion, schedule revisions (config only), real IEX prices (market mode is a synthetic shape).
Rule battery (B1) uses the same schedule as B0 per the PRD, so its unscheduled evening discharge is penalised by DSM.
Every tagged ASSUMPTION in config/config.yaml must appear in the Method & Assumptions drawer.
