export interface TimeBlockData {
  block: number; // 1 to 96
  time: string; // HH:MM
  ghi: number; // W/m²
  solarGenMW: number;
  targetMW: number;
  forecastMW: number;
  yesterdayMW: number;
  gridLimitMW: number; // 30.0 MW
  curtailmentRiskMW: number;
  bessPowerMW: number; // + is charge, - is discharge
  socPercent: number; // 0 to 100%
  netDemandGW: number; // Duck curve net load
  grossDemandGW: number; // Gross regional demand
  p10MW: number;
  p50MW: number;
  p90MW: number;
  cellTempC: number;
  dsmPenaltySavedINR: number;
}

export interface InverterBayStatus {
  id: string;
  name: string;
  fillPercent: number; // 0-100 gauge fill
  status: 'nominal' | 'watch' | 'critical';
  powerKW: number;
  tempC: number;
  lastUpdated: string;
}

export interface SystemLog {
  id: string;
  time: string;
  type: 'ghi' | 'opt' | 'qca' | 'modbus' | 'safety';
  severity: 'nominal' | 'watch' | 'critical';
  message: string;
}

export interface WeatherScenario {
  id: 'monsoon' | 'winter-fog' | 'summer-heat' | 'stubble-haze';
  title: string;
  subtitle: string;
  region: string;
  seasonMonths: string;
  imagePath: string;
  primaryReadout: string;
  primaryMetricLabel: string;
  conditionHeadline: string;
  conditionDescription: string;
  ghiAverage: number; // W/m²
  forecastConfidence: number; // %
  uncertaintyBandWidth: string; // e.g. "±38% (Wide)"
  bessStrategy: string;
  dsmRiskLevel: 'High' | 'Moderate' | 'Critical' | 'Low';
  curtailmentRiskPct: number;
  thermalRisk: string;
  technicalMechanism: string;
  mitigationRule: string;
  hourlyForecast: {
    time: string;
    ghi: number;
    tempC: number;
    cloudCoverPct: number;
    condition: string;
  }[];
}

export interface SankeyFlowItem {
  id: string;
  source: string;
  target: string;
  valueMWh: number;
  color: string;
  label: string;
}

export type PageId = 'hero' | 'impact' | 'control' | 'forecasting' | 'digital-twin' | 'sandbox';
