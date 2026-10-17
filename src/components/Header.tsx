import React, { useState } from 'react';
import { PageId } from '../types';
import { AVAILABLE_DATES } from '../api';
import {
  Play,
  Pause,
  Sun,
  Activity,
  Zap,
  Gauge,
  CloudRain,
  RotateCcw,
  Menu,
  X,
  Radio,
  Sliders,
  ChevronRight,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface HeaderProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentBlock: number;
  onResetBlock: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  isPlaying,
  onTogglePlay,
  currentBlock,
  onResetBlock,
  selectedDate,
  onSelectDate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PageId; label: string; sub: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'hero', label: 'Overview', sub: 'Hub & Architecture', icon: <Sun className="w-4 h-4" /> },
    { id: 'impact', label: 'Impact', sub: 'Curtailment & Value', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'control', label: 'Control Room', sub: '33kV SCADA Console', icon: <Gauge className="w-4 h-4" />, badge: 'REPLAY' },
    { id: 'forecasting', label: 'Probabilistic AI', sub: 'P10/P50/P90 & Duck', icon: <Activity className="w-4 h-4" /> },
    { id: 'digital-twin', label: 'BESS Digital Twin', sub: '80 MWh LFP Matrix', icon: <Zap className="w-4 h-4" />, badge: 'TWIN' },
    { id: 'sandbox', label: 'Climate Sandbox', sub: 'Stress Simulator', icon: <CloudRain className="w-4 h-4" /> },
  ];

  const currentHour = Math.floor(((currentBlock - 1) * 15) / 60);
  const currentMinute = ((currentBlock - 1) * 15) % 60;
  const timeFormatted = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  const handleNavClick = (id: PageId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* ============================================================
          VERTICAL GLASS NAVIGATION DOCK (Desktop & Tablet)
          Fixed on left side with ultra-clean frosted glass aesthetics
          ============================================================ */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-20 lg:w-64 glass-sidebar flex-col justify-between py-5 px-2.5 lg:px-4 select-none">
        {/* Vertical Accent Sheen Line on the Right Border */}
        <div className="absolute right-0 top-0 bottom-0 w-[2px] sidebar-sheen-vertical pointer-events-none" />

        {/* 1. TOP ZONE: Brand Mark & Grid Status */}
        <div className="space-y-4">
          <button
            onClick={() => handleNavClick('hero')}
            className="w-full flex items-center justify-center lg:justify-start text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-2xl p-2 transition-all hover:bg-white/5"
          >
            {/* Desktop Full Brand Text */}
            <div className="hidden lg:flex flex-col">
              <div className="font-extrabold text-xl tracking-wider uppercase font-['Space_Grotesk',sans-serif] leading-none flex items-center">
                <span className="text-white drop-shadow-sm">SUN</span>
                <span className="text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                  BANK
                </span>
              </div>
              <span className="text-[10px] font-mono tracking-wider text-slate-300 uppercase font-medium mt-1">
                Bhadla 2,245 MW Grid
              </span>
            </div>

            {/* Collapsed Icon-Dock view for medium screens */}
            <div className="lg:hidden flex items-center justify-center font-extrabold text-sm font-['Space_Grotesk',sans-serif] tracking-wider text-amber-400">
              SB
            </div>
          </button>

          {/* Grid Sync Status Pill (Expanded on LG) - BACKTEST MODE + selected date */}
          <div className="hidden lg:flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-300 font-semibold tracking-wide uppercase text-[10px]">BACKTEST MODE</span>
            </div>
            <span className="text-emerald-400 font-bold tabular-nums">{selectedDate}</span>
          </div>
        </div>

        {/* 2. MIDDLE ZONE: Vertical Navigation List with Glassy Active States */}
        <nav className="my-auto py-3 space-y-1 w-full">
          <div className="hidden lg:block px-3 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            System Modules
          </div>
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full relative px-2.5 lg:px-3 py-2 rounded-xl cursor-pointer text-xs font-mono flex items-center justify-center lg:justify-between transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/20 text-white font-bold shadow-md border border-white/30 backdrop-blur-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
                title={item.label}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="leading-tight">{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal tracking-tight">{item.sub}</span>
                  </div>
                </div>

                {/* Right Active Indicator / Badge */}
                <div className="hidden lg:flex items-center gap-1.5">
                  {item.badge && !isActive && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-slate-300 border border-white/15">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400 animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* 3. BOTTOM ZONE: 15-Minute Settlement Block Telemetry, Compact Date Selector & Playback */}
        <div className="space-y-2.5 pt-2 border-t border-white/10">
          {/* Telemetry Capsule (Expanded on LG) */}
          <div className="hidden lg:block p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-xs font-mono shadow-inner space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] uppercase font-semibold">Settlement Cadence</span>
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>15-Min</span>
              </span>
            </div>

            {/* Compact date selector inside bottom settlement card (styled like speed buttons) */}
            <div className="pt-1 border-t border-white/10">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>REPLAY DATE</span>
                <span className="text-amber-300 font-semibold">{selectedDate}</span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {AVAILABLE_DATES.map((dt) => {
                  const isCur = selectedDate === dt;
                  const label = dt.slice(5); // e.g. "03-15"
                  return (
                    <button
                      key={dt}
                      onClick={() => onSelectDate(dt)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer transition-all ${
                        isCur
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                          : 'bg-white/10 hover:bg-white/20 text-slate-300'
                      }`}
                      title={dt}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between text-white pt-1 border-t border-white/10">
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] text-slate-400">BLK</span>
                <span className="text-sm font-bold text-amber-300">{currentBlock}</span>
                <span className="text-slate-500 text-[10px]">/96</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white tabular-nums">{timeFormatted}</div>
                <div className="text-[9px] text-slate-400">IST SCHEDULE</div>
              </div>
            </div>
          </div>

          {/* Compact Telemetry Indicator for Tablet (MD without LG) */}
          <div className="lg:hidden flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-mono text-center">
            <span className="text-amber-300 font-bold">#{currentBlock}</span>
            <span className="text-slate-300">{timeFormatted}</span>
          </div>

          {/* Action Buttons: Play/Simulate & Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 text-xs font-mono font-bold rounded-xl cursor-pointer shadow-md backdrop-blur-md border border-white/20 transition-all duration-200 ${
                isPlaying
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-amber-400/20'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
              }`}
              title={isPlaying ? 'Pause replay' : 'Replay 15-min settlement'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden lg:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span className="hidden lg:inline">Replay</span>
                </>
              )}
            </button>

            <button
              onClick={onResetBlock}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Reset simulation to 12:15 PM peak block"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================
          MOBILE TOP GLASS TOUCH BAR
          ============================================================ */}
      <header className="md:hidden sticky top-0 z-50 w-full glass-touchbar">
        <div className="h-[2px] w-full touchbar-sheen-active" />
        <div className="px-3.5 py-2.5 flex items-center justify-between">
          <button
            onClick={() => handleNavClick('hero')}
            className="flex items-center text-left"
          >
            <div className="font-extrabold text-base uppercase font-['Space_Grotesk',sans-serif] tracking-wider flex items-center">
              <span className="text-white">SUN</span>
              <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                BANK
              </span>
            </div>
          </button>

          {/* Quick Block Telemetry Pill & Simulation Controls */}
          <div className="flex items-center gap-1.5">
            <div className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono flex items-center gap-1.5">
              <span className="text-amber-300 font-bold">#{currentBlock}</span>
              <span className="text-slate-400">·</span>
              <span className="text-white font-medium">{timeFormatted}</span>
            </div>

            <button
              onClick={onTogglePlay}
              className={`p-1.5 rounded-lg text-slate-950 font-bold transition-all cursor-pointer ${
                isPlaying ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              title={isPlaying ? 'Pause replay' : 'Replay 24h blocks'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-white/10 border border-white/20 text-white transition-all cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Fullscreen Glass Vertical Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-[49px] bottom-0 z-50 glass-sidebar flex flex-col justify-between p-5 overflow-y-auto animate-in fade-in duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
                <span>System Modules</span>
                <span className="text-emerald-400 font-bold">BACKTEST · {selectedDate}</span>
              </div>
              <div className="space-y-2">
                {navItems.map((item) => {
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-left font-mono text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white/20 text-white font-bold border border-white/30 backdrop-blur-md shadow-md'
                          : 'text-slate-300 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-white/10 text-cyan-300">
                          {item.icon}
                        </span>
                        <div>
                          <div className="font-semibold text-sm">{item.label}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{item.sub}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  );
                })}
              </div>

              {/* Mobile Date Selector */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono">
                <div className="text-[10px] text-slate-400 mb-2 uppercase">Select Replay Date</div>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_DATES.map((dt) => (
                    <button
                      key={dt}
                      onClick={() => onSelectDate(dt)}
                      className={`px-2 py-1 rounded text-xs font-mono ${
                        selectedDate === dt ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {dt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Drawer Telemetry Footer */}
            <div className="pt-5 border-t border-white/10 space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between font-mono text-xs">
                <div>
                  <div className="text-slate-400 text-[10px]">CERC SETTLEMENT BLOCK</div>
                  <div className="text-sm font-bold text-amber-300">{currentBlock} of 96 Blocks</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[10px]">INDIAN STANDARD TIME</div>
                  <div className="text-sm font-bold text-white">{timeFormatted} IST</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onTogglePlay();
                    setMobileMenuOpen(false);
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold text-slate-950 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    isPlaying ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlaying ? 'Pause Replay' : 'Start Replay'}</span>
                </button>
                <button
                  onClick={() => {
                    onResetBlock();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white cursor-pointer"
                  title="Reset to 12:15 PM peak block"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================
          MOBILE BOTTOM FLOATING GLASS DOCK (Mobile UI Bar)
          ============================================================ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-touchbar border-t border-white/15 px-2 py-1.5 flex items-center justify-around select-none">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const shortName =
            item.id === 'hero'
              ? 'Overview'
              : item.id === 'impact'
              ? 'Impact'
              : item.id === 'control'
              ? 'Control'
              : item.id === 'forecasting'
              ? 'Forecast'
              : item.id === 'digital-twin'
              ? 'Twin'
              : 'Sandbox';

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-white font-bold bg-white/15 border border-white/25 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="relative">
                <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                {isActive && (
                  <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
              <span className="text-[9px] font-mono tracking-tight mt-0.5 leading-none">
                {shortName}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
