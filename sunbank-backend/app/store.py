import json
from functools import lru_cache
import pandas as pd
from .config import load_config, DATA, RESULTS, REPORTS


class Store:
    def __init__(self):
        self.cfg = load_config()
        try:
            self.fc = pd.read_parquet(DATA / "forecast_test.parquet")
            self.weather = pd.read_parquet(DATA / "weather.parquet")
            self.daily = pd.read_parquet(DATA / "daily.parquet")
            self.kpis = pd.read_parquet(RESULTS / "daily_kpis.parquet")
            self.blocks = pd.read_parquet(RESULTS / "dispatch_blocks.parquet")
            self.fmetrics = json.loads((REPORTS / "forecast_metrics.json").read_text())
            self.ready = True
        except FileNotFoundError:
            self.ready = False
        if self.ready:
            self.dates = sorted({d.strftime("%Y-%m-%d") for d in self.fc.index})
            self.blocks_idx = self.blocks.set_index(["date", "strategy"]).sort_index()
            self.kpis_idx = self.kpis.set_index(["date", "strategy"]).sort_index()

    def day_frame(self, date):
        return self.fc.loc[date]


@lru_cache(maxsize=1)
def get_store():
    return Store()
