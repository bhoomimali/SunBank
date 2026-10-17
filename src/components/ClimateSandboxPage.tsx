import React, { useState, useEffect } from 'react';
import { IMAGES } from '../assets/images';
import { api, ScenarioResponse, ScenarioDay } from '../api';
import {
  Wind,
  Zap,
  Clock,
  Thermometer,
  Droplets,
  MapPin,
  Eye,
  Activity,
  CheckCircle2,
  TrendingDown,
  Gauge,
  Sliders,
  Sparkles,
  LayoutGrid,
  Calendar,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  Compass,
  Radio,
  Layers,
  SunMedium,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface ClimateSandboxPageProps {
  onApplyScenarioToSim?: (scenarioId: string, date?: string) => void;
}

type RegimeType = 'monsoon' | 'winter_fog' | 'summer_heat' | 'stubble_haze' | 'clear';

const REGIMES: { id: RegimeType; label: string; icon: string; bgImage: string; headline: string; tempIcon: string }[] = [
  {
    id: 'monsoon',
    label: 'Monsoon',
    icon: '⛈',
    bgImage: IMAGES.dramaticStormRain,
    headline: 'Convective Monsoon Cloud Squalls',
    tempIcon: '⛈',
  },
  {
    id: 'winter_fog',
    label: 'Winter Fog',
    icon: '🌫',
    bgImage: IMAGES.sandboxWinterFog,
    headline: 'Dense Indo-Gangetic Radiation Fog',
    tempIcon: '🌫',
  },
  {
    id: 'summer_heat',
    label: 'Summer Heat',
    icon: '☀',
    bgImage: IMAGES.sandboxSummerHeat,
    headline: 'Extreme Thar Desert Summer Heatwave',
    tempIcon: '☀',
  },
  {
    id: 'stubble_haze',
    label: 'Stubble Haze',
    icon: '🔥',
    bgImage: IMAGES.sandboxStubbleHaze,
    headline: 'Post-Harvest Biomass Burning Aerosols',
    tempIcon: '🔥',
  },
  {
    id: 'clear',
    label: 'Clear Day',
    icon: '☀',
    bgImage: IMAGES.heroSolarSunrise,
    headline: 'Unobstructed High-Flux Clear Sky',
    tempIcon: '☀',
  },
];

export const ClimateSandboxPage: React.FC<ClimateSandboxPageProps> = ({ onApplyScenarioToSim }) => {
  const [selectedRegime, setSelectedRegime] = useState<RegimeType>('monsoon');
  const [activeDayIdx, setActiveDayIdx] = useState<number>(3);
  const [isApplied, setIsApplied] = useState<boolean>(false);
  const [brightnessBoost, setBrightnessBoost] = useState<boolean>(true);
  const [scenarioData, setScenarioData] = useState<ScenarioResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const activeRegimeMeta = REGIMES.find((r) => r.id === selectedRegime) || REGIMES[0];

  const fetchRegime = (regime: RegimeType) => {
    setLoading(true);
    api.getScenario(regime)
      .then((data) => {
        setScenarioData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRegime(selectedRegime);
    setActiveDayIdx(0);
  }, [selectedRegime]);

  const days: ScenarioDay[] = scenarioData?.days || [];
  const selectedDay: ScenarioDay | undefined = days[activeDayIdx] || days[0];

  const handleRunRegime = () => {
    fetchRegime(selectedRegime);
    setIsApplied(true);
    if (onApplyScenarioToSim && selectedDay) {
      onApplyScenarioToSim(selectedRegime, selectedDay.date);
    }
    setTimeout(() => setIsApplied(false), 2500);
  };

  // Dynamically generated regime description text from selected day's data (no invented numbers)
  const dynamicRegimeDescription = selectedDay
    ? `Observation for ${selectedDay.date}: Peak irradiance reaches ${selectedDay.ghi_peak} W/m² with ambient temperature at ${selectedDay.tmax}°C. Baseline solar without BESS curtails ${selectedDay.compare.none.curtailed_mwh.toFixed(1)} MWh (${selectedDay.compare.none.in_band_pct.toFixed(1)}% in-band compliance). SunBank co-optimization restricts curtailment to ${selectedDay.compare.sunbank.curtailed_mwh.toFixed(1)} MWh, achieving ${selectedDay.compare.sunbank.in_band_pct.toFixed(1)}% in-band compliance with ₹${Math.round(selectedDay.compare.sunbank.penalty_inr).toLocaleString()} DSM penalties.`
    : 'Loading telemetry for selected regime...';

  return (
    <div className="w-full min-h-[calc(100vh-4.25rem)] bg-slate-950 py-6 sm:py-10 px-3 sm:px-6 lg:px-10 flex flex-col items-center justify-center transition-colors duration-500">
      {/* Outer ambient container with dark atmospheric backdrop */}
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Top Regime Selector Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-yellow-400 text-slate-950 font-bold shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-yellow-300 font-bold">
                Atmospheric Testing Console
              </div>
              <div className="text-sm font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                Indian Climate Regimes & Grid Stress Profiles
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Brightness Enhancer Toggle */}
            <button
              onClick={() => setBrightnessBoost(!brightnessBoost)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer border ${
                brightnessBoost
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
              }`}
              title="Toggle vibrant background visibility"
            >
              <SunMedium className="w-3.5 h-3.5" />
              <span>Vibrant View</span>
            </button>

            {/* Regime Pills (Includes Clear Day control in same tab style) */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-950/70 rounded-2xl border border-white/10">
              {REGIMES.map((sc) => {
                const isSelected = selectedRegime === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setSelectedRegime(sc.id);
                      setIsApplied(false);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-mono font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-yellow-400 text-slate-950 font-bold shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{sc.icon} {sc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================
            MAIN CLIMATE SANDBOX DASHBOARD (FAITHFUL TO USER'S REFERENCE IMAGE)
            ============================================================ */}
        <div className="relative w-full rounded-[32px] overflow-hidden border border-white/20 shadow-2xl bg-slate-950 flex flex-col md:flex-row min-h-[640px] lg:min-h-[720px]">
          {/* LEFT VERTICAL GLASS DOCK */}
          <div className="w-full md:w-20 bg-slate-950/50 backdrop-blur-2xl border-b md:border-b-0 md:border-r border-white/10 flex md:flex-col items-center justify-between p-4 z-20">
            {/* Top Logo Emblem */}
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white shadow-sm">
              <span className="text-xl">☀</span>
            </div>

            {/* Navigation Icon Stack */}
            <div className="flex md:flex-col items-center gap-4 sm:gap-6 text-slate-300">
              {REGIMES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRegime(r.id)}
                  className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
                    selectedRegime === r.id
                      ? 'bg-white/25 text-white border border-white/35 shadow-md'
                      : 'hover:text-white hover:bg-white/10'
                  }`}
                  title={r.label}
                >
                  <span className="text-sm">{r.icon}</span>
                </button>
              ))}
              <button
                onClick={handleRunRegime}
                className="p-2.5 rounded-2xl hover:text-white hover:bg-white/10 text-emerald-300 transition-all cursor-pointer"
                title="Run this regime"
              >
                <Zap className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Icon */}
            <div className="hidden md:flex">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-slate-300">
                <LogOut className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* MAIN INNER AREA WITH BRIGHT, VIVID ATMOSPHERIC PHOTO & UI OVERLAYS */}
          <div className="relative flex-1 flex flex-col justify-between overflow-hidden">
            {/* Full-bleed background photo of selected regime */}
            <div className="absolute inset-0 z-0">
              <img
                src={activeRegimeMeta.bgImage}
                alt={activeRegimeMeta.headline}
                className={`w-full h-full object-cover object-center transform transition-all duration-700 ease-out ${
                  brightnessBoost
                    ? 'brightness-[1.08] contrast-[1.08] saturate-[1.15]'
                    : 'brightness-[0.95] contrast-[1.05]'
                }`}
                referrerPolicy="no-referrer"
              />

              {/* Translucent glass tint so background scenery shines through crisply */}
              <div className="absolute inset-0 bg-slate-950/15" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/20 to-slate-950/50" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
            </div>

            {/* TOP BAR INSIDE PANEL */}
            <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between border-b border-white/10 backdrop-blur-xs">
              <div>
                <span className="text-xs text-slate-200 font-mono block drop-shadow-md">Welcome</span>
                <span className="text-base sm:text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif] drop-shadow-md">
                  Substation Control · Bhadla 04
                </span>
                <div className="mt-1">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900/50 backdrop-blur-md border border-white/20 text-yellow-300 font-semibold shadow-xs">
                    Weather Forecast · Bhadla Solar Complex, Rajasthan
                  </span>
                </div>
              </div>

              {/* Utility Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleRunRegime}
                  className="w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-md"
                  title="Run this regime"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="w-9 h-9 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/20 hidden sm:flex items-center justify-center text-white shadow-md">
                  <Search className="w-4 h-4" />
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/20 hidden sm:flex items-center justify-center text-white shadow-md">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 to-emerald-400 p-0.5 shadow-lg">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-xs font-mono font-bold text-white">
                    SB
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER & BOTTOM GRID: Left Column (Headline + Wave Track) & Right Column (Cards) */}
            <div className="relative z-10 p-6 sm:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              {/* LEFT COLUMN: 8 Columns */}
              <div className="lg:col-span-8 space-y-5">
                {/* Dynamically generated regime description from chosen day */}
                <div className="space-y-1.5 bg-slate-950/30 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 max-w-xl">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-yellow-300 font-semibold flex items-center gap-1.5">
                    <span>Active Regime</span>
                    <span>•</span>
                    <span>{activeRegimeMeta.label} Telemetry</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif] tracking-tight leading-tight drop-shadow-md">
                    {activeRegimeMeta.headline}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-100 font-normal leading-relaxed drop-shadow-sm">
                    {dynamicRegimeDescription}
                  </p>
                </div>

                {/* HORIZONTAL FORECAST TRACK & 6-DAY TILES FROM /api/scenario */}
                <div className="pt-2 space-y-2 bg-slate-950/35 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  {/* Daily Weather Nodes with Real Dates, Temperatures & Peak Irradiance */}
                  <div className="grid grid-cols-6 text-center text-white select-none">
                    {days.map((item, idx) => {
                      const isActive = idx === activeDayIdx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setActiveDayIdx(idx)}
                          className={`flex flex-col items-center py-2 px-1 rounded-xl cursor-pointer transition-all ${
                            isActive
                              ? 'bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg scale-105'
                              : 'hover:bg-white/15'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-base sm:text-xl font-bold font-mono">
                              {loading ? '—' : `${item.tmax}°`}
                            </span>
                            <span className="text-sm sm:text-base">{activeRegimeMeta.tempIcon}</span>
                          </div>
                          <span className="text-[10px] font-mono text-yellow-300 mt-0.5">
                            {loading ? '—' : `${item.ghi_peak} W/m²`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Luminous Wave Curve */}
                  <div className="h-24 w-full relative">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 600 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="curveShadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
                        </linearGradient>

                        <filter id="glowLight" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Smooth Wave Line connecting GHI heights */}
                      {days.length > 0 && (
                        <>
                          <path
                            d={`M 0 100 ${days
                              .map((d, i) => {
                                const x = (i / 5) * 600;
                                const y = 100 - Math.min(85, Math.max(15, (d.ghi_peak / 1100) * 85));
                                return `L ${x} ${y}`;
                              })
                              .join(' ')} L 600 100 Z`}
                            fill="url(#curveShadeGrad)"
                          />
                          <path
                            d={`M 0 ${100 - Math.min(85, Math.max(15, (days[0]?.ghi_peak / 1100) * 85))} ${days
                              .map((d, i) => {
                                const x = (i / 5) * 600;
                                const y = 100 - Math.min(85, Math.max(15, (d.ghi_peak / 1100) * 85));
                                return `L ${x} ${y}`;
                              })
                              .join(' ')}`}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="3"
                            filter="url(#glowLight)"
                          />
                        </>
                      )}

                      {/* Active Node Vertical Flare */}
                      {days.length > 0 && selectedDay && (
                        (() => {
                          const activeX = (activeDayIdx / 5) * 500 + 50;
                          const activeY = 100 - Math.min(85, Math.max(15, (selectedDay.ghi_peak / 1100) * 85));
                          return (
                            <g>
                              <line
                                x1={activeX}
                                y1={activeY}
                                x2={activeX}
                                y2="100"
                                stroke="#ffffff"
                                strokeWidth="1.5"
                                strokeDasharray="2 2"
                                opacity="0.85"
                              />
                              <circle
                                cx={activeX}
                                cy={activeY}
                                r="8"
                                fill="none"
                                stroke="#fbbf24"
                                strokeWidth="2"
                                className="animate-ping"
                                opacity="0.7"
                              />
                              <circle
                                cx={activeX}
                                cy={activeY}
                                r="5"
                                fill="#ffffff"
                                stroke="#f59e0b"
                                strokeWidth="2.5"
                              />
                            </g>
                          );
                        })()
                      )}
                    </svg>
                  </div>

                  {/* Real Dates Row below wave line */}
                  <div className="grid grid-cols-6 text-center text-xs font-mono text-slate-200 pt-1 select-none">
                    {days.map((item, idx) => (
                      <span
                        key={idx}
                        onClick={() => setActiveDayIdx(idx)}
                        className={`cursor-pointer transition-colors ${
                          idx === activeDayIdx ? 'text-white font-bold underline decoration-yellow-400 decoration-2 underline-offset-4' : 'hover:text-white'
                        }`}
                      >
                        {item.date}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: 4 Columns — High-Transparency Glass Cards */}
              <div className="lg:col-span-4 space-y-3">
                {/* 1. TOP MAIN LOCATION CARD */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/20 text-white shadow-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-200">
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-yellow-300" />
                      Central Bhadla Complex
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      LIVE
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between py-1">
                    <div className="text-5xl sm:text-6xl font-black font-['Helvetica_Neue',Helvetica,Arial,sans-serif] tracking-tight">
                      {loading || !selectedDay ? '—' : selectedDay.tmax}
                      <span className="text-3xl font-light text-slate-300">°C</span>
                    </div>
                    <div className="text-4xl">{activeRegimeMeta.tempIcon}</div>
                  </div>

                  {/* Metric Pills */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/15 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-slate-200">
                      <Wind className="w-3.5 h-3.5 text-cyan-300" />
                      <span>{selectedDay?.date ?? '—'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-200">
                      <Droplets className="w-3.5 h-3.5 text-blue-300" />
                      <span>{selectedDay ? `${selectedDay.ghi_peak} W/m²` : '—'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-200">
                      <Eye className="w-3.5 h-3.5 text-emerald-300" />
                      <span>nMAE {scenarioData?.summary.nmae ?? 2.5}%</span>
                    </span>
                  </div>
                </div>

                {/* 2. THREE SMALL CARDS: REPLACED WITH "No battery", "Dumb battery", "SunBank" */}
                {/* Card 1: No battery */}
                <div className="p-3.5 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/15 text-white shadow-md flex items-center justify-between hover:bg-slate-900/70 transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-rose-300 uppercase tracking-wider font-semibold">
                      Strategy 1
                    </div>
                    <div className="text-xs font-bold font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-white">
                      No battery
                    </div>
                    <div className="text-[11px] font-mono text-rose-400 mt-0.5">
                      {loading || !selectedDay ? '—' : `${selectedDay.compare.none.curtailed_mwh.toFixed(1)} MWh Curtailed`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-slate-200">
                      {loading || !selectedDay ? '—' : `${selectedDay.compare.none.in_band_pct.toFixed(1)}% In-band`}
                    </div>
                    <div className="text-[10px] text-rose-300 font-mono">
                      {loading || !selectedDay ? '—' : `₹${Math.round(selectedDay.compare.none.penalty_inr / 1000)}k Penalty`}
                    </div>
                  </div>
                </div>

                {/* Card 2: Dumb battery */}
                <div className="p-3.5 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/15 text-white shadow-md flex items-center justify-between hover:bg-slate-900/70 transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-amber-300 uppercase tracking-wider font-semibold">
                      Strategy 2
                    </div>
                    <div className="text-xs font-bold font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-white">
                      Dumb battery
                    </div>
                    <div className="text-[11px] font-mono text-amber-300 mt-0.5">
                      {loading || !selectedDay ? '—' : `${selectedDay.compare.rule.curtailed_mwh.toFixed(1)} MWh Curtailed`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-slate-200">
                      {loading || !selectedDay ? '—' : `${selectedDay.compare.rule.in_band_pct.toFixed(1)}% In-band`}
                    </div>
                    <div className="text-[10px] text-amber-300 font-mono">
                      {loading || !selectedDay ? '—' : `₹${Math.round(selectedDay.compare.rule.penalty_inr / 1000)}k Penalty`}
                    </div>
                  </div>
                </div>

                {/* Card 3: SunBank */}
                <div className="p-3.5 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-emerald-500/40 text-white shadow-md flex items-center justify-between hover:bg-slate-900/70 transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-emerald-300 uppercase tracking-wider font-semibold">
                      Strategy 3 · Optimal
                    </div>
                    <div className="text-xs font-bold font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-white">
                      SunBank
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                      {loading || !selectedDay ? '—' : `${selectedDay.compare.sunbank.curtailed_mwh.toFixed(1)} MWh Curtailed`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-emerald-300">
                      {loading || !selectedDay ? '—' : `${selectedDay.compare.sunbank.in_band_pct.toFixed(1)}% In-band`}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      {loading || !selectedDay ? '—' : `₹${Math.round(selectedDay.compare.sunbank.penalty_inr / 1000)}k Penalty`}
                    </div>
                  </div>
                </div>

                {/* 3. RUN THIS REGIME BUTTON (Replaces Inject Atmosphere into 24h BESS Model) */}
                <button
                  onClick={handleRunRegime}
                  className={`w-full py-3.5 px-4 rounded-2xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl ${
                    isApplied
                      ? 'bg-emerald-400 text-slate-950 font-black scale-102'
                      : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-emerald-400 hover:from-yellow-300 hover:to-emerald-300 text-slate-950 hover:scale-102'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[3]" />
                      <span>Regime Run Applied!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current text-slate-950" />
                      <span>Run this regime</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            SECTION 3: METEOROLOGICAL STRESS AUDIT MATRIX
            ============================================================ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-yellow-400 font-bold">
                CERC Compliance Engine
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-white mt-1">
                Active Regime Physical Stress Parameters
              </h3>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Active Simulation Target: <strong className="text-emerald-400">{activeRegimeMeta.headline}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-yellow-400 uppercase font-semibold">Average Curtailment</div>
              <div className="text-lg font-bold text-white mt-1">
                {loading || !scenarioData ? '—' : `${scenarioData.summary.avg_curtailment} MWh`}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Without storage intervention</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-emerald-400 uppercase font-semibold">SunBank In-Band</div>
              <div className="text-lg font-bold text-white mt-1">
                {loading || !scenarioData ? '—' : `${scenarioData.summary.in_band_pct}%`}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Within ±5% regulatory window</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-cyan-400 uppercase font-semibold">Regime nMAE Error</div>
              <div className="text-lg font-bold text-white mt-1">
                {loading || !scenarioData ? '—' : `${scenarioData.summary.nmae}%`}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Calibrated forecast accuracy</div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-yellow-300 uppercase font-semibold">Selected Day GHI</div>
              <div className="text-lg font-bold text-white mt-1">
                {loading || !selectedDay ? '—' : `${selectedDay.ghi_peak} W/m²`}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{selectedDay?.date ?? '—'} Peak</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
