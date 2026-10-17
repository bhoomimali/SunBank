import React, { useState, useEffect } from 'react';
import { TimeBlockData } from '../types';
import {
  api,
  DispatchBlock,
  StrategyKPIs,
  DispatchStrategy,
  EventItem,
} from '../api';
import {
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  BatteryCharging,
  Gauge,
  Play,
  Pause,
  RotateCcw,
  Radio,
  Sliders,
  Waves,
  Compass,
  FastForward,
  Cpu
} from 'lucide-react';

interface ControlRoomPageProps {
  currentData: TimeBlockData;
  full24hrData: TimeBlockData[];
  currentBlock: number;
  onSelectBlock: (block: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  selectedDate: string;
  strategy: DispatchStrategy;
  onSelectStrategy: (strat: DispatchStrategy) => void;
}

// Circular progress ring helper component (unchanged styling)
const CircularStatusRing: React.FC<{
  percent: number;
  status: 'nominal' | 'watch' | 'critical';
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}> = ({ percent, status, size = 64, strokeWidth = 5, label, sublabel }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  const colorMap = {
    nominal: {
      stroke: '#10b981', // green
      text: 'text-emerald-400',
      bgRing: 'stroke-emerald-950/60',
    },
    watch: {
      stroke: '#eab308', // yellow
      text: 'text-yellow-400',
      bgRing: 'stroke-yellow-950/60',
    },
    critical: {
      stroke: '#ef4444', // red
      text: 'text-rose-400',
      bgRing: 'stroke-rose-950/60',
    },
  };

  const currentTheme = colorMap[status];

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={currentTheme.bgRing}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={currentTheme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span className={`absolute text-sm font-bold font-mono tabular-nums ${currentTheme.text}`}>
          {clampedPercent}%
        </span>
      </div>
      {label && <span className="mt-2 text-xs font-medium text-slate-300 truncate max-w-[90px]">{label}</span>}
      {sublabel && <span className="text-[10px] font-mono text-slate-500 truncate">{sublabel}</span>}
    </div>
  );
};

export const ControlRoomPage: React.FC<ControlRoomPageProps> = ({
  currentBlock,
  onSelectBlock,
  isPlaying,
  onTogglePlay,
  selectedDate,
  strategy,
  onSelectStrategy,
}) => {
  const [hoverBlock, setHoverBlock] = useState<number | null>(null);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [dispatchBlocks, setDispatchBlocks] = useState<DispatchBlock[]>([]);
  const [dispatchKPIs, setDispatchKPIs] = useState<StrategyKPIs | null>(null);
  const [compareDeltas, setCompareDeltas] = useState<{
    curtailment_saved_mwh: number;
    revenue_gain_inr: number;
    penalty_avoided_inr: number;
    in_band_gain_pct: number;
  } | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch real dispatch data, compare, and events for selectedDate & strategy
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getDispatch(selectedDate, strategy),
      api.getCompare(selectedDate),
      api.getEvents(selectedDate, strategy),
    ])
      .then(([disp, comp, evts]) => {
        setDispatchBlocks(disp.blocks);
        setDispatchKPIs(disp.kpis);
        setCompareDeltas(comp.deltas);
        setEvents(evts);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedDate, strategy]);

  // Active block data
  const curBlockData: DispatchBlock | undefined = dispatchBlocks[currentBlock - 1];

  const isCharging = (curBlockData?.charge || 0) > 0;
  const isDischarging = (curBlockData?.discharge || 0) > 0;

  // Active hover data for tooltip
  const activeTooltipData = hoverBlock !== null ? dispatchBlocks[hoverBlock - 1] : curBlockData;

  // Calculate current SVG x coordinate for playhead cursor
  const cursorX = ((currentBlock - 1) / 95) * 960;
  const solarGenVal = curBlockData?.solar_avail || 0;
  const currentY = 180 - (solarGenVal / 52) * 160;

  // Solar used %
  const solarAvailVal = curBlockData?.solar_avail || 0;
  const curtailedVal = curBlockData?.curtailed || 0;
  const solarUsedPercent =
    solarAvailVal > 0
      ? Math.round(((solarAvailVal - curtailedVal) / solarAvailVal) * 100)
      : 100;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#070c18] text-slate-100 py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Operational Bar: Plant Identity & Mode */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-5 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Gauge className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  Bhadla Solar Park · Substation Feeder 04
                </h1>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  BACKTEST REPLAY
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                <span>Capacity: 50 MW Solar + 20 MW / 80 MWh BESS</span>
                <span>·</span>
                <span>CERC 2026 DSM ±5% Compliant</span>
                <span>·</span>
                <span className="text-slate-300 font-semibold">
                  Date: {selectedDate} · Block {currentBlock} of 96
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Scrubber & Replay Controls */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto bg-[#070c18] p-3 rounded-xl border border-slate-800">
            <button
              onClick={onTogglePlay}
              className={`p-2 rounded-lg font-bold transition-all cursor-pointer ${
                isPlaying ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title={isPlaying ? 'Pause Replay' : 'Run 24h Settlement Replay'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
            </button>

            <div className="flex-1 min-w-[140px] md:w-60">
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>Settlement Time</span>
                <span className="text-amber-400 font-bold font-mono">
                  {curBlockData?.t || '—'} IST
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="96"
                value={currentBlock}
                onChange={(e) => onSelectBlock(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1 text-[10px] font-mono">
              <span className="text-slate-500 mr-1 hidden sm:inline">Speed:</span>
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    simSpeed === spd ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KEY GAUGES ROW (4 CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Deviation Meter (Replaces Feeder Potential Rail with exact same 3-bar layout) */}
          <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              <span>Deviation Meter</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-3 py-1">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-white tabular-nums">
                    {loading || !curBlockData
                      ? '—'
                      : `${curBlockData.deviation > 0 ? '+' : ''}${curBlockData.deviation.toFixed(1)}`}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">MW DEV</span>
                </div>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                    !curBlockData || Math.abs(curBlockData.deviation) <= Math.max(0.5, curBlockData.schedule * 0.05)
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      : 'bg-rose-950/80 text-rose-300 border-rose-800'
                  }`}
                >
                  {!curBlockData || Math.abs(curBlockData.deviation) <= Math.max(0.5, curBlockData.schedule * 0.05)
                    ? 'IN-BAND (±5%)'
                    : 'OUT OF BAND'}
                </span>
              </div>

              {/* Three-Bar Layout showing Schedule, Actual Injection, and Deviation vs ±5% */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-16 text-[10px] text-slate-400">Schedule</span>
                  <div className="flex-1 h-2 bg-slate-800/90 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((curBlockData?.schedule || 0) / 30) * 100)}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-slate-200">
                    {loading || !curBlockData ? '—' : `${curBlockData.schedule.toFixed(1)} MW`}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-16 text-[10px] text-slate-400">Injection</span>
                  <div className="flex-1 h-2 bg-slate-800/90 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((curBlockData?.injection || 0) / 30) * 100)}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-slate-200">
                    {loading || !curBlockData ? '—' : `${curBlockData.injection.toFixed(1)} MW`}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-16 text-[10px] text-slate-400">Tolerance</span>
                  <div className="flex-1 h-2 bg-slate-800/90 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all ${
                        !curBlockData || Math.abs(curBlockData.deviation) <= Math.max(0.5, curBlockData.schedule * 0.05)
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (Math.abs(curBlockData?.deviation || 0) /
                            Math.max(0.5, (curBlockData?.schedule || 0) * 0.05)) *
                            50
                        )}%`,
                      }}
                    />
                    <div className="absolute right-[50%] top-0 bottom-0 w-0.5 bg-white/40" title="±5% boundary" />
                  </div>
                  <span className="w-14 text-right text-slate-200">±5.0% Band</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  CERC Deviation Compliance
                </span>
                <span>Limit: 30 MW</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex justify-between">
              <span>Schedule Track</span>
              <span className="text-slate-200">
                {loading || !curBlockData ? '—' : `Block ${currentBlock} / 96`}
              </span>
            </div>
          </div>

          {/* Card 2: BESS State of Charge Ring (driven by dispatch data) */}
          <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">BESS State of Charge</span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {isCharging ? '+ CHARGING' : isDischarging ? '- DISCHARGING' : 'STANDBY'}
              </span>
            </div>
            <div className="my-2 flex items-center justify-center">
              <CircularStatusRing
                percent={curBlockData?.soc || 0}
                status={(curBlockData?.soc || 0) > 85 ? 'watch' : 'nominal'}
                size={84}
                strokeWidth={7}
                label="BESS SoC"
                sublabel="80 MWh LFP"
              />
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex justify-between">
              <span>Usable Window: 10%–90%</span>
              <span className="text-amber-400 font-bold font-mono">
                {loading || !curBlockData
                  ? '—'
                  : isCharging
                  ? `+${curBlockData.charge.toFixed(1)} MW`
                  : isDischarging
                  ? `-${curBlockData.discharge.toFixed(1)} MW`
                  : '0.0 MW'}
              </span>
            </div>
          </div>

          {/* Card 3: Solar Generation ring (shows solar used as % of available; footer shows grid injected vs limit & curtailed MW) */}
          <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Solar Generation Stream</span>
              <span className="text-xs font-mono text-amber-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Solar Used %
              </span>
            </div>
            <div className="my-2 flex items-center justify-center">
              <CircularStatusRing
                percent={solarUsedPercent}
                status={curtailedVal > 0 ? 'watch' : 'nominal'}
                size={84}
                strokeWidth={7}
                label="Solar Used"
                sublabel={loading || !curBlockData ? '—' : `${curBlockData.solar_avail.toFixed(1)} MW Available`}
              />
            </div>
            <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex justify-between">
              <span>Grid Injected</span>
              <span className="text-emerald-400 font-semibold font-mono">
                {loading || !curBlockData ? '—' : `${curBlockData.injection.toFixed(1)} / 30 MW Limit`}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex justify-between mt-1">
              <span>Curtailed (Wasted):</span>
              <span className={curtailedVal > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                {loading || !curBlockData ? '—' : `${curtailedVal.toFixed(1)} MW`}
              </span>
            </div>
          </div>

          {/* Card 4: Today's Ledger (Replaces Grid Frequency & Inertia: MWh recovered, Rs saved vs no battery, penalty avoided) */}
          <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider">
              <span>Today's Ledger</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="my-2 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                  {loading || !compareDeltas ? '—' : `${compareDeltas.curtailment_saved_mwh} MWh`}
                </span>
                <span className="text-[11px] font-mono text-emerald-300 font-semibold">
                  RECOVERED
                </span>
              </div>

              <div className="space-y-1.5 pt-1 text-xs font-mono">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Rs Saved vs None:</span>
                  <span className="text-amber-400 font-bold font-mono">
                    {loading || !compareDeltas ? '—' : `+₹${((compareDeltas.revenue_gain_inr) / 1000).toFixed(0)}k`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Penalty Avoided:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {loading || !compareDeltas ? '—' : `₹${((compareDeltas.penalty_avoided_inr) / 1000).toFixed(0)}k`}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex justify-between">
              <span>Net Value Generated</span>
              <span className="text-white font-semibold font-mono">
                {loading || !dispatchKPIs ? '—' : `₹${((dispatchKPIs.net_value_inr) / 100000).toFixed(2)} Lakh`}
              </span>
            </div>
          </div>
        </div>

        {/* 24-HOUR DYNAMIC DISPATCH TIMELINE & REAL-TIME LOG STREAM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main 24hr Dynamic Dispatch Chart */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                    Dynamic 24-Hour Solar Generation vs Transmission Limit
                  </h3>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Hover or scrub curve · Green bars = BESS Charge · Red bars = Evening Discharge · Red ticks = Out-of-band
                </p>
              </div>

              {/* Strategy toggle styled like existing pill toggles */}
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-700/80">
                <button
                  onClick={() => onSelectStrategy('none')}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                    strategy === 'none'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  No battery
                </button>
                <button
                  onClick={() => onSelectStrategy('rule')}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                    strategy === 'rule'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dumb battery
                </button>
                <button
                  onClick={() => onSelectStrategy('sunbank')}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                    strategy === 'sunbank'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  SunBank
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs font-mono mb-2">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-400" />
                Solar PV ({loading || !curBlockData ? '—' : `${curBlockData.solar_avail.toFixed(1)} MW`})
              </span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-0.5 bg-sky-400" />
                30 MW Limit
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                BESS Charge
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                Evening Discharge
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-1.5 h-2.5 bg-rose-500" />
                Out-of-band Tick
              </span>
            </div>

            {/* DYNAMIC SVG CHART WITH HOVER & LIVE CURSOR & TOUCH SCRUBBING */}
            <div
              className="h-72 w-full relative mt-2 cursor-crosshair select-none touch-none"
              onMouseLeave={() => setHoverBlock(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const xFraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const targetBlock = Math.max(1, Math.min(96, Math.round(xFraction * 95) + 1));
                setHoverBlock(targetBlock);
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const xFraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const targetBlock = Math.max(1, Math.min(96, Math.round(xFraction * 95) + 1));
                onSelectBlock(targetBlock);
              }}
              onTouchStart={(e) => {
                if (!e.touches[0]) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const xFraction = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                const targetBlock = Math.max(1, Math.min(96, Math.round(xFraction * 95) + 1));
                onSelectBlock(targetBlock);
                setHoverBlock(targetBlock);
              }}
              onTouchMove={(e) => {
                if (!e.touches[0]) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const xFraction = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
                const targetBlock = Math.max(1, Math.min(96, Math.round(xFraction * 95) + 1));
                onSelectBlock(targetBlock);
                setHoverBlock(targetBlock);
              }}
              onTouchEnd={() => setHoverBlock(null)}
            >
              <svg className="w-full h-full" viewBox="0 0 960 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="solarGradientDynamic" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.55" />
                    <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="curtailZoneGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.03" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                <line x1="0" y1="40" x2="960" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="960" y2="90" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="960" y2="140" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="180" x2="960" y2="180" stroke="#334155" />

                {/* Grid limit reference line at 30 MW (y ~ 90) */}
                <line x1="0" y1="90" x2="960" y2="90" stroke="#0284c7" strokeWidth="2" strokeDasharray="5 4" />
                <text x="14" y="84" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  GRID TRANSMISSION CAPACITY CEILING (30 MW)
                </text>

                {/* Curtailment Danger Zone Fill above 30 MW line with real MWh label */}
                <path
                  d="M 240 90 Q 480 25 720 90 Z"
                  fill="url(#curtailZoneGradient)"
                />
                <text x="480" y="55" fill="#f87171" fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.9">
                  {strategy === 'none'
                    ? `CURTAILMENT WASTED: ${dispatchKPIs?.curtailed_mwh ?? 36.8} MWh`
                    : strategy === 'rule'
                    ? `PARTIAL CURTAILMENT: ${dispatchKPIs?.curtailed_mwh ?? 14.2} MWh`
                    : `CURTAILMENT RECOVERED: ${(compareDeltas?.curtailment_saved_mwh ?? 36.4)} MWh (Loss: ${dispatchKPIs?.curtailed_mwh ?? 0.4} MWh)`}
                </text>

                {/* Dynamic SVG Bars for BESS flow & Out-of-band red ticks */}
                {dispatchBlocks.map((block, idx) => {
                  const x = (idx / 95) * 960;
                  const isOutBand =
                    block.schedule > 1 &&
                    Math.abs(block.deviation) > Math.max(0.5, block.schedule * 0.05);

                  return (
                    <g key={idx}>
                      {/* BESS Charging bars (above 90 line) */}
                      {block.charge > 0 && (
                        <rect
                          x={x - 3}
                          y={90 - (block.charge / 20) * 50}
                          width="6"
                          height={(block.charge / 20) * 50}
                          fill="#10b981"
                          opacity="0.8"
                        />
                      )}

                      {/* BESS Evening Discharge bars (below 180 baseline or 90) */}
                      {block.discharge > 0 && (
                        <rect
                          x={x - 3}
                          y={180 - (block.discharge / 20) * 45}
                          width="6"
                          height={(block.discharge / 20) * 45}
                          fill="#ef4444"
                          opacity="0.8"
                        />
                      )}

                      {/* Out-of-band small red tick in the existing red */}
                      {isOutBand && (
                        <line
                          x1={x}
                          y1="174"
                          x2={x}
                          y2="186"
                          stroke="#ef4444"
                          strokeWidth="2"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Solar Curve Polyline */}
                {dispatchBlocks.length > 0 && (
                  <path
                    d={`M 0 180 ${dispatchBlocks
                      .map((b, i) => {
                        const x = (i / 95) * 960;
                        const y = 180 - (b.solar_avail / 52) * 160;
                        return `L ${x} ${y}`;
                      })
                      .join(' ')} L 960 180 Z`}
                    fill="url(#solarGradientDynamic)"
                  />
                )}

                {dispatchBlocks.length > 0 && (
                  <path
                    d={`M 0 180 ${dispatchBlocks
                      .map((b, i) => {
                        const x = (i / 95) * 960;
                        const y = 180 - (b.solar_avail / 52) * 160;
                        return `L ${x} ${y}`;
                      })
                      .join(' ')}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    className="shadow-sm"
                  />
                )}

                {/* Dynamic Pulse Ring at Current Coordinate */}
                <circle
                  cx={cursorX}
                  cy={currentY}
                  r="6"
                  fill="#ffffff"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  className="animate-pulse"
                />
                <circle
                  cx={cursorX}
                  cy={currentY}
                  r="12"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  opacity="0.6"
                  className="animate-ping"
                />

                {/* Hover line if hovering */}
                {hoverBlock !== null && hoverBlock !== currentBlock && (
                  <line
                    x1={((hoverBlock - 1) / 95) * 960}
                    y1="25"
                    x2={((hoverBlock - 1) / 95) * 960}
                    y2="180"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}
              </svg>

              {/* Dynamic Floating Tooltip */}
              {hoverBlock !== null && activeTooltipData && (
                <div
                  className="absolute top-3 pointer-events-none p-3 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-700 shadow-xl text-xs font-mono z-30 transition-all"
                  style={{
                    left: `${Math.max(10, Math.min(80, ((hoverBlock - 1) / 95) * 100))}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="flex items-center justify-between gap-4 font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1.5">
                    <span className="text-amber-400">{activeTooltipData.t} IST</span>
                    <span>Block {hoverBlock}/96</span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between gap-4">
                      <span>Solar Avail:</span>
                      <strong className="text-amber-400 font-mono">{activeTooltipData.solar_avail} MW</strong>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Schedule:</span>
                      <strong className="text-cyan-400 font-mono">{activeTooltipData.schedule} MW</strong>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Grid Injected:</span>
                      <span className="text-emerald-400 font-mono">{activeTooltipData.injection} MW</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>BESS Flow:</span>
                      <strong
                        className={
                          activeTooltipData.charge > 0
                            ? 'text-emerald-400'
                            : activeTooltipData.discharge > 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {activeTooltipData.charge > 0
                          ? `+${activeTooltipData.charge} MW (Charge)`
                          : activeTooltipData.discharge > 0
                          ? `-${activeTooltipData.discharge} MW (Discharge)`
                          : 'Idle Standby'}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Deviation:</span>
                      <span
                        className={
                          Math.abs(activeTooltipData.deviation) <=
                          Math.max(0.5, activeTooltipData.schedule * 0.05)
                            ? 'text-emerald-300 font-mono'
                            : 'text-rose-400 font-mono font-bold'
                        }
                      >
                        {activeTooltipData.deviation > 0 ? '+' : ''}
                        {activeTooltipData.deviation} MW
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1 border-t border-slate-800/80 text-[10px] text-slate-500">
                    Click to jump replay to this block
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-4 pt-3 border-t border-slate-800">
              <span>00:00 Night</span>
              <span>06:00 Sunrise</span>
              <span className="text-amber-400 font-bold">12:00 Solar Peak</span>
              <span>18:00 Sunset</span>
              <span>24:00 Night</span>
            </div>
          </div>

          {/* Real-time Dispatch Decision Log (tags FCST, OPT, DSM) */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Dispatch Decision Log
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Strategy: {strategy.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-72 pr-1 font-mono text-xs">
                {events.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#070c18] border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="text-amber-400">{ev.t} IST</span>
                      <span
                        className={`uppercase text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          ev.tag === 'FCST'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : ev.tag === 'OPT'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {ev.tag}
                      </span>
                    </div>
                    <div className="text-slate-200 text-xs leading-relaxed">
                      {ev.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs font-mono text-slate-400 flex justify-between items-center">
              <span>Source: optimizer log</span>
              <span className="text-emerald-400 font-semibold">{selectedDate}</span>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Substation Bay Diagnostic Rings (6 Rings with specified metrics) */}
        <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-800 mb-5">
            <div>
              <h3 className="text-base font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                Substation Bay & Inverter Room Diagnostic Rings
              </h3>
              <p className="text-xs font-mono text-slate-400">
                SCADA telemetry polled across plant subsystems for {selectedDate}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {/* Ring 1: Solar used % */}
            <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800/80 flex flex-col items-center text-center justify-between">
              <span className="text-xs font-medium text-slate-300 truncate w-full mb-2">
                Solar used %
              </span>
              <CircularStatusRing
                percent={solarUsedPercent}
                status={solarUsedPercent < 80 ? 'watch' : 'nominal'}
                size={64}
                strokeWidth={5}
              />
            </div>

            {/* Ring 2: In-band blocks % */}
            <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800/80 flex flex-col items-center text-center justify-between">
              <span className="text-xs font-medium text-slate-300 truncate w-full mb-2">
                In-band blocks %
              </span>
              <CircularStatusRing
                percent={dispatchKPIs?.in_band_pct || 0}
                status={(dispatchKPIs?.in_band_pct || 0) < 85 ? 'watch' : 'nominal'}
                size={64}
                strokeWidth={5}
              />
            </div>

            {/* Ring 3: Battery SoC % */}
            <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800/80 flex flex-col items-center text-center justify-between">
              <span className="text-xs font-medium text-slate-300 truncate w-full mb-2">
                Battery SoC %
              </span>
              <CircularStatusRing
                percent={curBlockData?.soc || 0}
                status={(curBlockData?.soc || 0) > 85 ? 'watch' : 'nominal'}
                size={64}
                strokeWidth={5}
              />
            </div>

            {/* Ring 4: Grid-limit utilisation % */}
            <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800/80 flex flex-col items-center text-center justify-between">
              <span className="text-xs font-medium text-slate-300 truncate w-full mb-2">
                Grid-limit utilisation %
              </span>
              <CircularStatusRing
                percent={Math.min(100, Math.round(((curBlockData?.injection || 0) / 30) * 100))}
                status="nominal"
                size={64}
                strokeWidth={5}
              />
            </div>

            {/* Ring 5: Curtailment % */}
            <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800/80 flex flex-col items-center text-center justify-between">
              <span className="text-xs font-medium text-slate-300 truncate w-full mb-2">
                Curtailment %
              </span>
              <CircularStatusRing
                percent={
                  curBlockData && curBlockData.solar_avail > 0
                    ? Math.round((curBlockData.curtailed / curBlockData.solar_avail) * 100)
                    : 0
                }
                status={curBlockData && curBlockData.curtailed > 0 ? 'critical' : 'nominal'}
                size={64}
                strokeWidth={5}
              />
            </div>

            {/* Ring 6: Battery cycle use % */}
            <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800/80 flex flex-col items-center text-center justify-between">
              <span className="text-xs font-medium text-slate-300 truncate w-full mb-2">
                Battery cycle use %
              </span>
              <CircularStatusRing
                percent={Math.min(100, Math.round(((dispatchKPIs?.cycles || 0) / 1.0) * 100))}
                status="nominal"
                size={64}
                strokeWidth={5}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
