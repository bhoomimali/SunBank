import {
  TimeBlockData,
  InverterBayStatus,
  SystemLog,
  SankeyFlowItem,
  WeatherScenario
} from '../types';
import { IMAGES } from '../assets/images';

// Generate 96 15-minute blocks for a full 24-hour day in India (Bhadla 50 MW Substation)
export function generate24HourData(): TimeBlockData[] {
  const blocks: TimeBlockData[] = [];
  let cumulativeSoc = 35.0; // Starting at 35% early morning
  let cumulativeDsmSaved = 0;

  for (let b = 1; b <= 96; b++) {
    const totalMinutes = (b - 1) * 15;
    const hour = Math.floor(totalMinutes / 60);
    const min = totalMinutes % 60;
    const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    const hourFloat = hour + min / 60;

    // Solar Bell Curve for Bhadla, Rajasthan (Sunrise ~06:15, Peak ~12:45, Sunset ~18:45)
    let ghi = 0;
    let solarGenMW = 0;
    if (hourFloat >= 6.25 && hourFloat <= 18.75) {
      const dayProgress = (hourFloat - 6.25) / (18.75 - 6.25); // 0 to 1
      const bell = Math.sin(dayProgress * Math.PI);
      ghi = Math.round(bell * 950);

      // Add realistic cloud transient dips between 10:30 and 11:45
      if (hourFloat >= 10.5 && hourFloat <= 11.75) {
        const dip = Math.sin((hourFloat - 10.5) / 1.25 * Math.PI) * 0.38;
        ghi = Math.round(ghi * (1 - dip));
      }

      // Generation for 50 MW peak AC plant
      solarGenMW = Number(((ghi / 950) * 48.5).toFixed(2));
    }

    // Schedule / Target submitted to SLDC Rajasthan (PPA firm dispatch target)
    let targetMW = 0;
    if (hourFloat >= 6.5 && hourFloat <= 18.5) {
      const progress = (hourFloat - 6.5) / (18.5 - 6.5);
      targetMW = Number((Math.sin(progress * Math.PI) * 44.0).toFixed(2));
    }

    // AI Forecast (XGBoost nowcast) with slight prediction error variance
    let forecastMW = 0;
    if (solarGenMW > 0) {
      const errorFactor = 1 + Math.sin(b * 0.45) * 0.04;
      forecastMW = Number((solarGenMW * errorFactor).toFixed(2));
    }

    const yesterdayMW = Number(
      (solarGenMW > 0 ? solarGenMW * (0.94 + Math.cos(b * 0.2) * 0.08) : 0).toFixed(2)
    );

    // Evacuation Feeder Capacity Constraint (30 MW line rating constraint)
    const gridLimitMW = 30.0;
    const curtailmentRiskMW = Number(Math.max(0, solarGenMW - gridLimitMW).toFixed(2));

    // BESS Simulation: Charge (+MW) during peak solar curtailment window (11:00 to 15:00)
    // Discharge (-MW) during evening peak demand (18:00 to 22:00)
    let bessPowerMW = 0;
    if (solarGenMW > gridLimitMW && cumulativeSoc < 85) {
      // Absorb excess up to 10 MW (0.5C on 20 MW converter)
      bessPowerMW = Math.min(10.0, curtailmentRiskMW);
      cumulativeSoc += (bessPowerMW * 0.25 * 0.905 / 80) * 100; // 80 MWh capacity
    } else if (hourFloat >= 18 && hourFloat <= 21.75 && cumulativeSoc > 22) {
      // Discharge into evening peak
      bessPowerMW = -8.5;
      cumulativeSoc -= (8.5 * 0.25 / (0.905 * 80)) * 100;
    } else if (hourFloat >= 22 && hourFloat <= 23.5 && cumulativeSoc > 20) {
      bessPowerMW = -3.0;
      cumulativeSoc -= (3.0 * 0.25 / (0.905 * 80)) * 100;
    }

    cumulativeSoc = Math.max(15, Math.min(88, cumulativeSoc));

    // REALISTIC SMOOTH INDIAN DUCK CURVE (National Grid / Western Regional Grid)
    // 1. Gross Demand: base around 155 GW, climbs smoothly to ~195 GW morning, dips slightly, then peaks at 235 GW evening (19:00-21:00)
    let grossDemand = 155;
    if (hourFloat < 5) {
      grossDemand = 150 - Math.sin((hourFloat / 5) * Math.PI) * 10;
    } else if (hourFloat >= 5 && hourFloat < 12) {
      grossDemand = 150 + Math.sin(((hourFloat - 5) / 7) * (Math.PI / 2)) * 48; // morning ramp to ~198 GW
    } else if (hourFloat >= 12 && hourFloat < 17) {
      grossDemand = 198 - Math.sin(((hourFloat - 12) / 5) * Math.PI) * 12; // slight afternoon dip
    } else if (hourFloat >= 17 && hourFloat < 21) {
      grossDemand = 194 + Math.sin(((hourFloat - 17) / 4) * (Math.PI / 2)) * 44; // steep evening climb to 238 GW
    } else {
      grossDemand = 238 - Math.sin(((hourFloat - 21) / 3) * (Math.PI / 2)) * 75; // late night drop
    }

    // 2. Solar Generation Factor: Smooth bell curve producing the classic Duck "belly" dip
    let solarFleetGW = 0;
    if (hourFloat >= 6.0 && hourFloat <= 18.5) {
      const sunRatio = Math.sin(((hourFloat - 6.0) / 12.5) * Math.PI);
      solarFleetGW = sunRatio * 72; // 72 GW of peak solar injection into Western/Northern Grid
    }

    // 3. Net Demand (Duck Curve) = Gross Demand - Solar Fleet Generation
    const netDemandGW = Number(Math.max(115, grossDemand - solarFleetGW).toFixed(1));

    // Quantile forecast bounds
    const p50MW = forecastMW;
    const spread = Math.max(0.8, forecastMW * 0.14);
    const p10MW = Number(Math.max(0, p50MW - spread).toFixed(1));
    const p90MW = Number((p50MW + spread * 1.1).toFixed(1));

    // Cell temperature model: rises with ambient + high charge rate
    const ambientTemp = 24 + Math.sin(((hourFloat - 6) / 14) * Math.PI) * 16;
    const cellTempC = Number((ambientTemp + Math.abs(bessPowerMW) * 0.65).toFixed(1));

    if (bessPowerMW > 0) {
      cumulativeDsmSaved += Math.round(bessPowerMW * 440);
    }

    blocks.push({
      block: b,
      time,
      ghi,
      solarGenMW,
      targetMW,
      forecastMW,
      yesterdayMW,
      gridLimitMW,
      curtailmentRiskMW,
      bessPowerMW: Number(bessPowerMW.toFixed(1)),
      socPercent: Math.round(cumulativeSoc),
      netDemandGW,
      grossDemandGW: Number(grossDemand.toFixed(1)),
      p10MW,
      p50MW,
      p90MW,
      cellTempC,
      dsmPenaltySavedINR: cumulativeDsmSaved,
    });
  }

  return blocks;
}

