import React, { useState, useEffect } from 'react';
import { TimeBlockData } from '../types';
import {
  api,
  DispatchStrategy,
  StrategyKPIs,
  BessResponse,
  ConfigResponse,
} from '../api';
import {
  Zap,
  ShieldCheck,
  Thermometer,
  Battery,
  Activity,
  Leaf,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Gauge
} from 'lucide-react';

interface DigitalTwinPageProps {
  currentData: TimeBlockData;
  selectedDate?: string;
  strategy?: DispatchStrategy;
  onSelectStrategy?: (strat: DispatchStrategy) => void;
}

type BessMode = 'curtailment-firming' | 'peak-shaving';

interface RackModule {
  id: string;
  name: string;
  soc: number;
  tempC: number;
  energyMWh: number;
  soh: number;
  status: 'optimal' | 'warning' | 'standby';
}

export const DigitalTwinPage: React.FC<DigitalTwinPageProps> = ({
  currentData,
  selectedDate = '2024-03-15',
  strategy = 'sunbank',
  onSelectStrategy,
}) => {
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<BessMode>('curtailment-firming');
  const [selectedRack, setSelectedRack] = useState<string>('RACK-A02');

  const [bessData, setBessData] = useState<BessResponse | null>(null);
  const [dispatchKPIs, setDispatchKPIs] = useState<StrategyKPIs | null>(null);
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getBess(selectedDate),
      api.getDispatch(selectedDate, strategy),
      api.getConfig(),
    ])
      .then(([bess, disp, cfg]) => {
        setBessData(bess);
        setDispatchKPIs(disp.kpis);
        setConfig(cfg);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedDate, strategy]);

  const isCharging = currentData.bessPowerMW > 0 || selectedMode === 'curtailment-firming';
  const isDischarging = currentData.bessPowerMW < 0 || selectedMode === 'peak-shaving';

  // Mode-adjusted power values
  const activeBessPowerMW =
    selectedMode === 'curtailment-firming'
      ? Math.max(12.5, Math.abs(currentData.bessPowerMW))
      : -18.4;

  const activeBessKW = Math.round(Math.abs(activeBessPowerMW) * 1000);
  const activeSolarKW = Math.round(currentData.solarGenMW * 1000);

  // Modelled cell temperature from modelled series
  const currentBlockIdx = Math.max(0, Math.min(95, currentData.block - 1));
  const modelledTempC = bessData?.temp_model[currentBlockIdx] ?? 36.2;
  const modelledSoH = bessData ? Number((100 - bessData.cycles * 0.003).toFixed(2)) : 99.82;
  const modelledCycles = bessData?.cycles ?? 0.94;

  // 8 Containerized Battery Racks (equal 10 MWh modules from pack SoC, temperature from modelled series, no invented per-module differences)
  const moduleEnergy = Number(((currentData.socPercent / 100) * 10).toFixed(2));
  const rackModules: RackModule[] = Array.from({ length: 8 }, (_, i) => ({
    id: `RACK-A0${i + 1}`,
    name: `Module A0${i + 1} · Inverter Bay ${Math.floor(i / 2) + 1}`,
    soc: currentData.socPercent,
    tempC: modelledTempC,
    energyMWh: moduleEnergy,
    soh: modelledSoH,
    status: 'optimal',
  }));

  const currentRack = rackModules.find((r) => r.id === selectedRack) || rackModules[1];

  // Avoided carbon computation with emission factor from config
  const emissionFactor = config?.co2_factor_t_per_mwh ?? 0.82;
  const deliveredMWh = dispatchKPIs?.delivered_mwh ?? 304.8;
  const avoidedCarbonTonnes = Number((deliveredMWh * emissionFactor).toFixed(2));
  const coalEquivalentTonnes = Number((avoidedCarbonTonnes * 0.47).toFixed(1));

  // C-rate computation (real limit: 20 MW / 80 MWh = 0.25C max)
  const computedCRate = Number((Math.abs(activeBessPowerMW) / 80).toFixed(2));

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ============================================================
            HEADER & STRATEGY / MODE SELECTOR RIBBON
            ============================================================ */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-xl backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <div className="relative p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <Zap className="w-7 h-7 animate-pulse text-emerald-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  BESS Digital Twin & Dynamic Energy Matrix
                </h1>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                  20 MW / 80 MWh LFP
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Real-Time Physical Energy Balance · Bhadla Central Inverter Substation · Date: {selectedDate}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Strategy Toggle (No battery / Dumb battery / SunBank) */}
            {onSelectStrategy && (
              <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-white/15">
                <button
                  onClick={() => onSelectStrategy('none')}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                    strategy === 'none'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  No battery
                </button>
                <button
                  onClick={() => onSelectStrategy('rule')}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                    strategy === 'rule'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dumb battery
                </button>
                <button
                  onClick={() => onSelectStrategy('sunbank')}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                    strategy === 'sunbank'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SunBank
                </button>
              </div>
            )}

            {/* Operating Mode Switcher (Removed FFR Fast Frequency tab) */}
            <div className="flex items-center p-1.5 rounded-2xl bg-slate-950/70 border border-white/15 backdrop-blur-md gap-1">
              <button
                onClick={() => setSelectedMode('curtailment-firming')}
                className={`px-3.5 py-1.5 text-xs font-mono rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedMode === 'curtailment-firming'
                    ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-400/40 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Curtailment Capture
              </button>
              <button
                onClick={() => setSelectedMode('peak-shaving')}
                className={`px-3.5 py-1.5 text-xs font-mono rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedMode === 'peak-shaving'
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/40 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Evening Peak Dispatch
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================
            METRIC TELEMETRY CARDS
            ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Power & Direction + Real computed C-rate */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Active BESS Power</span>
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="my-3">
              <div className="text-3xl font-black font-mono text-emerald-400 tabular-nums">
                {activeBessPowerMW > 0 ? `+${activeBessPowerMW.toFixed(1)}` : activeBessPowerMW.toFixed(1)} MW
              </div>
              <div className="text-xs text-slate-300 mt-1 font-mono">
                {isCharging ? 'Absorption from Solar Inverters' : 'Evacuation to 33kV Substation'}
              </div>
            </div>
            <div className="pt-3 border-t border-white/10 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>C-Rate Utilization</span>
              <span className="text-amber-400 font-bold">
                {computedCRate} C / 0.25 C Max
              </span>
            </div>
          </div>

          {/* Card 2: State of Charge (Animated Battery Fill) */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>State of Charge (SoC)</span>
              <Battery className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-3">
              <div className="text-3xl font-black font-mono text-cyan-300 tabular-nums flex items-baseline gap-2">
                <span>{currentData.socPercent}%</span>
                <span className="text-xs text-slate-400 font-normal">({((currentData.socPercent / 100) * 80).toFixed(1)} / 80 MWh)</span>
              </div>
              {/* Animated Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 mt-2 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 transition-all duration-700 rounded-full"
                  style={{ width: `${currentData.socPercent}%` }}
                />
              </div>
            </div>
            <div className="pt-3 border-t border-white/10 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Reserve Window Bound</span>
              <span className="text-emerald-400 font-bold">10% – 90% Safe Band</span>
            </div>
          </div>

          {/* Card 3: Round Trip Efficiency */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Round-Trip Efficiency (RTE)</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-3">
              <div className="text-3xl font-black font-mono text-amber-300 tabular-nums">
                88.0%
              </div>
              <div className="text-xs text-slate-300 mt-1 font-mono">
                LFP Cell AC-AC Efficiency
              </div>
            </div>
            <div className="pt-3 border-t border-white/10 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>Round-Trip Loss</span>
              <span className="text-slate-300 font-bold">
                {bessData?.rt_loss_mwh ?? 4.8} MWh
              </span>
            </div>
          </div>

          {/* Card 4: Environmental & Carbon Impact (driven by data layer with config factor) */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Avoided Carbon Offset</span>
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-3">
              <div className="text-3xl font-black font-mono text-white tabular-nums">
                {loading ? '—' : `${avoidedCarbonTonnes} t`}
              </div>
              <div className="text-xs text-slate-300 mt-1 font-mono">
                CO2 Displaced (CEA Factor: {emissionFactor})
              </div>
            </div>
            <div className="pt-3 border-t border-white/10 text-[10px] font-mono text-emerald-400 flex items-center justify-between">
              <span>Coal Equivalent</span>
              <span className="font-bold">
                {loading ? '—' : `${coalEquivalentTonnes} Tons Displaced`}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================
            MAIN INTERACTIVE SANKEY FLOW DIAGRAM
            ============================================================ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  Dynamic Energy Conduits & Flow Topology
                </h2>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Real-time particle conduits animating generation, battery storage buffering, and regional substation injection.
              </p>
            </div>
            <div className="text-xs font-mono px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
              Strategy: <strong className="text-cyan-300 uppercase">{strategy}</strong>
            </div>
          </div>

          {/* Flow Column Headers */}
          <div className="grid grid-cols-3 text-xs font-mono uppercase tracking-wider text-slate-400 pt-5 pb-2 text-center border-b border-white/5">
            <div className="text-left pl-4 font-bold text-amber-400">1. Solar Photovoltaic Generation</div>
            <div className="font-bold text-emerald-400">2. Dispatch Allocation & Buffer</div>
            <div className="text-right pr-4 font-bold text-cyan-400">3. End Grid Injection (33kV Rail)</div>
          </div>

          {/* Interactive Sankey SVG Stage with Animated Flowing Particles + Red Curtailed Flow */}
          <div className="h-96 w-full relative mt-4 select-none">
            <svg className="w-full h-full" viewBox="0 0 920 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sankey-solar-bess" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="sankey-solar-grid" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="sankey-solar-curtail" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="sankey-bess-peak" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="sankey-grid-ci" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* 1. RIBBON: Solar -> BESS Allocation */}
              <path
                id="path-solar-bess"
                d="M 130 80 C 270 80, 270 70, 430 70 L 430 130 C 270 130, 270 140, 130 140 Z"
                fill="url(#sankey-solar-bess)"
                opacity={hoveredFlow === 'bess' || hoveredFlow === null ? 0.85 : 0.3}
                className="transition-opacity duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredFlow('bess')}
                onMouseLeave={() => setHoveredFlow(null)}
              />

              {/* Animated Glowing Energy Sparks along Solar -> BESS Path */}
              <path
                d="M 130 110 C 270 110, 270 100, 430 100"
                fill="none"
                stroke="#fef08a"
                strokeWidth="3"
                className="animate-flow-dash pointer-events-none"
              />
              <circle r="4" fill="#ffffff" filter="drop-shadow(0 0 6px #fef08a)">
                <animateMotion
                  path="M 130 110 C 270 110, 270 100, 430 100"
                  dur="1.4s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* 2. RIBBON: Solar -> Direct Grid */}
              <path
                id="path-solar-grid"
                d="M 130 150 C 270 150, 270 200, 430 200 L 430 270 C 270 270, 270 230, 130 230 Z"
                fill="url(#sankey-solar-grid)"
                opacity={hoveredFlow === 'grid' || hoveredFlow === null ? 0.85 : 0.3}
                className="transition-opacity duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredFlow('grid')}
                onMouseLeave={() => setHoveredFlow(null)}
              />
              <path
                d="M 130 190 C 270 190, 270 235, 430 235"
                fill="none"
                stroke="#7dd3fc"
                strokeWidth="3"
                className="animate-flow-dash pointer-events-none"
              />

              {/* 3. RIBBON: BESS -> Evening Peak Discharge */}
              <path
                d="M 490 60 C 630 60, 630 50, 770 50 L 770 95 C 630 95, 630 105, 490 105 Z"
                fill="url(#sankey-bess-peak)"
                opacity={0.9}
              />
              <path
                d="M 490 82 C 630 82, 630 72, 770 72"
                fill="none"
                stroke="#67e8f9"
                strokeWidth="2.5"
                className="animate-flow-dash pointer-events-none"
              />

              {/* 4. RIBBON: Direct to Grid Output */}
              <path
                d="M 490 195 C 630 195, 630 135, 770 135 L 770 180 C 630 180, 630 240, 490 240 Z"
                fill="url(#sankey-grid-ci)"
                opacity={0.85}
              />

              {/* 5. RIBBON: Via Battery Output */}
              <path
                d="M 490 115 C 630 115, 630 190, 770 190 L 770 225 C 630 225, 630 130, 490 130 Z"
                fill="#10b981"
                opacity={0.8}
              />

              {/* 6. RED RIBBON: Curtailed (Wasted) Flow using existing flow style */}
              <path
                d="M 130 220 C 350 260, 550 280, 770 260 L 770 290 C 550 295, 350 270, 130 235 Z"
                fill="url(#sankey-solar-curtail)"
                opacity={dispatchKPIs && dispatchKPIs.curtailed_mwh > 0 ? 0.85 : 0.25}
              />
              <path
                d="M 130 227 C 350 265, 550 285, 770 275"
                fill="none"
                stroke="#f87171"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                className="pointer-events-none"
              />

              {/* NODE 1: Solar Farm (Source) */}
              <g className="cursor-pointer">
                <rect x="20" y="65" width="110" height="175" rx="14" fill="#0f172a" stroke="#f59e0b" strokeWidth="2.5" />
                <text x="75" y="120" fill="#ffffff" fontSize="13" fontWeight="bold" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" textAnchor="middle">
                  Solar PV
                </text>
                <text x="75" y="142" fill="#fbbf24" fontSize="16" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {activeSolarKW} kW
                </text>
                <text x="75" y="165" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  Bhadla Array 04
                </text>
                <circle cx="75" cy="195" r="5" fill="#10b981" className="animate-pulse" />
              </g>

              {/* NODE 2: BESS Container (Allocation) */}
              <g className="cursor-pointer">
                <rect
                  x="430"
                  y="50"
                  width="60"
                  height="90"
                  rx="10"
                  fill="#0f172a"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  className={isCharging ? 'animate-pulse-energy' : ''}
                />
                <text x="460" y="85" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" textAnchor="middle">
                  BESS
                </text>
                <text x="460" y="103" fill="#10b981" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  80 MWh
                </text>
                <text x="460" y="120" fill="#6ee7b7" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {currentData.socPercent}% SoC
                </text>
              </g>

              {/* NODE 3: Direct Grid Substation */}
              <g className="cursor-pointer">
                <rect x="430" y="190" width="60" height="90" rx="10" fill="#0f172a" stroke="#0284c7" strokeWidth="2.5" />
                <text x="460" y="230" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" textAnchor="middle">
                  Direct
                </text>
                <text x="460" y="248" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  33 kV
                </text>
              </g>

              {/* FOUR OUTPUT BOXES REPLACED:
                  1. Evening peak discharge
                  2. Direct to grid
                  3. Via battery
                  4. Curtailed */}
              {/* Box 1: Evening peak discharge */}
              <g>
                <rect x="770" y="40" width="135" height="55" rx="10" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                <text x="782" y="60" fill="#e2e8f0" fontSize="10.5" fontWeight="bold">Evening peak discharge</text>
                <text x="782" y="80" fill="#34d399" fontSize="14" fontWeight="bold" fontFamily="monospace">
                  {loading || !dispatchKPIs ? '—' : `${dispatchKPIs.evening_shifted_mwh.toFixed(1)} MWh`}
                </text>
              </g>

              {/* Box 2: Direct to grid */}
              <g>
                <rect x="770" y="105" width="135" height="55" rx="10" fill="#0f172a" stroke="#0284c7" strokeWidth="2" />
                <text x="782" y="125" fill="#e2e8f0" fontSize="10.5" fontWeight="bold">Direct to grid</text>
                <text x="782" y="145" fill="#38bdf8" fontSize="14" fontWeight="bold" fontFamily="monospace">
                  {loading || !dispatchKPIs ? '—' : `${Math.max(0, dispatchKPIs.delivered_mwh - dispatchKPIs.evening_shifted_mwh).toFixed(1)} MWh`}
                </text>
              </g>

              {/* Box 3: Via battery */}
              <g>
                <rect x="770" y="170" width="135" height="55" rx="10" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                <text x="782" y="190" fill="#e2e8f0" fontSize="10.5" fontWeight="bold">Via battery</text>
                <text x="782" y="210" fill="#67e8f9" fontSize="14" fontWeight="bold" fontFamily="monospace">
                  {loading || !dispatchKPIs ? '—' : `${dispatchKPIs.evening_shifted_mwh.toFixed(1)} MWh`}
                </text>
              </g>

              {/* Box 4: Curtailed (Wasted) in red */}
              <g>
                <rect x="770" y="235" width="135" height="55" rx="10" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                <text x="782" y="255" fill="#fca5a5" fontSize="10.5" fontWeight="bold">Curtailed (wasted)</text>
                <text x="782" y="275" fill="#f87171" fontSize="14" fontWeight="bold" fontFamily="monospace">
                  {loading || !dispatchKPIs ? '—' : `${dispatchKPIs.curtailed_mwh.toFixed(1)} MWh`}
                </text>
              </g>
            </svg>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Conduits driven by {strategy.toUpperCase()} dispatch trajectory. Net BESS Flow: <strong className="text-white font-mono">{activeBessKW} kW</strong></span>
            </span>
          </div>
        </div>

        {/* ============================================================
            80 MWh LFP RACK VISUALIZER (8 Equal Modules, 10 MWh each)
            ============================================================ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-white/10 border-b">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg sm:text-xl font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  Containerized LFP Cell Architecture (8 Modules, 10 MWh each)
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Pack SoC: {currentData.socPercent}% · Modelled cell temperature from telemetry series.
              </p>
            </div>
          </div>

          {/* RACK GRID - 8 Equal Modules from pack SoC */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {rackModules.map((rack) => {
              const isSelected = rack.id === selectedRack;
              return (
                <button
                  key={rack.id}
                  onClick={() => setSelectedRack(rack.id)}
                  className={`p-3.5 rounded-2xl text-left font-mono cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                    isSelected
                      ? 'bg-slate-800 border-2 border-cyan-400 shadow-lg shadow-cyan-400/20 -translate-y-1'
                      : 'bg-slate-950/70 hover:bg-slate-900 border border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-white">
                    <span>{rack.id.replace('RACK-', 'M-')}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>

                  {/* Vertical Battery Bar Level */}
                  <div className="w-full h-16 bg-slate-900 rounded-lg my-2.5 p-0.5 flex flex-col justify-end overflow-hidden border border-white/10">
                    <div
                      className={`w-full rounded transition-all duration-700 ${
                        rack.soc > 70
                          ? 'bg-gradient-to-t from-emerald-500 to-cyan-400'
                          : rack.soc > 30
                          ? 'bg-gradient-to-t from-amber-500 to-emerald-400'
                          : 'bg-gradient-to-t from-rose-500 to-amber-400'
                      }`}
                      style={{ height: `${rack.soc}%` }}
                    />
                  </div>

                  <div className="text-center">
                    <div className="text-xs font-bold text-white tabular-nums">{rack.soc}%</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{rack.tempC.toFixed(1)}°C</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* DETAILED ACTIVE RACK TELEMETRY INSPECTOR */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            {/* Box 1: Identifier */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Selected Rack Identifier</div>
              <div className="text-sm font-bold text-white mt-1">{currentRack.name}</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Equalized Pack Balance</div>
            </div>

            {/* Box 2: Module energy (Replaces Busbar DC Voltage) */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Module Energy</div>
              <div className="text-sm font-bold text-cyan-300 mt-1">{currentRack.energyMWh} MWh</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Capacity: 10.0 MWh Nominal</div>
            </div>

            {/* Box 3: Modelled temperature (Replaces Thermal Gradient) */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Modelled Temperature</div>
              <div className="text-sm font-bold text-amber-300 mt-1">{currentRack.tempC.toFixed(1)} °C</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Modelled ambient + C-rate heating</div>
            </div>

            {/* Box 4: State of Health (modelled) & Cycles (modelled) */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="text-slate-400 text-[10px] uppercase font-semibold">SoH & Cycles (Modelled)</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">{currentRack.soh.toFixed(2)}% (modelled)</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{modelledCycles} cycles today (modelled)</div>
            </div>
          </div>
        </div>

        {/* ============================================================
            DEGRADATION & C-RATE / SOC LIMITS
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Economic Degradation Cost Model */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                LFP Degradation & MILP Co-Optimization
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Modelled
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Our linear dispatch solver incorporates marginal battery degradation wear penalties into the objective function, preventing parasitic micro-cycles during low tariff variance windows.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center font-mono">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10">
                <div className="text-[10px] text-slate-400">Retention</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">{modelledSoH}%</div>
                <div className="text-[9px] text-slate-500 mt-0.5">Modelled Retention</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10">
                <div className="text-[10px] text-slate-400">Daily Cycles</div>
                <div className="text-lg font-bold text-cyan-300 mt-1">{modelledCycles}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">Full Depth Equiv.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10">
                <div className="text-[10px] text-slate-400">Degradation Cost</div>
                <div className="text-lg font-bold text-amber-300 mt-1">₹{bessData?.degradation_inr ?? 8400}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">Daily Wear Value</div>
              </div>
            </div>
          </div>

          {/* Card 2: C-rate & SoC Limits (Renamed, shows only real limits: 0.25C, SoC 10-90%) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                C-Rate & SoC Limits
              </span>
              <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Operating Envelope</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              System actuation strictly enforces real physical inverter and pack boundaries to maximize asset longevity and prevent battery over-stress.
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-white/10">
                <span className="text-slate-400">Maximum Continuous C-Rate:</span>
                <span className="text-emerald-400 font-bold">0.25 C (20 MW / 80 MWh Max)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-white/10">
                <span className="text-slate-400">Usable State of Charge (SoC):</span>
                <span className="text-emerald-400 font-bold">10% – 90% (64 MWh Usable)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-white/10">
                <span className="text-slate-400">Round-Trip Efficiency (RTE):</span>
                <span className="text-cyan-300 font-bold">88.0% AC-to-AC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
