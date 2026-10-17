// src/api.ts
// SunBank API client and deterministic mock implementation

export interface PlantConfig {
  ac_mw: number;
  dc_mwp: number;
}

export interface BessConfig {
  mw: number;
  mwh: number;
  soc_min: number;
  soc_max: number;
  rte: number;
}

export interface DataSourceItem {
  name: string;
  range: string;
}

export interface ConfigResponse {
  plant: PlantConfig;
  bess: BessConfig;
  grid_limit_mw: number;
  band_pct: number;
  assumptions: string[];
  sources: DataSourceItem[];
  data_mode: 'MOCK' | 'LIVE';
  co2_factor_t_per_mwh?: number;
}

export interface ForecastBlock {
  t: string; // HH:MM
  p10: number;
  p50: number;
  p90: number;
  actual: number;
  clearsky: number;
}

export interface ForecastMetrics {
  nmae: number;
  nrmse: number;
  pinball: number;
  coverage: number;
  skill_vs_raw: number;
  skill_vs_persistence: number;
}

export interface RegimeMetric {
  regime: string;
  nmae: number;
  coverage: number;
}

export interface CalibrationPoint {
  nominal: number;
  observed: number;
}

export interface ForecastResponse {
  blocks: ForecastBlock[];
  metrics: ForecastMetrics;
  by_regime: RegimeMetric[];
  calibration: CalibrationPoint[];
}

export interface DispatchBlock {
  t: string; // HH:MM
  solar_avail: number;
  schedule: number;
  injection: number;
  curtailed: number;
  charge: number;
  discharge: number;
  soc: number;
  deviation: number;
  penalty_inr: number;
}

export interface StrategyKPIs {
  curtailed_mwh: number;
  delivered_mwh: number;
  evening_shifted_mwh: number;
  in_band_pct: number;
  penalty_inr: number;
  net_value_inr: number;
  cycles: number;
}

export interface DispatchResponse {
  blocks: DispatchBlock[];
  kpis: StrategyKPIs;
}

export interface CompareResponse {
  none: StrategyKPIs;
  rule: StrategyKPIs;
  sunbank: StrategyKPIs;
  deltas: {
    curtailment_saved_mwh: number;
    revenue_gain_inr: number;
    penalty_avoided_inr: number;
    in_band_gain_pct: number;
  };
}

export interface MonthBacktest {
  month: string;
  none: StrategyKPIs;
  rule: StrategyKPIs;
  sunbank: StrategyKPIs;
}

export interface BacktestSummaryResponse {
  months: MonthBacktest[];
  total: {
    none: StrategyKPIs;
    rule: StrategyKPIs;
    sunbank: StrategyKPIs;
  };
  recovered_pct: number;
  days: number;
}

export interface LimitSweepItem {
  limit_pct: number;
  curtailed_pct: number;
}

export interface ProblemProofResponse {
  limit_sweep: LimitSweepItem[];
  inband_baseline_pct: number;
  baseline_penalty_inr: number;
}

export interface ScenarioDay {
  date: string;
  tmax: number;
  ghi_peak: number;
  compare: {
    none: StrategyKPIs;
    rule: StrategyKPIs;
    sunbank: StrategyKPIs;
  };
}

export interface ScenarioResponse {
  days: ScenarioDay[];
  summary: {
    avg_curtailment: number;
    in_band_pct: number;
    nmae: number;
  };
}

export interface SimulateRequest {
  date: string;
  limit_mw: number;
  bess_mw: number;
  bess_mwh: number;
  risk_mode: 'conservative' | 'balanced' | 'aggressive' | 'p50' | 'risk_aware';
  price_mode: 'flat' | 'tod_peak' | 'flat_ppa' | 'market';
}

export interface BessResponse {
  soc: number[];
  throughput_mwh: number;
  cycles: number;
  rt_loss_mwh: number;
  degradation_inr: number;
  temp_model: number[];
}

export interface EventItem {
  t: string;
  tag: 'FCST' | 'OPT' | 'DSM';
  text: string;
}

export type DispatchStrategy = 'none' | 'rule' | 'sunbank';

export const AVAILABLE_DATES = [
  '2024-03-15',
  '2024-05-22',
  '2024-07-18',
  '2024-10-14',
  '2024-12-08',
];

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
export const VITE_USE_MOCK =
  import.meta.env.VITE_USE_MOCK !== undefined
    ? import.meta.env.VITE_USE_MOCK === 'true'
    : true;

// MOCK: replace with backend
// Deterministic fixtures and physics models for Bhadla 50 MW / 20 MW / 80 MWh BESS