export const INITIAL_24HR_DATA = generate24HourData();

// Substation & Inverter Room Statuses
export const INVERTER_BAYS: InverterBayStatus[] = [
  { id: 'bay-1', name: 'Inverter Bay 01', fillPercent: 94, status: 'nominal', powerKW: 2480, tempC: 36.4, lastUpdated: '12:15 PM' },
  { id: 'bay-2', name: 'Inverter Bay 02', fillPercent: 88, status: 'nominal', powerKW: 2410, tempC: 37.1, lastUpdated: '12:15 PM' },
  { id: 'bay-3', name: 'BESS PCS Array A', fillPercent: 68, status: 'nominal', powerKW: 2500, tempC: 39.2, lastUpdated: '12:15 PM' },
  { id: 'bay-4', name: '33kV Feeder Bus', fillPercent: 56, status: 'watch', powerKW: 4890, tempC: 41.5, lastUpdated: '12:14 PM' },
  { id: 'bay-5', name: 'Pyranometer Hub', fillPercent: 78, status: 'nominal', powerKW: 12, tempC: 33.8, lastUpdated: '12:15 PM' },
  { id: 'bay-6', name: 'BESS Thermal Loop', fillPercent: 34, status: 'critical', powerKW: 180, tempC: 43.2, lastUpdated: '12:13 PM' },
];

