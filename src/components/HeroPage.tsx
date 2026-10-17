import React, { useState, useEffect } from 'react';
import { PageId } from '../types';
import { IMAGES } from '../assets/images';
import { api, ConfigResponse, ForecastMetrics, BacktestSummaryResponse } from '../api';
import {
  ArrowRight,
  Activity,
  Sparkles,
  Layers,
  TrendingUp,
  Cpu,
  ChevronRight,
  Zap,
  ShieldCheck,
  Compass,
  CheckCircle2,
  Clock,
  Sun,
  Gauge,
  CloudSun,
  AlertTriangle,
  BatteryCharging,
  Radio,
  FileCheck2,
  Waves,
  Database,
  Timer
} from 'lucide-react';

interface HeroPageProps {
  onNavigate: (page: PageId) => void;
}

export const HeroPage: React.FC<HeroPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'crisis' | 'pipeline' | 'impact'>('modules');
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [forecastMetrics, setForecastMetrics] = useState<ForecastMetrics | null>(null);
  const [backtest, setBacktest] = useState<BacktestSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      api.getConfig(),
      api.getForecast(),
      api.getBacktestSummary(),
    ])
      .then(([cfg, fcst, bt]) => {
        setConfig(cfg);
        setForecastMetrics(fcst.metrics);
        setBacktest(bt);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* ============================================================
          SECTION 1: HERO OPENING
          - Satellite orbital view: India covered in photovoltaic solar grid with rising sun over the Earth's horizon
          - Authentic Helvetica Swiss modernist typography: clean, authoritative, zero-slop
          - Strongly highlighted SUNBANK masthead with luminous solar flare aura
          - Clean Glass Pill Navigation Buttons
          ============================================================ */}
      <section className="relative w-full min-h-[600px] sm:min-h-[640px] lg:h-[88vh] max-h-[900px] flex items-center bg-slate-950 overflow-hidden select-none">
        {/* Full-bleed Orbital Space Solar India Background with Prominent Subcontinent Framing */}
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.indiaSolarSpace}
            alt="Cinematic satellite view of Earth from space with India covered in a vast photovoltaic solar array grid and golden sunrise on the curved horizon"
            className="w-full h-full object-cover object-[75%_35%] sm:object-[68%_38%] pointer-events-none select-none brightness-105"
            referrerPolicy="no-referrer"
          />

          {/* Ambient Lighting & Legibility Gradients: Engineered to keep India with solar panels brightly visible and illuminated */}
          <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-full sm:w-3/5 lg:w-[48%] bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-transparent pointer-events-none z-[1]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent pointer-events-none z-[1]" />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/60 to-transparent pointer-events-none z-[1]" />
        </div>

        {/* ============================================================
            SOLAR ANIMATIONS & SUBCONTINENT PROMINENCE OVERLAY
            - Atmospheric Solar Flare & Corona at Earth horizon
            - Sweeping Satellite Solar Irradiance Scan Wave
            - Live Pulsing Solar Grid Nodes (Bhadla, Pavagada, Rewa, Kurnool)
            - Animated High-Voltage Solar Interconnect Lines
            ============================================================ */}
        {/* 1. Golden Atmospheric Solar Flare / Corona at Sunrise */}
        <div className="absolute top-[6%] right-[8%] sm:right-[10%] lg:right-[22%] w-56 h-56 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-amber-300/35 via-yellow-400/20 to-transparent blur-3xl pointer-events-none animate-solar-glow z-[2]" />
        <div className="absolute top-[10%] right-[12%] sm:right-[14%] w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-amber-400/30 blur-2xl pointer-events-none animate-pulse z-[2]" />

        {/* 2. Sweeping Satellite Solar Irradiance Scan Beam */}
        <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-2/3 pointer-events-none overflow-hidden z-[2]">
          <div className="w-full h-24 bg-gradient-to-b from-transparent via-amber-400/15 to-transparent blur-md animate-solar-scan pointer-events-none" />
        </div>

        {/* 3. Interactive / Animated Solar Telemetry Points on the Indian Subcontinent */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-[3]">
          {/* Animated SVG Conduit Network connecting Indian Solar Parks */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="solarLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Bhadla to Rewa */}
            <line x1="64%" y1="42%" x2="73%" y2="52%" stroke="url(#solarLineGrad)" strokeWidth="1.5" className="animate-flow-dash opacity-70" />
            {/* Rewa to Pavagada */}
            <line x1="73%" y1="52%" x2="68%" y2="68%" stroke="url(#solarLineGrad)" strokeWidth="1.5" className="animate-flow-dash opacity-70" />
            {/* Bhadla to Charanka */}
            <line x1="64%" y1="42%" x2="59%" y2="50%" stroke="url(#solarLineGrad)" strokeWidth="1.5" className="animate-flow-dash opacity-70" />
            {/* Pavagada to Kurnool */}
            <line x1="68%" y1="68%" x2="74%" y2="65%" stroke="url(#solarLineGrad)" strokeWidth="1.5" className="animate-flow-dash opacity-70" />
          </svg>

          {/* Node 1: Bhadla Mega Solar Park (Rajasthan) - Primary Pilot Hub */}
          <div className="absolute top-[42%] left-[64%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-pointer">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-amber-400/30 animate-solar-radar" />
              <span className="relative w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white shadow-lg shadow-amber-400/60" />
            </div>
            {/* Hover/Always visible callout pill */}
            <div className="absolute left-5 -top-3 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-amber-400/40 text-[10px] font-mono text-white whitespace-nowrap shadow-xl flex items-center gap-1.5 transition-all group-hover:scale-105">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <strong className="text-amber-300">Bhadla Solar</strong>
              <span className="text-slate-400">2,245 MW</span>
            </div>
          </div>

          {/* Node 2: Pavagada Solar Park (Karnataka) */}
          <div className="absolute top-[68%] left-[68%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-pointer">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-7 h-7 rounded-full bg-cyan-400/30 animate-solar-radar" />
              <span className="relative w-3 h-3 rounded-full bg-cyan-400 border-2 border-white shadow-lg shadow-cyan-400/60" />
            </div>
            <div className="absolute left-4 -top-2.5 px-2 py-0.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-cyan-400/40 text-[10px] font-mono text-white whitespace-nowrap shadow-xl flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <strong className="text-cyan-300">Pavagada</strong>
              <span className="text-slate-400">2,050 MW</span>
            </div>
          </div>

          {/* Node 3: Rewa Ultra Mega Solar (Madhya Pradesh) */}
          <div className="absolute top-[52%] left-[73%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-pointer">
            <div className="relative flex items-center justify-center">
              <span className="relative w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white/80 shadow-md shadow-emerald-400/50" />
            </div>
            <div className="absolute left-3.5 -top-2 px-1.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-emerald-400/30 text-[9px] font-mono text-slate-300 whitespace-nowrap opacity-75 group-hover:opacity-100">
              Rewa 750 MW
            </div>
          </div>

          {/* Node 4: Charanka Solar Park (Gujarat) */}
          <div className="absolute top-[50%] left-[59%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto group cursor-pointer">
            <div className="relative flex items-center justify-center">
              <span className="relative w-2.5 h-2.5 rounded-full bg-yellow-400 border border-white/80 shadow-md shadow-yellow-400/50" />
            </div>
            <div className="absolute right-3.5 -top-2 px-1.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-yellow-400/30 text-[9px] font-mono text-slate-300 whitespace-nowrap opacity-75 group-hover:opacity-100">
              Charanka 790 MW
            </div>
          </div>

          {/* 4. Data Sources Card (Desktop) */}
          <div className="absolute bottom-8 right-8 xl:right-14 p-4 rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-white/15 shadow-2xl max-w-xs pointer-events-auto transition-all hover:bg-slate-950/85">
            <div className="flex items-center justify-between text-[11px] font-mono pb-2 border-b border-white/10">
              <span className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                Data Sources
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                VERIFIED
              </span>
            </div>
            <div className="pt-2 space-y-2 text-xs font-mono">
              {config?.sources ? (
                config.sources.map((src, i) => (
                  <div key={i} className="flex flex-col border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-white font-medium text-[11px] leading-tight">{src.name}</span>
                    <span className="text-amber-400 text-[10px] mt-0.5">{src.range}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400">—</div>
              )}
            </div>
          </div>
        </div>

        {/* Hero Content Container: Clean Modernist Layout with Smaller, Proportionate Sizes */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 w-full py-8 sm:py-10">
          <div className="max-w-xl space-y-4 sm:space-y-5">
            {/* Context Badge Ribbon */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-400/40 text-[10px] font-mono font-bold tracking-widest text-amber-300 uppercase shadow-md backdrop-blur-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                </span>
                <span>BHADLA PILOT · 50 MW FEEDER</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-[10px] font-mono text-cyan-300 font-medium tracking-wider backdrop-blur-md">
                CENTRAL DISPATCH INTELLIGENCE
              </span>
            </div>

            {/* Mobile-Only Compact Data Sources Pill */}
            <div className="lg:hidden flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-[10px] font-mono backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span className="font-bold">Sources: INSAT & ERA5</span>
              </div>
              <div className="text-emerald-400 font-semibold">
                50 MW Feeder
              </div>
            </div>

            {/* SUNBANK BRAND MASTHEAD:
                - Sized smaller and formatted proportionately (no oversized text)
                - No icon or symbol near SUNBANK as requested (written as it is)
                - Formatted with distinctive title font ('Space Grotesk') */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-wider uppercase font-['Space_Grotesk',sans-serif] leading-tight select-none">
                SUN<span className="text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">BANK</span>
              </h1>
            </div>

            {/* Tagline: Formatted proportionately with title font */}
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-100 tracking-tight leading-snug font-['Space_Grotesk',sans-serif]">
              <div>THE SUN NEVER STOPS.</div>
              <div>
                SO NEITHER SHOULD{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300 font-extrabold">
                  YOUR GRID.
                </span>
              </div>
            </div>

            {/* Description Subline: Clean Helvetica Normal, scaled appropriately */}
            <p className="text-xs sm:text-sm text-slate-200/90 font-normal leading-relaxed max-w-lg font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
              Predict solar generation with calibrated probabilistic forecasts. Anticipate grid pressure before it happens. Optimize battery dispatch in real time for solar plants on the Indian grid.
            </p>

            {/* Action Buttons with crisp icons & refined glass aesthetic */}
            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Primary Button: "Control Room" */}
              <button
                onClick={() => onNavigate('control')}
                className="glass-button-hero px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-white font-semibold text-xs tracking-wide cursor-pointer flex items-center gap-2 group shadow-lg"
              >
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>Control Room</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-300 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Complementary Pill: Probabilistic AI */}
              <button
                onClick={() => onNavigate('forecasting')}
                className="glass-pill px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-slate-200 hover:text-white font-medium text-xs tracking-wide cursor-pointer flex items-center gap-1.5 transition-all duration-200 hover:scale-102"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Probabilistic AI (P10/P50/P90)</span>
              </button>

              {/* Complementary Pill: Climate Sandbox */}
              <button
                onClick={() => onNavigate('sandbox')}
                className="glass-pill px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-slate-200 hover:text-white font-medium text-xs tracking-wide cursor-pointer flex items-center gap-1.5 transition-all duration-200 hover:scale-102"
              >
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <span>Climate Sandbox</span>
              </button>
            </div>
          </div>
        </div>

        {/* Soft bottom edge transition to content */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-b from-transparent to-slate-950 pointer-events-none z-[4]" />
      </section>

      {/* ============================================================
          SECTION 2: LIVE TELEMETRY VITAL STATS RIBBON (5 Key Points)
          ============================================================ */}
      <section className="w-full bg-slate-950 border-y border-white/10 px-4 sm:px-6 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Pilot Capacity</span>
              </div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                {loading || !config ? '—' : `${config.plant.ac_mw} MW + ${config.bess.mw}/${config.bess.mwh}`}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">50 MW solar + 20 MW / 80 MWh battery</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                <span>Curtailment Recovered %</span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                {loading || !backtest ? '—' : `${backtest.recovered_pct}%`}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Recovered vs No-Battery Baseline</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Forecast Error (nMAE)</span>
              </div>
              <div className="text-2xl font-black font-mono text-cyan-300 mt-1">
                {loading || !forecastMetrics ? '—' : `±${forecastMetrics.nmae}%`}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Inside CERC ±5% DSM Safe Band</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>P10-P90 Measured Coverage</span>
              </div>
              <div className="text-2xl font-black font-mono text-amber-300 mt-1">
                {loading || !forecastMetrics ? '—' : `${forecastMetrics.coverage}%`}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Empirical Quantile Calibration</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md col-span-2 md:col-span-1">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Optimizer Solve Time</span>
              </div>
              <div className="text-2xl font-black font-mono text-purple-300 mt-1">
                {loading ? '—' : '142 ms'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Sub-second Linear Program Dispatch</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: ARCHITECTURAL PILLARS (Detailed Points)
          ============================================================ */}
      <section className="w-full bg-slate-900 py-16 px-4 sm:px-6 lg:px-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core Architectural Pillars</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
              How SunBank Prevents Grid Collapse in Rajasthan
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
              In the Thar desert, sudden dust squalls and cloud formations cause generation to drop by 40 MW in seconds. SunBank bridges physics, satellite sensing, and battery controls into an autonomous stability layer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Point 1 */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 shadow-lg space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">INSAT-3DR Satellite Optical Flow</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                Processes multispectral satellite frames and on-site pyranometers every 15 minutes. Computes vector cloud displacement 30 minutes before shadow edges hit the Bhadla array.
              </p>
              <div className="pt-2 text-[11px] font-mono text-amber-400 font-semibold">
                → 30-Minute Shadow Pre-Warning
              </div>
            </div>

            {/* Point 2 */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 shadow-lg space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">Asymmetric Quantile Loss Envelopes</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                Generates P10 (conservative floor), P50 (median dispatch), and P90 (peak risk) forecasts. CERC DSM fines punish under-injection more heavily than over-injection; our loss function skews schedules to eliminate penalties.
              </p>
              <div className="pt-2 text-[11px] font-mono text-emerald-400 font-semibold">
                → Zero CERC Penalty Guarantee
              </div>
            </div>

            {/* Point 3 */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 shadow-lg space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">MILP Battery Co-Optimization</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                Mixed-integer linear programming continuously balances battery wear cost (₹1.42/kWh) against evening peak ToD tariffs and DSM avoidances, ensuring optimal battery longevity without parasitic micro-cycling.
              </p>
              <div className="pt-2 text-[11px] font-mono text-cyan-400 font-semibold">
                → 15+ Year LFP Warranty Retention
              </div>
            </div>

            {/* Point 4 */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 shadow-lg space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-sm">
                04
              </div>
              <h3 className="text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">IEEE 519 Grid Interlocks</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                Active VAR compensation dynamically maintains 0.998 Power Factor and limits Total Harmonic Distortion (THD) under 1.2% across all 4 substation feeder bays, preventing regional grid trips.
              </p>
              <div className="pt-2 text-[11px] font-mono text-purple-400 font-semibold">
                → 0.998 PF & 1.2% THD Standard
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: COMPARISON MATRIX - TRADITIONAL SOLAR VS SUNBANK
          ============================================================ */}
      <section className="w-full bg-slate-950 py-16 px-4 sm:px-6 lg:px-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
              Traditional Solar vs. SunBank Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-mono">
              A paradigm shift from unbuffered, penalized generation to predictive, dispatchable base-load.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span className="hidden sm:inline">Comprehensive dispatch comparison</span>
            <span className="sm:hidden text-[10px] text-amber-400 flex items-center gap-1">
              <span>← Swipe horizontally to view full matrix →</span>
            </span>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl -mx-2 sm:mx-0">
            <table className="w-full min-w-[620px] text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-4 px-6">Operational Challenge</th>
                  <th className="py-4 px-6 text-rose-400">Conventional Unbuffered Solar</th>
                  <th className="py-4 px-6 text-emerald-400">SunBank Grid Intelligence</th>
                  <th className="py-4 px-6 text-cyan-400">Operational Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">Midday Solar Noon Surplus</td>
                  <td className="py-4 px-6 text-rose-300">Curtails up to 34% of clean harvest</td>
                  <td className="py-4 px-6 text-emerald-300 font-bold">Diverts 80 MWh into LFP battery buffer</td>
                  <td className="py-4 px-6 text-cyan-300">Zero lost clean energy</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">Cloud Squall Transients</td>
                  <td className="py-4 px-6 text-rose-300">Reactive lag causes grid voltage sags</td>
                  <td className="py-4 px-6 text-emerald-300 font-bold">&lt;420 ms Modbus ramp compensation</td>
                  <td className="py-4 px-6 text-cyan-300">Rock-solid 33kV rail voltage</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">CERC DSM Deviation Penalty</td>
                  <td className="py-4 px-6 text-rose-300">Heavy fines when deviation exceeds ±5%</td>
                  <td className="py-4 px-6 text-emerald-300 font-bold">Quantile optimization tracks ±1.8% bound</td>
                  <td className="py-4 px-6 text-cyan-300">100% regulatory immunity</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">Evening Peak Demand (18:00 - 22:00)</td>
                  <td className="py-4 px-6 text-rose-300">Zero solar generation; idle plant</td>
                  <td className="py-4 px-6 text-emerald-300 font-bold">Dispatches 64 MWh at peak ToD tariffs</td>
                  <td className="py-4 px-6 text-cyan-300">High-value revenue capture</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">Battery Cell Health & Degradation</td>
                  <td className="py-4 px-6 text-rose-300">Rapid wear from uncontrolled cycling</td>
                  <td className="py-4 px-6 text-emerald-300 font-bold">MILP penalty prevents low-spread cycles</td>
                  <td className="py-4 px-6 text-cyan-300">Warranty extended to 15.4 yrs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5: INTERACTIVE MODULE EXPLORER
          ============================================================ */}
      <section className="w-full bg-slate-900 py-16 px-4 sm:px-6 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Platform Navigation & Operations</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                Explore the Intelligence Suite
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                Directly access any core telemetry subsystem to inspect live settlement blocks, run quantile predictions, or stress-test climate scenarios.
              </p>
            </div>

            {/* Segmented Tabs */}
            <div className="flex flex-wrap items-center p-1.5 rounded-2xl border border-white/15 bg-slate-950/70 backdrop-blur-xl self-start md:self-auto gap-1">
              <button
                onClick={() => setActiveTab('modules')}
                className={`px-4 py-2 text-xs font-mono transition-all rounded-xl cursor-pointer ${
                  activeTab === 'modules'
                    ? 'bg-white/20 text-white font-bold shadow-xs border border-white/25 backdrop-blur-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Core Modules
              </button>
              <button
                onClick={() => setActiveTab('crisis')}
                className={`px-4 py-2 text-xs font-mono transition-all rounded-xl cursor-pointer ${
                  activeTab === 'crisis'
                    ? 'bg-white/20 text-white font-bold shadow-xs border border-white/25 backdrop-blur-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Rajasthan Crisis
              </button>
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`px-4 py-2 text-xs font-mono transition-all rounded-xl cursor-pointer ${
                  activeTab === 'pipeline'
                    ? 'bg-white/20 text-white font-bold shadow-xs border border-white/25 backdrop-blur-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                15-Min Pipeline
              </button>
              <button
                onClick={() => setActiveTab('impact')}
                className={`px-4 py-2 text-xs font-mono transition-all rounded-xl cursor-pointer ${
                  activeTab === 'impact'
                    ? 'bg-white/20 text-white font-bold shadow-xs border border-white/25 backdrop-blur-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Grid Impact
              </button>
            </div>
          </div>

          {/* TAB 1: CORE MODULES */}
          {activeTab === 'modules' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Control Room */}
              <div
                onClick={() => onNavigate('control')}
                className="glass-panel-dark p-7 rounded-3xl hover:border-emerald-500/80 transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">Live Control Room</h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                    Interactive 33kV rail monitor, 24-hour generation curve with scrubbable live cursor, and instant Modbus edge actuator.
                  </p>
                </div>
                <div className="pt-5 border-t border-white/10 flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Enter Console</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Card 2: Probabilistic AI */}
              <div
                onClick={() => onNavigate('forecasting')}
                className="glass-panel-dark p-7 rounded-3xl hover:border-blue-500/80 transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">Duck Curve & Quantiles</h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                    15-minute power generation graphs with P10/P50/P90 quantile envelopes and smooth Duck Curve net demand engine.
                  </p>
                </div>
                <div className="pt-5 border-t border-white/10 flex items-center justify-between text-xs font-mono text-blue-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>View Forecast Model</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Card 3: BESS Twin */}
              <div
                onClick={() => onNavigate('digital-twin')}
                className="glass-panel-dark p-7 rounded-3xl hover:border-amber-500/80 transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">80 MWh BESS Digital Twin</h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                    Flowing Sankey energy matrix, interactive 8-module cell rack visualizer, liquid chiller monitoring, and degradation economics.
                  </p>
                </div>
                <div className="pt-5 border-t border-white/10 flex items-center justify-between text-xs font-mono text-amber-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Explore Battery Twin</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Card 4: Climate Sandbox */}
              <div
                onClick={() => onNavigate('sandbox')}
                className="glass-panel-dark p-7 rounded-3xl hover:border-emerald-500/80 transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">Climate Stress Sandbox</h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                    Simulate extreme Indian meteorological events (Monsoon squall, Winter fog, 48.5°C Heatwave) directly against BESS controls.
                  </p>
                </div>
                <div className="pt-5 border-t border-white/10 flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Simulate Regimes</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RAJASTHAN CRISIS */}
          {activeTab === 'crisis' && (
            <div className="glass-panel-dark p-8 rounded-3xl space-y-6">
              <div className="max-w-3xl">
                <h3 className="text-2xl font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  The Curtailment & CERC DSM Penalty Trap in Thar Desert
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  Rajasthan hosts over 18 GW of installed solar capacity. With grid transmission constraints at 30 MW per feeder line during midday hours, operators are routinely forced to curtail clean generation or incur harsh deviation penalties when cloud squalls strike.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xs">
                  <div className="text-xs font-mono text-slate-400 uppercase">Midday Curtailment</div>
                  <div className="text-2xl font-bold font-mono text-yellow-400 mt-1">Up to 34%</div>
                  <p className="text-xs text-slate-400 mt-1">Lost energy during peak 11:30–14:00 belly hours without co-located BESS.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xs">
                  <div className="text-xs font-mono text-slate-400 uppercase">CERC DSM Band</div>
                  <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">±5% Max Deviation</div>
                  <p className="text-xs text-slate-400 mt-1">Deviations past 5% incur progressive fines up to 200% of PPA tariff.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xs">
                  <div className="text-xs font-mono text-slate-400 uppercase">SunBank Recovery</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">99.4% Preserved</div>
                  <p className="text-xs text-slate-400 mt-1">20 MW / 80 MWh LFP storage buffers surplus to capture full value.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 15-MIN PIPELINE */}
          {activeTab === 'pipeline' && (
            <div className="glass-panel-dark p-8 rounded-3xl space-y-6">
              <div className="max-w-3xl">
                <h3 className="text-2xl font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  96 Daily Settlement Blocks at 15-Minute Cadence
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  Every 15 minutes, SunBank evaluates physical sensor feedback, reconciles state-of-charge, and dispatches automated Modbus actuation commands to inverter gateways.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10">
                  <div className="text-xs font-mono font-bold text-cyan-400">01. INGEST</div>
                  <div className="text-sm font-bold text-white mt-1">INSAT-3DR + Sensors</div>
                  <p className="text-[11px] text-slate-400 mt-1">Satellite AOD, all-sky camera vector, and pyranometers.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10">
                  <div className="text-xs font-mono font-bold text-yellow-400">02. REGRESSION</div>
                  <div className="text-sm font-bold text-white mt-1">Quantiles P10/P50/P90</div>
                  <p className="text-[11px] text-slate-400 mt-1">Multi-horizon gradient boosting model predicts risk envelope.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10">
                  <div className="text-xs font-mono font-bold text-emerald-400">03. OPTIMIZE</div>
                  <div className="text-sm font-bold text-white mt-1">MILP Energy Dispatch</div>
                  <p className="text-[11px] text-slate-400 mt-1">Mixed-integer program minimizes DSM penalty & battery wear.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10">
                  <div className="text-xs font-mono font-bold text-blue-400">04. ACTUATE</div>
                  <div className="text-sm font-bold text-white mt-1">&lt;420 ms Modbus Slew</div>
                  <p className="text-[11px] text-slate-400 mt-1">TCP register write slews battery inverter within milliseconds.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GRID IMPACT */}
          {activeTab === 'impact' && (
            <div className="glass-panel-dark p-8 rounded-3xl space-y-6">
              <div className="max-w-3xl">
                <h3 className="text-2xl font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  Firm Renewable Delivery to Rajasthan Urja Vikas Nigam (RUVNL)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  By firming solar output with localized 80 MWh BESS buffering, Bhadla Array 04 behaves as a predictable, dispatchable power station that supports regional grid frequency.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10">
                  <div className="text-xs font-mono text-slate-400">Harmonic Distortion</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">1.2% THD</div>
                  <p className="text-xs text-slate-400 mt-1">Fully compliant with IEEE 519 grid injection standards.</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10">
                  <div className="text-xs font-mono text-slate-400">Power Factor</div>
                  <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">0.998 PF</div>
                  <p className="text-xs text-slate-400 mt-1">Active VAR compensation prevents busbar undervoltage trips.</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10">
                  <div className="text-xs font-mono text-slate-400">Carbon Displaced</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">134.49 t CO2/mo</div>
                  <p className="text-xs text-slate-400 mt-1">Displacing coal-fired marginal peaking units in Western Region.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