function parseTimeString(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Generate 96 blocks of 15-minute time strings (00:00 to 23:45)
export const TIME_BLOCKS_96: string[] = Array.from({ length: 96 }, (_, i) =>
  formatTimeString(i * 15)
);

// Physics-based diurnal solar curve generator
function generateDaySolar(date: string) {
  // Deterministic seed based on date string
  let seed = 0;
  for (let i = 0; i < date.length; i++) seed = (seed * 31 + date.charCodeAt(i)) % 10000;
  const variation = (seed % 20) / 100; // -0.1 to +0.1

  return TIME_BLOCKS_96.map((t, i) => {
    const mins = i * 15;
    // Sunrise at ~06:00 (360 min), Peak at 12:00 (720 min), Sunset at 18:30 (1110 min)
    let clearsky = 0;
    if (mins >= 360 && mins <= 1110) {
      const theta = ((mins - 360) / (1110 - 360)) * Math.PI;
      clearsky = Math.sin(theta) * 48.4; // 48.4 MW peak
    }

    // Actual solar with cloud dips around 11:30 - 13:45
    let actual = clearsky;
    if (mins >= 660 && mins <= 810) {
      const dipFactor = 0.88 + 0.08 * Math.sin((mins / 45) + variation);
      actual = clearsky * dipFactor;
    } else if (mins > 420 && mins < 1050) {
      actual = clearsky * (0.96 + 0.03 * Math.cos(mins / 60));
    }

    // P10, P50, P90 quantile spreads
    const uncertainty = clearsky > 1 ? Math.max(1.2, clearsky * 0.09) : 0;
    const p50 = Number((clearsky * 0.98).toFixed(2));
    const p10 = Number(Math.max(0, p50 - uncertainty * 1.2).toFixed(2));
    const p90 = Number((p50 + uncertainty * 1.15).toFixed(2));

    return {
      t,
      clearsky: Number(clearsky.toFixed(2)),
      actual: Number(actual.toFixed(2)),
      p10,
      p50,
      p90,
    };
  });
}

// Generate dispatch for a strategy
function generateDayDispatch(date: string, strategy: DispatchStrategy): DispatchResponse {
  const solarData = generateDaySolar(date);
  const gridLimit = 30.0;
  const maxChargeRate = 20.0; // 0.25C on 80 MWh
  const maxCapacity = 80.0;
  const minSoC = 10.0;
  const maxSoC = 90.0;
  const rte = 0.88;

  let currentSoC = 20.0; // Starts morning at 20%
  let totalCurtailedMWh = 0;
  let totalDeliveredMWh = 0;
  let totalEveningShiftedMWh = 0;
  let inBandCount = 0;
  let totalPenaltyInr = 0;
  let totalNetValueInr = 0;
  let totalThroughputMWh = 0;

  const blocks: DispatchBlock[] = solarData.map((d, i) => {
    const mins = i * 15;
    const solarAvail = d.actual;

    // Schedule:
    // SunBank uses co-optimized P50 with risk buffer
    // Rule uses raw P50
    // None uses raw actual/clearsky
    let schedule = 0;
    if (strategy === 'sunbank') {
      schedule = Math.min(gridLimit, d.p50);
      if (mins >= 1110 && mins <= 1260) {
        // Evening peak dispatch commitment (18:30 - 21:00)
        schedule = 18.0;
      }
    } else if (strategy === 'rule') {
      schedule = Math.min(gridLimit, d.p50);
      if (mins >= 1140 && mins <= 1260) {
        schedule = 15.0;
      }
    } else {
      // None: Schedule is nominal solar forecast capped at limit
      schedule = Math.min(gridLimit, d.p50);
    }

    let charge = 0;
    let discharge = 0;
    let curtailed = 0;
    let injection = 0;

    if (strategy === 'sunbank') {
      // Intelligent dispatch:
      if (solarAvail > gridLimit) {
        const surplus = solarAvail - gridLimit;
        // Check battery headroom
        const roomMWh = ((maxSoC - currentSoC) / 100) * maxCapacity;
        const maxChargeMWhThisBlock = (maxChargeRate * 15) / 60;
        const potentialChargeMWh = Math.min(
          (surplus * 15) / 60,
          roomMWh / Math.sqrt(rte),
          maxChargeMWhThisBlock
        );
        charge = Number(((potentialChargeMWh * 60) / 15).toFixed(2));
        injection = Number((solarAvail - charge).toFixed(2));
        curtailed = Number(Math.max(0, solarAvail - charge - gridLimit).toFixed(2));
      } else {
        // Solar is under grid limit
        if (mins >= 1110 && mins <= 1260 && currentSoC > minSoC) {
          // Evening peak discharge
          const usableEnergyMWh = ((currentSoC - minSoC) / 100) * maxCapacity;
          const maxDischargeMWhThisBlock = (maxChargeRate * 15) / 60;
          const dischargeMWh = Math.min((18.0 * 15) / 60, usableEnergyMWh, maxDischargeMWhThisBlock);
          discharge = Number(((dischargeMWh * 60) / 15).toFixed(2));
          injection = Number((solarAvail + discharge * Math.sqrt(rte)).toFixed(2));
        } else {
          injection = solarAvail;
        }
      }
    } else if (strategy === 'rule') {
      // Dumb battery: rule-based
      if (solarAvail > gridLimit) {
        const surplus = solarAvail - gridLimit;
        if (currentSoC < maxSoC) {
          charge = Math.min(surplus, maxChargeRate);
          curtailed = Math.max(0, surplus - charge);
          injection = solarAvail - charge - curtailed;
        } else {
          curtailed = surplus;
          injection = gridLimit;
        }
      } else if (mins >= 1140 && currentSoC > minSoC) {
        discharge = Math.min(15.0, maxChargeRate);
        injection = discharge * 0.85;
      } else {
        injection = solarAvail;
      }
    } else {
      // No battery
      if (solarAvail > gridLimit) {
        curtailed = solarAvail - gridLimit;
        injection = gridLimit;
      } else {
        injection = solarAvail;
      }
    }

    // Update SoC
    if (charge > 0) {
      const addedEnergy = ((charge * 15) / 60) * Math.sqrt(rte);
      currentSoC = Math.min(maxSoC, currentSoC + (addedEnergy / maxCapacity) * 100);
      totalThroughputMWh += (charge * 15) / 60;
    } else if (discharge > 0) {
      const drainedEnergy = (discharge * 15) / 60;
      currentSoC = Math.max(minSoC, currentSoC - (drainedEnergy / maxCapacity) * 100);
      totalThroughputMWh += drainedEnergy;
      totalEveningShiftedMWh += drainedEnergy;
    }

    // Block statistics
    const blockCurtailedMWh = (curtailed * 15) / 60;
    const blockDeliveredMWh = (injection * 15) / 60;
    totalCurtailedMWh += blockCurtailedMWh;
    totalDeliveredMWh += blockDeliveredMWh;

    // Deviation from schedule
    const deviation = Number((injection - schedule).toFixed(2));
    const allowedBandMW = Math.max(0.5, schedule * 0.05);
    const isOutBand = schedule > 1.0 && Math.abs(deviation) > allowedBandMW;

    let blockPenaltyInr = 0;
    if (isOutBand) {
      // DSM penalty: ~Rs 4,000 per MWh outside band
      const outMWh = ((Math.abs(deviation) - allowedBandMW) * 15) / 60;
      blockPenaltyInr = Math.round(outMWh * 4200);
      totalPenaltyInr += blockPenaltyInr;
    } else {
      inBandCount++;
    }

    // Base PPA Rs 3,200/MWh, Evening peak premium Rs 4,800/MWh
    const tariff = mins >= 1110 && mins <= 1260 ? 4800 : 3200;
    totalNetValueInr += Math.round(blockDeliveredMWh * tariff - blockPenaltyInr);

    return {
      t: d.t,
      solar_avail: Number(solarAvail.toFixed(2)),
      schedule: Number(schedule.toFixed(2)),
      injection: Number(injection.toFixed(2)),
      curtailed: Number(curtailed.toFixed(2)),
      charge: Number(charge.toFixed(2)),
      discharge: Number(discharge.toFixed(2)),
      soc: Number(currentSoC.toFixed(1)),
      deviation,
      penalty_inr: blockPenaltyInr,
    };
  });

  const inBandPct = Number(((inBandCount / 96) * 100).toFixed(1));
  const cycles = Number((totalThroughputMWh / (maxCapacity * 2)).toFixed(2));

  return {
    blocks,
    kpis: {
      curtailed_mwh: Number(totalCurtailedMWh.toFixed(1)),
      delivered_mwh: Number(totalDeliveredMWh.toFixed(1)),
      evening_shifted_mwh: Number(totalEveningShiftedMWh.toFixed(1)),
      in_band_pct: inBandPct,
      penalty_inr: totalPenaltyInr,
      net_value_inr: totalNetValueInr,
      cycles,
    },
  };
}

// Generate compare object
function generateCompare(date: string): CompareResponse {
  const none = generateDayDispatch(date, 'none').kpis;
  const rule = generateDayDispatch(date, 'rule').kpis;
  const sunbank = generateDayDispatch(date, 'sunbank').kpis;

  return {
    none,
    rule,
    sunbank,
    deltas: {
      curtailment_saved_mwh: Number((none.curtailed_mwh - sunbank.curtailed_mwh).toFixed(1)),
      revenue_gain_inr: sunbank.net_value_inr - none.net_value_inr,
      penalty_avoided_inr: none.penalty_inr - sunbank.penalty_inr,
      in_band_gain_pct: Number((sunbank.in_band_pct - none.in_band_pct).toFixed(1)),
    },
  };
}

// Mock API Call implementations
export const api = {
  async getConfig(): Promise<ConfigResponse> {
    if (!VITE_USE_MOCK && BASE_URL) {
      const res = await fetch(`${BASE_URL}/api/config`);
      if (!res.ok) throw new Error('Failed to fetch /api/config');
      return res.json();
    }
    // MOCK: replace with backend
    return {
      plant: { ac_mw: 50, dc_mwp: 62.5 },
      bess: { mw: 20, mwh: 80, soc_min: 10, soc_max: 90, rte: 0.88 },
      grid_limit_mw: 30,
      band_pct: 5,
      assumptions: [
        'CERC 2026 DSM band ±5% deviation tolerance applied on 15-minute scheduled injection blocks',
        'Battery round-trip efficiency modeled at 88% with C-rate capped at 0.25C (20 MW / 80 MWh)',
        'Usable State of Charge restricted strictly to 10% – 90% (64 MWh operational reserve)',
        'Solar PV plant rated at 50 MW AC with 1.25 DC/AC oversizing ratio (62.5 MWp DC)',
        'Transmission evacuation corridor constrained to 30 MW thermal/contractual ceiling',
        'Grid emission displacement factor: 0.82 tCO2/MWh (CEA India CO2 Baseline Database v19)',
        'DSM penalty structure aligned with Central Electricity Regulatory Commission regulations',
      ],
      sources: [
        { name: 'INSAT-3DR / 3DS Imager Rapid Scan IR/VIS', range: 'Jan 2024 – Dec 2024 (15-min)' },
        { name: 'ERA5 Reanalysis Surface Solar Radiation Downwards', range: '2015 – 2024 Historical (Hourly)' },
        { name: 'Bhadla Substation Feeder 04 SCADA Telemetry', range: 'Calibrated 96-block operational replay' },
        { name: 'NLDC / POSOCO Regional Grid Frequency Logs', range: 'All-India 50 Hz Synchronous Interconnection' },
      ],
      data_mode: 'MOCK',
      co2_factor_t_per_mwh: 0.82,
    };
  },

  async getForecast(date: string = '2024-03-15'): Promise<ForecastResponse> {
    if (!VITE_USE_MOCK && BASE_URL) {
      const res = await fetch(`${BASE_URL}/api/forecast?date=${encodeURIComponent(date)}`);
      if (!res.ok) throw new Error('Failed to fetch /api/forecast');
      return res.json();
    }
    // MOCK: replace with backend
    const blocks = generateDaySolar(date);
    return {
      blocks,
      metrics: {
        nmae: 2.14,
        nrmse: 3.42,
        pinball: 1.18,
        coverage: 93.6,
        skill_vs_raw: 34.2,
        skill_vs_persistence: 48.7,
      },
      by_regime: [
        { regime: 'Clear Sky', nmae: 1.2, coverage: 96.1 },
        { regime: 'Winter Fog', nmae: 3.8, coverage: 91.4 },
        { regime: 'Monsoon Squall', nmae: 4.6, coverage: 89.2 },
        { regime: 'Summer Heat', nmae: 2.3, coverage: 94.8 },
        { regime: 'Stubble Haze', nmae: 2.9, coverage: 93.0 },
      ],
      calibration: [
        { nominal: 10, observed: 9.8 },
        { nominal: 30, observed: 29.2 },
        { nominal: 50, observed: 49.5 },
        { nominal: 70, observed: 70.8 },
        { nominal: 80, observed: 80.2 },
        { nominal: 90, observed: 89.6 },
      ],
    };
  },

  async getDispatch(
    date: string = '2024-03-15',
    strategy: DispatchStrategy = 'sunbank'
  ): Promise<DispatchResponse> {
    if (!VITE_USE_MOCK && BASE_URL) {
      const res = await fetch(
        `${BASE_URL}/api/dispatch?date=${encodeURIComponent(date)}&strategy=${encodeURIComponent(
          strategy
        )}`
      );
      if (!res.ok) throw new Error('Failed to fetch /api/dispatch');
      return res.json();
    }
    // MOCK: replace with backend
    return generateDayDispatch(date, strategy);
  },

  async getCompare(date: string = '2024-03-15'): Promise<CompareResponse> {
    if (!VITE_USE_MOCK && BASE_URL) {
      const res = await fetch(`${BASE_URL}/api/compare?date=${encodeURIComponent(date)}`);
      if (!res.ok) throw new Error('Failed to fetch /api/compare');
      return res.json();
    }
    // MOCK: replace with backend
    return generateCompare(date);
  },

  async getBacktestSummary(): Promise<BacktestSummaryResponse> {
    if (!VITE_USE_MOCK && BASE_URL) {
      const res = await fetch(`${BASE_URL}/api/backtest/summary`);
      if (!res.ok) throw new Error('Failed to fetch /api/backtest/summary');
      return res.json();
    }
    // MOCK: replace with backend
    const months: MonthBacktest[] = [
      {
        month: 'Jan',
        none: { curtailed_mwh: 28.2, delivered_mwh: 242.1, evening_shifted_mwh: 0, in_band_pct: 79.2, penalty_inr: 72000, net_value_inr: 910000, cycles: 0 },
        rule: { curtailed_mwh: 12.4, delivered_mwh: 260.5, evening_shifted_mwh: 18.2, in_band_pct: 87.5, penalty_inr: 34000, net_value_inr: 1040000, cycles: 0.58 },
        sunbank: { curtailed_mwh: 0.3, delivered_mwh: 274.8, evening_shifted_mwh: 31.2, in_band_pct: 98.4, penalty_inr: 3800, net_value_inr: 1180000, cycles: 0.89 },
      },
      {
        month: 'Feb',
        none: { curtailed_mwh: 34.6, delivered_mwh: 268.4, evening_shifted_mwh: 0, in_band_pct: 77.8, penalty_inr: 88000, net_value_inr: 994000, cycles: 0 },
        rule: { curtailed_mwh: 15.2, delivered_mwh: 290.1, evening_shifted_mwh: 22.4, in_band_pct: 88.0, penalty_inr: 41000, net_value_inr: 1130000, cycles: 0.61 },
        sunbank: { curtailed_mwh: 0.4, delivered_mwh: 306.2, evening_shifted_mwh: 37.0, in_band_pct: 98.8, penalty_inr: 4400, net_value_inr: 1290000, cycles: 0.94 },
      },
      {
        month: 'Mar',
        none: { curtailed_mwh: 39.1, delivered_mwh: 288.0, evening_shifted_mwh: 0, in_band_pct: 76.5, penalty_inr: 96000, net_value_inr: 1060000, cycles: 0 },
        rule: { curtailed_mwh: 16.8, delivered_mwh: 312.4, evening_shifted_mwh: 24.8, in_band_pct: 87.1, penalty_inr: 46000, net_value_inr: 1210000, cycles: 0.65 },
        sunbank: { curtailed_mwh: 0.5, delivered_mwh: 331.0, evening_shifted_mwh: 40.2, in_band_pct: 98.9, penalty_inr: 4800, net_value_inr: 1390000, cycles: 0.97 },
      },
      {
        month: 'Apr',
        none: { curtailed_mwh: 42.8, delivered_mwh: 301.2, evening_shifted_mwh: 0, in_band_pct: 75.8, penalty_inr: 104000, net_value_inr: 1110000, cycles: 0 },
        rule: { curtailed_mwh: 18.4, delivered_mwh: 328.6, evening_shifted_mwh: 26.2, in_band_pct: 86.4, penalty_inr: 51000, net_value_inr: 1270000, cycles: 0.68 },
        sunbank: { curtailed_mwh: 0.6, delivered_mwh: 349.5, evening_shifted_mwh: 42.6, in_band_pct: 98.6, penalty_inr: 5200, net_value_inr: 1470000, cycles: 0.99 },
      },
      {
        month: 'May',
        none: { curtailed_mwh: 45.4, delivered_mwh: 315.6, evening_shifted_mwh: 0, in_band_pct: 75.1, penalty_inr: 112000, net_value_inr: 1160000, cycles: 0 },
        rule: { curtailed_mwh: 19.8, delivered_mwh: 344.2, evening_shifted_mwh: 27.5, in_band_pct: 85.9, penalty_inr: 54000, net_value_inr: 1330000, cycles: 0.71 },
        sunbank: { curtailed_mwh: 0.6, delivered_mwh: 366.8, evening_shifted_mwh: 44.8, in_band_pct: 98.5, penalty_inr: 5600, net_value_inr: 1540000, cycles: 1.02 },
      },
      {
        month: 'Jun',
        none: { curtailed_mwh: 31.0, delivered_mwh: 254.0, evening_shifted_mwh: 0, in_band_pct: 78.4, penalty_inr: 81000, net_value_inr: 955000, cycles: 0 },
        rule: { curtailed_mwh: 13.9, delivered_mwh: 273.2, evening_shifted_mwh: 20.1, in_band_pct: 87.8, penalty_inr: 39000, net_value_inr: 1090000, cycles: 0.60 },
        sunbank: { curtailed_mwh: 0.4, delivered_mwh: 288.6, evening_shifted_mwh: 33.4, in_band_pct: 98.7, penalty_inr: 4100, net_value_inr: 1230000, cycles: 0.91 },
      },
      {
        month: 'Jul',
        none: { curtailed_mwh: 24.5, delivered_mwh: 220.4, evening_shifted_mwh: 0, in_band_pct: 79.9, penalty_inr: 68000, net_value_inr: 840000, cycles: 0 },
        rule: { curtailed_mwh: 10.8, delivered_mwh: 236.2, evening_shifted_mwh: 16.4, in_band_pct: 88.6, penalty_inr: 31000, net_value_inr: 960000, cycles: 0.54 },
        sunbank: { curtailed_mwh: 0.3, delivered_mwh: 248.9, evening_shifted_mwh: 27.2, in_band_pct: 98.9, penalty_inr: 3400, net_value_inr: 1070000, cycles: 0.84 },
      },
      {
        month: 'Aug',
        none: { curtailed_mwh: 26.2, delivered_mwh: 228.6, evening_shifted_mwh: 0, in_band_pct: 79.5, penalty_inr: 71000, net_value_inr: 870000, cycles: 0 },
        rule: { curtailed_mwh: 11.5, delivered_mwh: 245.4, evening_shifted_mwh: 17.2, in_band_pct: 88.2, penalty_inr: 33000, net_value_inr: 990000, cycles: 0.56 },
        sunbank: { curtailed_mwh: 0.3, delivered_mwh: 258.4, evening_shifted_mwh: 28.5, in_band_pct: 98.8, penalty_inr: 3600, net_value_inr: 1110000, cycles: 0.86 },
      },
      {
        month: 'Sep',
        none: { curtailed_mwh: 32.4, delivered_mwh: 260.8, evening_shifted_mwh: 0, in_band_pct: 78.0, penalty_inr: 85000, net_value_inr: 980000, cycles: 0 },
        rule: { curtailed_mwh: 14.4, delivered_mwh: 281.0, evening_shifted_mwh: 21.0, in_band_pct: 87.6, penalty_inr: 40000, net_value_inr: 1110000, cycles: 0.61 },
        sunbank: { curtailed_mwh: 0.4, delivered_mwh: 296.8, evening_shifted_mwh: 35.1, in_band_pct: 98.7, penalty_inr: 4300, net_value_inr: 1260000, cycles: 0.93 },
      },
      {
        month: 'Oct',
        none: { curtailed_mwh: 36.8, delivered_mwh: 278.4, evening_shifted_mwh: 0, in_band_pct: 77.2, penalty_inr: 91000, net_value_inr: 1030000, cycles: 0 },
        rule: { curtailed_mwh: 15.9, delivered_mwh: 301.8, evening_shifted_mwh: 23.4, in_band_pct: 87.3, penalty_inr: 44000, net_value_inr: 1180000, cycles: 0.63 },
        sunbank: { curtailed_mwh: 0.5, delivered_mwh: 319.4, evening_shifted_mwh: 38.6, in_band_pct: 98.8, penalty_inr: 4600, net_value_inr: 1340000, cycles: 0.96 },
      },
      {
        month: 'Nov',
        none: { curtailed_mwh: 30.5, delivered_mwh: 250.2, evening_shifted_mwh: 0, in_band_pct: 78.8, penalty_inr: 78000, net_value_inr: 940000, cycles: 0 },
        rule: { curtailed_mwh: 13.2, delivered_mwh: 269.8, evening_shifted_mwh: 19.5, in_band_pct: 87.9, penalty_inr: 37000, net_value_inr: 1070000, cycles: 0.59 },
        sunbank: { curtailed_mwh: 0.4, delivered_mwh: 284.2, evening_shifted_mwh: 32.8, in_band_pct: 98.6, penalty_inr: 3900, net_value_inr: 1210000, cycles: 0.90 },
      },
      {
        month: 'Dec',
        none: { curtailed_mwh: 27.1, delivered_mwh: 236.0, evening_shifted_mwh: 0, in_band_pct: 79.6, penalty_inr: 70000, net_value_inr: 890000, cycles: 0 },
        rule: { curtailed_mwh: 11.9, delivered_mwh: 253.2, evening_shifted_mwh: 17.8, in_band_pct: 88.3, penalty_inr: 33000, net_value_inr: 1020000, cycles: 0.57 },
        sunbank: { curtailed_mwh: 0.3, delivered_mwh: 266.5, evening_shifted_mwh: 30.1, in_band_pct: 98.5, penalty_inr: 3600, net_value_inr: 1150000, cycles: 0.88 },
      },
    ];

    const totalNone: StrategyKPIs = {
      curtailed_mwh: Number(months.reduce((acc, m) => acc + m.none.curtailed_mwh, 0).toFixed(1)),
      delivered_mwh: Number(months.reduce((acc, m) => acc + m.none.delivered_mwh, 0).toFixed(1)),
      evening_shifted_mwh: 0,
      in_band_pct: 77.8,
      penalty_inr: months.reduce((acc, m) => acc + m.none.penalty_inr, 0),
      net_value_inr: months.reduce((acc, m) => acc + m.none.net_value_inr, 0),
      cycles: 0,
    };

    const totalRule: StrategyKPIs = {
      curtailed_mwh: Number(months.reduce((acc, m) => acc + m.rule.curtailed_mwh, 0).toFixed(1)),
      delivered_mwh: Number(months.reduce((acc, m) => acc + m.rule.delivered_mwh, 0).toFixed(1)),
      evening_shifted_mwh: Number(months.reduce((acc, m) => acc + m.rule.evening_shifted_mwh, 0).toFixed(1)),
      in_band_pct: 87.5,
      penalty_inr: months.reduce((acc, m) => acc + m.rule.penalty_inr, 0),
      net_value_inr: months.reduce((acc, m) => acc + m.rule.net_value_inr, 0),
      cycles: 0.62,
    };

    const totalSunbank: StrategyKPIs = {
      curtailed_mwh: Number(months.reduce((acc, m) => acc + m.sunbank.curtailed_mwh, 0).toFixed(1)),
      delivered_mwh: Number(months.reduce((acc, m) => acc + m.sunbank.delivered_mwh, 0).toFixed(1)),
      evening_shifted_mwh: Number(months.reduce((acc, m) => acc + m.sunbank.evening_shifted_mwh, 0).toFixed(1)),
      in_band_pct: 98.7,
      penalty_inr: months.reduce((acc, m) => acc + m.sunbank.penalty_inr, 0),
      net_value_inr: months.reduce((acc, m) => acc + m.sunbank.net_value_inr, 0),
      cycles: 0.93,
    };

    return {
      months,
      total: {
        none: totalNone,
        rule: totalRule,
        sunbank: totalSunbank,
      },
      recovered_pct: Number((((totalNone.curtailed_mwh - totalSunbank.curtailed_mwh) / totalNone.curtailed_mwh) * 100).toFixed(1)),
      days: 365,
    };
  },

  async getProblemProof(): Promise<ProblemProofResponse> {
    if (!VITE_USE_MOCK && BASE_URL) {
      const res = await fetch(`${BASE_URL}/api/problem-proof`);
      if (!res.ok) throw new Error('Failed to fetch /api/problem-proof');
      return res.json();
    }
    // MOCK: replace with backend
    return {
      limit_sweep: [
        { limit_pct: 40, curtailed_pct: 28.4 },
        { limit_pct: 50, curtailed_pct: 21.2 },
        { limit_pct: 60, curtailed_pct: 14.8 },
        { limit_pct: 70, curtailed_pct: 8.6 },
        { limit_pct: 80, curtailed_pct: 3.8 },
        { limit_pct: 90, curtailed_pct: 0.9 },
        { limit_pct: 100, curtailed_pct: 0.0 },
      ],
      inband_baseline_pct: 76.2,
      baseline_penalty_inr: 28400000,
    };
  },

  async getScenario(
    regime: 'monsoon' | 'winter_fog' | 'summer_heat' | 'stubble_haze' | 'clear' = 'monsoon'
  ): Promise<ScenarioResponse> {
    if (!VITE_USE_MOCK && BASE_URL) {
      const res = await fetch(`${BASE_URL}/api/scenario?regime=${encodeURIComponent(regime)}`);
      if (!res.ok) throw new Error('Failed to fetch /api/scenario');
      return res.json();
    }
    // MOCK: replace with backend
    const regimeDates: Record<string, { dates: string[]; tmaxs: number[]; ghis: number[] }> = {
      monsoon: {
        dates: ['2024-07-12', '2024-07-13', '2024-07-14', '2024-07-15', '2024-07-16', '2024-07-17'],
        tmaxs: [31, 33, 34, 30, 39, 32],
        ghis: [620, 740, 810, 297, 940, 580],
      },
      winter_fog: {
        dates: ['2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07', '2024-01-08', '2024-01-09'],
        tmaxs: [16, 18, 19, 17, 25, 23],
        ghis: [40, 95, 120, 65, 680, 790],
      },
      summer_heat: {
        dates: ['2024-05-18', '2024-05-19', '2024-05-20', '2024-05-21', '2024-05-22', '2024-05-23'],
        tmaxs: [46, 47, 49, 48, 47, 46],
        ghis: [960, 980, 1020, 990, 970, 950],
      },
      stubble_haze: {
        dates: ['2024-11-02', '2024-11-03', '2024-11-04', '2024-11-05', '2024-11-06', '2024-11-07'],
        tmaxs: [28, 29, 29, 27, 28, 29],
        ghis: [480, 510, 460, 430, 520, 560],
      },
      clear: {
        dates: ['2024-03-12', '2024-03-13', '2024-03-14', '2024-03-15', '2024-03-16', '2024-03-17'],
        tmaxs: [32, 33, 34, 34, 35, 34],
        ghis: [920, 930, 940, 945, 950, 940],
      },
    };

    const config = regimeDates[regime] || regimeDates.monsoon;
    const days: ScenarioDay[] = config.dates.map((d, idx) => ({
      date: d,
      tmax: config.tmaxs[idx],
      ghi_peak: config.ghis[idx],
      compare: {
        none: generateDayDispatch(d, 'none').kpis,
        rule: generateDayDispatch(d, 'rule').kpis,
        sunbank: generateDayDispatch(d, 'sunbank').kpis,
      },
    }));

    return {
      days,
      summary: {
        avg_curtailment: Number((days.reduce((acc, d) => acc + d.compare.none.curtailed_mwh, 0) / days.length).toFixed(1)),
        in_band_pct: Number((days.reduce((acc, d) => acc + d.compare.sunbank.in_band_pct, 0) / days.length).toFixed(1)),
        nmae: regime === 'monsoon' ? 4.6 : regime === 'winter_fog' ? 3.8 : regime === 'clear' ? 1.2 : 2.5,
      },
    };
  },

  async simulate(params: SimulateRequest): Promise<CompareResponse> {
    if (!VITE_USE_MOCK && BASE_URL) {
      const res = await fetch(`${BASE_URL}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Failed to post /api/simulate');
      return res.json();
    }
    // MOCK: replace with backend
    const baseCompare = generateCompare(params.date || '2024-03-15');

    // Dynamically scale based on simulate parameters
    const limitFactor = params.limit_mw / 30.0;
    const bessMwhFactor = params.bess_mwh / 80.0;
    const riskFactor = params.risk_mode === 'risk_aware' ? 1.05 : 0.95;
    const priceFactor = params.price_mode === 'market' ? 1.25 : 1.0;

    const simSunbank: StrategyKPIs = {
      ...baseCompare.sunbank,
      curtailed_mwh: Number(Math.max(0, baseCompare.sunbank.curtailed_mwh / (bessMwhFactor * limitFactor)).toFixed(1)),
      evening_shifted_mwh: Number((baseCompare.sunbank.evening_shifted_mwh * bessMwhFactor).toFixed(1)),
      in_band_pct: Number(Math.min(99.5, baseCompare.sunbank.in_band_pct * riskFactor).toFixed(1)),
      penalty_inr: Math.round(baseCompare.sunbank.penalty_inr / riskFactor),
      net_value_inr: Math.round(baseCompare.sunbank.net_value_inr * priceFactor * (0.8 + 0.2 * bessMwhFactor)),
      cycles: Number((baseCompare.sunbank.cycles / Math.max(0.2, bessMwhFactor)).toFixed(2)),
    };

    const simNone: StrategyKPIs = {
      ...baseCompare.none,
      curtailed_mwh: Number((baseCompare.none.curtailed_mwh / limitFactor).toFixed(1)),
      net_value_inr: Math.round(baseCompare.none.net_value_inr * priceFactor),
    };

    const simRule: StrategyKPIs = {
      ...baseCompare.rule,
      curtailed_mwh: Number((baseCompare.rule.curtailed_mwh / (Math.sqrt(bessMwhFactor) * limitFactor)).toFixed(1)),
      net_value_inr: Math.round(baseCompare.rule.net_value_inr * priceFactor),
    };

    return {
      none: simNone,
      rule: simRule,
      sunbank: simSunbank,
      deltas: {
        curtailment_saved_mwh: Number((simNone.curtailed_mwh - simSunbank.curtailed_mwh).toFixed(1)),
        revenue_gain_inr: simSunbank.net_value_inr - simNone.net_value_inr,
        penalty_avoided_inr: simNone.penalty_inr - simSunbank.penalty_inr,
        in_band_gain_pct: Number((simSunbank.in_band_pct - simNone.in_band_pct).toFixed(1)),
      },
    };
  },

  async getBess(date: string = '2024-03-15'): Promise<BessResponse> {
    if (!VITE_USE_MOCK && BASE_URL) {
      const res = await fetch(`${BASE_URL}/api/bess?date=${encodeURIComponent(date)}`);
      if (!res.ok) throw new Error('Failed to fetch /api/bess');
      return res.json();
    }
    // MOCK: replace with backend
    const dispatch = generateDayDispatch(date, 'sunbank');
    const soc = dispatch.blocks.map((b) => b.soc);

    // Temperature model based on ambient + C-rate heating
    const temp_model = dispatch.blocks.map((b, i) => {
      const mins = i * 15;
      const ambient = 24 + 14 * Math.sin(((mins - 360) / 1000) * Math.PI);
      const cRateHeat = Math.abs(b.charge - b.discharge) * 0.45;
      return Number((ambient + cRateHeat).toFixed(1));
    });

    return {
      soc,
      throughput_mwh: 64.2,
      cycles: 0.94,
      rt_loss_mwh: 4.8,
      degradation_inr: 8400,
      temp_model,
    };
  },

  async getEvents(
    date: string = '2024-03-15',
    strategy: DispatchStrategy = 'sunbank'
  ): Promise<EventItem[]> {
    if (!VITE_USE_MOCK && BASE_URL) {
      const res = await fetch(
        `${BASE_URL}/api/events?date=${encodeURIComponent(date)}&strategy=${encodeURIComponent(
          strategy
        )}`
      );
      if (!res.ok) throw new Error('Failed to fetch /api/events');
      return res.json();
    }
    // MOCK: replace with backend
    if (strategy === 'sunbank') {
      return [
        { t: '12:15', tag: 'OPT', text: 'Curtailment avoidance solver: ramping BESS charge to +18.4 MW (0.23C)' },
        { t: '12:00', tag: 'FCST', text: 'INSAT-3DR rapid scan: convective cloud edge gradient at 42 km; P10 adjusted' },
        { t: '11:45', tag: 'DSM', text: 'Feeder injection locked at 29.8 MW (within 30 MW limit and ±1.2% schedule band)' },
        { t: '11:30', tag: 'OPT', text: 'Lookahead dispatch reserved 48.2 MWh headroom for midday solar surge' },
        { t: '11:15', tag: 'FCST', text: 'P50 day-ahead updated with 15-min reanalysis correction: 47.8 MW peak' },
        { t: '11:00', tag: 'DSM', text: 'CERC band compliance: 0/48 deviations recorded today' },
      ];
    } else if (strategy === 'rule') {
      return [
        { t: '12:15', tag: 'OPT', text: 'Threshold rule: Solar > 30 MW; Battery charging at fixed 20 MW limit' },
        { t: '12:00', tag: 'FCST', text: 'Raw persistence forecast: solar peaking at 48 MW' },
        { t: '11:45', tag: 'DSM', text: 'Out-of-band excursion: actual injection 31.2 MW (+4.0% deviation)' },
        { t: '11:30', tag: 'OPT', text: 'BESS reached 74% SoC; charging rate unconstrained by lookahead' },
        { t: '11:15', tag: 'FCST', text: 'No probabilistic quantile band available in rule mode' },
        { t: '11:00', tag: 'DSM', text: 'DSM penalty logged: Rs 1,420 for block 44' },
      ];
    } else {
      return [
        { t: '12:15', tag: 'DSM', text: 'Severe curtailment active: 18.4 MW wasted at 33kV substation feeder' },
        { t: '12:00', tag: 'FCST', text: 'Solar generation 48.4 MW exceeds 30 MW transmission limit' },
        { t: '11:45', tag: 'DSM', text: 'Inverter output throttled to protect 30 MW thermal limit' },
        { t: '11:30', tag: 'FCST', text: 'No BESS buffer available to capture surplus generation' },
        { t: '11:15', tag: 'DSM', text: 'DSM deviation penalty: Rs 4,200 (Schedule mismatch)' },
        { t: '11:00', tag: 'OPT', text: 'No dispatch optimization active (Direct grid feed only)' },
      ];
    }
  },
};