export const SYSTEM_LOGS: SystemLog[] = [
  { id: 'log-1', time: '12:15:02', type: 'ghi', severity: 'nominal', message: 'ISRO MOSDAC INSAT-3DR L2B cloud mask ingested. 15-min GHI nowcast updated: 914 W/m².' },
  { id: 'log-2', time: '12:15:05', type: 'opt', severity: 'watch', message: 'Generation 46.8 MW exceeds 30.0 MW grid limit. Curtailment risk: 16.8 MW. MILP setpoint: Charge BESS at 8.5 MW.' },
  { id: 'log-3', time: '12:16:00', type: 'qca', severity: 'nominal', message: 'Automated 15-min schedule revision #8 uploaded to QCA API for SLDC Rajasthan dispatch balance.' },
  { id: 'log-4', time: '12:16:42', type: 'modbus', severity: 'nominal', message: 'Modbus TCP write to PCS register 40102 (+8500 kW) acknowledged in 340ms.' },
  { id: 'log-5', time: '12:17:15', type: 'safety', severity: 'watch', message: 'Thermal Loop Bay 6 temp warning (43.2°C). Chiller speed increased to 85% to preserve C-rate limit.' },
  { id: 'log-6', time: '12:18:00', type: 'opt', severity: 'nominal', message: 'Deviation Settlement Mechanism (DSM) tolerance strictly held within ±2.4% (CERC 2026 ±5% compliant).' },
];

// Centerpiece Sankey Energy Flow Data for BESS Digital Twin
export const SANKEY_FLOWS: SankeyFlowItem[] = [
  { id: 'flow-1', source: 'Bhadla 50MW Solar', target: 'BESS Storage Allocation', valueMWh: 80, color: '#f59e0b', label: 'Solar to BESS (Surplus Capture)' },
  { id: 'flow-2', source: 'Bhadla 50MW Solar', target: 'Direct Grid Injection', valueMWh: 150, color: '#0284c7', label: 'Solar to 33kV Feeder' },
  { id: 'flow-3', source: 'BESS Storage Allocation', target: 'Evening Peak Dispatch (18-22h)', valueMWh: 64, color: '#10b981', label: 'Peak ToD Grid Dispatch' },
  { id: 'flow-4', source: 'BESS Storage Allocation', target: 'Reserve Flexibility & SOC Buffer', valueMWh: 8.4, color: '#8b5cf6', label: 'Adaptive Reserve (P10/P90)' },
  { id: 'flow-5', source: 'BESS Storage Allocation', target: 'RTE Conversion Loss (90.5%)', valueMWh: 7.6, color: '#64748b', label: 'Round-trip Heat Loss' },
  { id: 'flow-6', source: 'Direct Grid Injection', target: 'Regional C&I Load', valueMWh: 92, color: '#0284c7', label: 'Commercial & Industrial Supply' },
  { id: 'flow-7', source: 'Direct Grid Injection', target: 'Residential Feeder Base', valueMWh: 58, color: '#38bdf8', label: 'Urban Feeder Distribution' },
];

// The 4 Specific Indian Weather Scenarios
export const WEATHER_SCENARIOS: WeatherScenario[] = [
  {
    id: 'monsoon',
    title: 'Monsoon Cloud Chaos',
    subtitle: 'Hyper-Local Stratiform Swarms & Rapid Cloud Edges',
    region: 'Western Ghats & Central India',
    seasonMonths: 'June – September',
    imagePath: IMAGES.dramaticStormRain,
    primaryReadout: '420 W/m²',
    primaryMetricLabel: 'Average GHI (Swinging ±380 W/m²)',
    conditionHeadline: 'Monsoon Cumulonimbus Formations — High Ramp Variance',
    conditionDescription: 'Chaotic multi-layer cloud decks cause sudden 30+ MW generation drops in under 10 minutes. Generic point-forecasts fail catastrophically under this regime.',
    ghiAverage: 420,
    forecastConfidence: 54,
    uncertaintyBandWidth: '±38% (Wide P10/P90 Band)',
    bessStrategy: 'Dynamic SOC Reserve Headroom: Holds 35% reserve capacity to absorb sudden ramps without violating C-rate limits.',
    dsmRiskLevel: 'Critical',
    curtailmentRiskPct: 24,
    thermalRisk: 'Low (Ambient 28°C)',
    technicalMechanism: 'Fuses IMD Doppler nowcasting with INSAT-3DR Cloud Top Temperature (CTT) to adjust 15-minute prediction intervals.',
    mitigationRule: 'Quantile regression widens P10/P90 envelope; optimizer switches to stochastic risk-averse reserve retention.',
    hourlyForecast: [
      { time: '06:00', ghi: 90, tempC: 25, cloudCoverPct: 82, condition: 'Overcast' },
      { time: '08:00', ghi: 310, tempC: 26, cloudCoverPct: 74, condition: 'Broken Cloud' },
      { time: '10:00', ghi: 520, tempC: 28, cloudCoverPct: 65, condition: 'Variable Cloud' },
      { time: '12:00', ghi: 280, tempC: 27, cloudCoverPct: 92, condition: 'Squall Shower' },
      { time: '14:00', ghi: 680, tempC: 29, cloudCoverPct: 40, condition: 'Sunbreak' },
      { time: '16:00', ghi: 340, tempC: 28, cloudCoverPct: 80, condition: 'Heavy Cumulus' },
      { time: '18:00', ghi: 70, tempC: 26, cloudCoverPct: 88, condition: 'Rain Overcast' },
    ],
  },
  {
    id: 'winter-fog',
    title: 'Northern Plain Winter Fog',
    subtitle: 'Dense Radiation Inversion & Late Morning Burn-Off',
    region: 'Indo-Gangetic Plains & North Rajasthan',
    seasonMonths: 'December – January',
    imagePath: IMAGES.sandboxWinterFog,
    primaryReadout: '180 W/m²',
    primaryMetricLabel: 'Morning GHI (06:00 – 11:00)',
    conditionHeadline: 'Zero-Visibility Morning Inversion followed by +40MW Surge',
    conditionDescription: 'Severe radiation fog traps particulate matter, cutting direct normal irradiance by up to 90% until sudden solar burn-off occurs at ~11:30 AM.',
    ghiAverage: 380,
    forecastConfidence: 68,
    uncertaintyBandWidth: '±25% (Ramp Timing Risk)',
    bessStrategy: 'Delayed Pre-charge: Holds discharge ready until fog dissipation, then clamps rapid post-noon ramp to prevent feeder trip.',
    dsmRiskLevel: 'High',
    curtailmentRiskPct: 18,
    thermalRisk: 'Minimal (Ambient 12°C)',
    technicalMechanism: 'Ingests MODIS/AOD and visibility sensors to time the exact 15-minute block of fog burn-off.',
    mitigationRule: 'BESS stands by to absorb extreme ramp rate (>3 MW/min) when fog suddenly breaks at noon.',
    hourlyForecast: [
      { time: '06:00', ghi: 10, tempC: 7, cloudCoverPct: 98, condition: 'Dense Fog' },
      { time: '08:00', ghi: 60, tempC: 9, cloudCoverPct: 95, condition: 'Dense Fog' },
      { time: '10:00', ghi: 180, tempC: 13, cloudCoverPct: 85, condition: 'Thinning Fog' },
      { time: '12:00', ghi: 720, tempC: 18, cloudCoverPct: 15, condition: 'Clear Sky' },
      { time: '14:00', ghi: 780, tempC: 21, cloudCoverPct: 10, condition: 'Full Sun' },
      { time: '16:00', ghi: 410, tempC: 18, cloudCoverPct: 12, condition: 'Mild Haze' },
      { time: '18:00', ghi: 30, tempC: 14, cloudCoverPct: 40, condition: 'Evening Fog' },
    ],
  },
  {
    id: 'summer-heat',
    title: 'Thar Desert Extreme Heatwave',
    subtitle: 'Ambient >48.5°C & Severe Photovoltaic Derating',
    region: 'Jodhpur, Bikaner & Western Rajasthan',
    seasonMonths: 'April – June',
    imagePath: IMAGES.sandboxSummerHeat,
    primaryReadout: '1,020 W/m²',
    primaryMetricLabel: 'Peak Clear-Sky GHI (Cell Temp >72°C)',
    conditionHeadline: 'Maximum Theoretical Irradiance with -16.2% Thermal Loss',
    conditionDescription: 'Clear desert skies deliver intense radiation, but ambient heat of 48.5°C drives panel temperatures past 70°C, drastically degrading silicon efficiency.',
    ghiAverage: 880,
    forecastConfidence: 94,
    uncertaintyBandWidth: '±6% (Tight Predictable Band)',
    bessStrategy: 'Thermal De-rating Guard: Throttles BESS charge rate to 0.35C to prevent LFP cell runaway while liquid chillers operate at 100%.',
    dsmRiskLevel: 'Moderate',
    curtailmentRiskPct: 32,
    thermalRisk: 'Extreme (HVAC at 100% Load)',
    technicalMechanism: 'Applies King PVMismatch temperature-coefficient model (Pmax -0.38%/°C) dynamically to physical telemetry.',
    mitigationRule: 'Forecast model derates expected output proportional to ambient thermocouple telemetry.',
    hourlyForecast: [
      { time: '06:00', ghi: 140, tempC: 32, cloudCoverPct: 0, condition: 'Hot Sunrise' },
      { time: '08:00', ghi: 560, tempC: 38, cloudCoverPct: 2, condition: 'Blazing Sun' },
      { time: '10:00', ghi: 890, tempC: 44, cloudCoverPct: 0, condition: 'Extreme Heat' },
      { time: '12:00', ghi: 1020, tempC: 48, cloudCoverPct: 0, condition: 'Peak Thermal Load' },
      { time: '14:00', ghi: 960, tempC: 49, cloudCoverPct: 3, condition: 'Desert Heatwave' },
      { time: '16:00', ghi: 680, tempC: 46, cloudCoverPct: 5, condition: 'Dust Swirl' },
      { time: '18:00', ghi: 210, tempC: 42, cloudCoverPct: 0, condition: 'Hot Sunset' },
    ],
  },
  {
    id: 'stubble-haze',
    title: 'Post-Harvest Smog & Aerosol Haze',
    subtitle: 'Agricultural Burning Aerosols (AOD > 0.85)',
    region: 'Punjab, Haryana & National Capital Region',
    seasonMonths: 'October – November',
    imagePath: IMAGES.sandboxStubbleHaze,
    primaryReadout: '540 W/m²',
    primaryMetricLabel: 'Hazy Diffuse GHI (AOD 0.88)',
    conditionHeadline: 'Diffuse-Dominant Sky with Bifacial Gain Suppression',
    conditionDescription: 'Agricultural burning generates massive fine particulate matter (PM2.5). The direct beam irradiance collapses while diffuse fraction rises to 65%.',
    ghiAverage: 510,
    forecastConfidence: 72,
    uncertaintyBandWidth: '±19% (Spectral Distortion Band)',
    bessStrategy: 'Bifacial Offset Compensator: Adjusts rear-side generation factor down by 45% to prevent over-committing to the state grid.',
    dsmRiskLevel: 'High',
    curtailmentRiskPct: 12,
    thermalRisk: 'Low (Ambient 24°C)',
    technicalMechanism: 'Fuses CPCB air quality index (AQI) with INSAT-3DR AOD to scale the Perez diffuse irradiance algorithm.',
    mitigationRule: 'Quantile model down-weights rear-side albedo multiplier during particulate inversion episodes.',
    hourlyForecast: [
      { time: '06:00', ghi: 30, tempC: 17, cloudCoverPct: 70, condition: 'Aerosol Smog' },
      { time: '08:00', ghi: 220, tempC: 20, cloudCoverPct: 65, condition: 'Brown Haze' },
      { time: '10:00', ghi: 440, tempC: 24, cloudCoverPct: 60, condition: 'Diffuse Sunlight' },
      { time: '12:00', ghi: 560, tempC: 27, cloudCoverPct: 55, condition: 'Smog Sun' },
      { time: '14:00', ghi: 510, tempC: 28, cloudCoverPct: 50, condition: 'Hazy Afternoon' },
      { time: '16:00', ghi: 290, tempC: 25, cloudCoverPct: 60, condition: 'Stubble Plume' },
      { time: '18:00', ghi: 40, tempC: 22, cloudCoverPct: 75, condition: 'Evening Smog' },
    ],
  },
];
