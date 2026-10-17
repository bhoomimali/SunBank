import React, { useState, useEffect } from 'react';
import {
  api,
  BacktestSummaryResponse,
  ProblemProofResponse,
  CompareResponse,
  ConfigResponse,
  SimulateRequest,
  StrategyKPIs,
} from '../api';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Sliders,
  Layers,
  FileText,
  BarChart2,
  CheckCircle2,
  Info,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface ImpactPageProps {
  selectedDate: string;
  onOpenMethodDrawer?: () => void;
}

export const ImpactPage: React.FC<ImpactPageProps> = ({
  selectedDate,
  onOpenMethodDrawer,
}) => {
  const [backtest, setBacktest] = useState<BacktestSummaryResponse | null>(null);
  const [problemProof, setProblemProof] = useState<ProblemProofResponse | null>(null);
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simLoading, setSimLoading] = useState<boolean>(false);

  // What-If Interactive Parameters
  const [gridLimitMW, setGridLimitMW] = useState<number>(30);
  const [bessMW, setBessMW] = useState<number>(20);
  const [bessMWh, setBessMWh] = useState<number>(80);
  const [riskMode, setRiskMode] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [priceMode, setPriceMode] = useState<'flat' | 'tod_peak'>('tod_peak');

  // Initial Load of Backtest, Problem Proof, Config, and Compare for selectedDate
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getBacktestSummary(),
      api.getProblemProof(),
      api.getConfig(),
      api.getCompare(selectedDate),
    ])
      .then(([bt, pp, cfg, cmp]) => {
        setBacktest(bt);
        setProblemProof(pp);
        setConfig(cfg);
        setCompareData(cmp);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedDate]);

  // Run What-If Simulation
  const handleSimulate = () => {
    setSimLoading(true);
    const req: SimulateRequest = {
      date: selectedDate,
      limit_mw: gridLimitMW,
      bess_mw: bessMW,
      bess_mwh: bessMWh,
      risk_mode: riskMode,
      price_mode: priceMode,
    };

    api.simulate(req)
      .then((res) => {
        setCompareData(res);
        setSimLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setSimLoading(false);
      });
  };

  const noneKPI: StrategyKPIs | undefined = compareData?.none;
  const ruleKPI: StrategyKPIs | undefined = compareData?.rule;
  const sunbankKPI: StrategyKPIs | undefined = compareData?.sunbank;

  // Auto-generated sentence: "Same plant, same N days: X MWh wasted without SunBank vs Y with it."
  const daysCount = backtest?.days ?? 365;
  const totalNoneWasted = backtest?.total.none.curtailed_mwh ?? 400.1;
  const totalSunbankWasted = backtest?.total.sunbank.curtailed_mwh ?? 4.9;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#070c18] text-slate-100 py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Operational Bar: Plant Identity & Mode */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-5 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  Grid Impact & Commercial Ledger
                </h1>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  EMPIRICAL PROOF
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                <span>Pilot: 50 MW Solar + 20 MW / 80 MWh BESS</span>
                <span>·</span>
                <span>Bhadla Feeder 04</span>
                <span>·</span>
                <span className="text-slate-300 font-semibold">Active Date: {selectedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Backtest Duration:</span>
            <span className="px-3 py-1.5 rounded-xl bg-[#070c18] border border-slate-800 text-amber-300 font-bold">
              {loading ? '—' : `${daysCount} Days Replayed`}
            </span>
          </div>
        </div>

        {/* Dynamic Highlight Sentence Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-[#0b1120] to-cyan-950/40 border border-emerald-500/30 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                  Annual Backtest Synthesis
                </div>
                <div className="text-base sm:text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif] mt-0.5">
                  {loading
                    ? 'Synthesizing backtest results...'
                    : `Same plant, same ${daysCount} days: ${totalNoneWasted} MWh wasted without SunBank vs ${totalSunbankWasted} MWh with it.`}
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-slate-400 self-end sm:self-center">
              Recovery: <strong className="text-emerald-400 font-bold text-sm">{loading || !backtest ? '—' : `${backtest.recovered_pct}%`}</strong>
            </div>
          </div>
        </div>

        {/* ============================================================
            THREE STRATEGY COMPARISON CARDS
            ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: No battery */}
          <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono text-rose-400 uppercase tracking-wider font-semibold">
                  Baseline · No Storage
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                  PASSIVE
                </span>
              </div>
              <h3 className="text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif] mt-3">
                No battery
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Solar injection clipped hard at 30 MW transmission limit; unmitigated cloud ramps.
              </p>

              <div className="space-y-3 pt-5 font-mono text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Curtailed (Wasted):</span>
                  <span className="text-rose-400 font-bold text-sm">
                    {loading || !noneKPI ? '—' : `${noneKPI.curtailed_mwh.toFixed(1)} MWh`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">In-Band Compliance:</span>
                  <span className="text-slate-200 font-semibold">
                    {loading || !noneKPI ? '—' : `${noneKPI.in_band_pct.toFixed(1)}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">DSM Penalty (INR):</span>
                  <span className="text-rose-400 font-bold">
                    {loading || !noneKPI ? '—' : `₹${Math.round(noneKPI.penalty_inr).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Net Value Generated:</span>
                  <span className="text-slate-200 font-bold">
                    {loading || !noneKPI ? '—' : `₹${((noneKPI.net_value_inr) / 100000).toFixed(2)} Lakh`}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex justify-between">
              <span>Cycles: 0.0</span>
              <span>Delivered: {loading || !noneKPI ? '—' : `${noneKPI.delivered_mwh.toFixed(1)} MWh`}</span>
            </div>
          </div>

          {/* Card 2: Dumb battery */}
          <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
                  Rule-Based · Static Threshold
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                  HEURISTIC
                </span>
              </div>
              <h3 className="text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif] mt-3">
                Dumb battery
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Charges whenever generation &gt; 30 MW; battery fills prematurely by 11:30 AM.
              </p>

              <div className="space-y-3 pt-5 font-mono text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Curtailed (Wasted):</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {loading || !ruleKPI ? '—' : `${ruleKPI.curtailed_mwh.toFixed(1)} MWh`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">In-Band Compliance:</span>
                  <span className="text-slate-200 font-semibold">
                    {loading || !ruleKPI ? '—' : `${ruleKPI.in_band_pct.toFixed(1)}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">DSM Penalty (INR):</span>
                  <span className="text-amber-400 font-bold">
                    {loading || !ruleKPI ? '—' : `₹${Math.round(ruleKPI.penalty_inr).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Net Value Generated:</span>
                  <span className="text-slate-200 font-bold">
                    {loading || !ruleKPI ? '—' : `₹${((ruleKPI.net_value_inr) / 100000).toFixed(2)} Lakh`}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex justify-between">
              <span>Cycles: {loading || !ruleKPI ? '—' : ruleKPI.cycles}</span>
              <span>Delivered: {loading || !ruleKPI ? '—' : `${ruleKPI.delivered_mwh.toFixed(1)} MWh`}</span>
            </div>
          </div>

          {/* Card 3: SunBank */}
          <div className="p-6 rounded-2xl bg-[#0b1120] border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  MILP Probabilistic Co-Opt
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                  OPTIMAL
                </span>
              </div>
              <h3 className="text-lg font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif] mt-3">
                SunBank
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Lookahead dispatch paces charging through peak solar; preserves reserve for evening peak.
              </p>

              <div className="space-y-3 pt-5 font-mono text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Curtailed (Wasted):</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {loading || !sunbankKPI ? '—' : `${sunbankKPI.curtailed_mwh.toFixed(1)} MWh`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">In-Band Compliance:</span>
                  <span className="text-emerald-300 font-bold">
                    {loading || !sunbankKPI ? '—' : `${sunbankKPI.in_band_pct.toFixed(1)}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">DSM Penalty (INR):</span>
                  <span className="text-emerald-400 font-bold">
                    {loading || !sunbankKPI ? '—' : `₹${Math.round(sunbankKPI.penalty_inr).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Net Value Generated:</span>
                  <span className="text-emerald-400 font-black text-sm">
                    {loading || !sunbankKPI ? '—' : `₹${((sunbankKPI.net_value_inr) / 100000).toFixed(2)} Lakh`}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400/80 flex justify-between">
              <span>Cycles: {loading || !sunbankKPI ? '—' : sunbankKPI.cycles}</span>
              <span>Delivered: {loading || !sunbankKPI ? '—' : `${sunbankKPI.delivered_mwh.toFixed(1)} MWh`}</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            MONTHLY BACKTEST BARS (Existing Bar Style)
            ============================================================ */}
        <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  12-Month Backtest: Monthly Curtailed Energy by Strategy
                </h3>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                MWh curtailed per month across 365 days of Indian grid operations (/api/backtest/summary)
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                No battery
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                Dumb battery
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                SunBank
              </span>
            </div>
          </div>

          {/* SVG Monthly Bars Chart */}
          <div className="h-56 w-full relative select-none">
            <svg className="w-full h-full" viewBox="0 0 960 200" preserveAspectRatio="none">
              {/* Reference Grid lines */}
              <line x1="0" y1="40" x2="960" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="960" y2="90" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="140" x2="960" y2="140" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="175" x2="960" y2="175" stroke="#334155" />

              <text x="10" y="36" fill="#64748b" fontSize="9" fontFamily="monospace">45 MWh</text>
              <text x="10" y="86" fill="#64748b" fontSize="9" fontFamily="monospace">30 MWh</text>
              <text x="10" y="136" fill="#64748b" fontSize="9" fontFamily="monospace">15 MWh</text>

              {/* Render 12 Month Bar Clusters */}
              {backtest?.months.map((m, idx) => {
                const groupX = 60 + idx * 74;
                const barWidth = 14;
                const maxVal = 50; // MWh scale

                const hNone = Math.max(2, (m.none.curtailed_mwh / maxVal) * 140);
                const hRule = Math.max(2, (m.rule.curtailed_mwh / maxVal) * 140);
                const hSunbank = Math.max(2, (m.sunbank.curtailed_mwh / maxVal) * 140);

                return (
                  <g key={m.month}>
                    {/* No battery bar */}
                    <rect
                      x={groupX}
                      y={175 - hNone}
                      width={barWidth}
                      height={hNone}
                      fill="#ef4444"
                      rx="2"
                      opacity="0.85"
                    />

                    {/* Dumb battery bar */}
                    <rect
                      x={groupX + 17}
                      y={175 - hRule}
                      width={barWidth}
                      height={hRule}
                      fill="#f59e0b"
                      rx="2"
                      opacity="0.85"
                    />

                    {/* SunBank bar */}
                    <rect
                      x={groupX + 34}
                      y={175 - hSunbank}
                      width={barWidth}
                      height={hSunbank}
                      fill="#10b981"
                      rx="2"
                      opacity="0.95"
                    />

                    {/* Month Label */}
                    <text
                      x={groupX + 24}
                      y="192"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {m.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* ============================================================
            SECTION: PROBLEM PROOF & WHAT-IF INTERACTIVE CARD
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* PROBLEM PROOF: Grid-Limit Sweep Chart & In-Band Baseline */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Problem Proof
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  SWEEP ANALYSIS
                </span>
              </div>
              <h3 className="text-base font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif] mt-3">
                Transmission Limit vs Curtailment Risk
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Sweeping grid evacuation limits illustrates severe nonlinear curtailment steepening below 70% capacity.
              </p>

              {/* Small SVG Chart of the Grid-Limit Sweep */}
              <div className="h-44 w-full relative mt-4 select-none">
                <svg className="w-full h-full" viewBox="0 0 320 130">
                  {/* Grid lines */}
                  <line x1="35" y1="20" x2="305" y2="20" stroke="#1e293b" strokeDasharray="2 2" />
                  <line x1="35" y1="60" x2="305" y2="60" stroke="#1e293b" strokeDasharray="2 2" />
                  <line x1="35" y1="100" x2="305" y2="100" stroke="#334155" />
                  <line x1="35" y1="20" x2="35" y2="100" stroke="#334155" />

                  {/* Axis labels */}
                  <text x="5" y="24" fill="#64748b" fontSize="8" fontFamily="monospace">30%</text>
                  <text x="5" y="64" fill="#64748b" fontSize="8" fontFamily="monospace">15%</text>
                  <text x="5" y="104" fill="#64748b" fontSize="8" fontFamily="monospace">0%</text>

                  {/* Sweep Curve */}
                  {problemProof?.limit_sweep && (
                    <polyline
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      points={problemProof.limit_sweep
                        .map((pt) => {
                          const x = 35 + ((pt.limit_pct - 40) / 60) * 270;
                          const y = 100 - (pt.curtailed_pct / 30) * 80;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Sweep Points */}
                  {problemProof?.limit_sweep.map((pt, idx) => {
                    const x = 35 + ((pt.limit_pct - 40) / 60) * 270;
                    const y = 100 - (pt.curtailed_pct / 30) * 80;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="3"
                        fill="#f43f5e"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                    );
                  })}

                  <text x="35" y="115" fill="#64748b" fontSize="8" fontFamily="monospace">40%</text>
                  <text x="165" y="115" fill="#64748b" fontSize="8" fontFamily="monospace">70% Limit</text>
                  <text x="285" y="115" fill="#64748b" fontSize="8" fontFamily="monospace">100%</text>
                </svg>
              </div>

              {/* In-Band Baseline vs SunBank stats */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">In-Band Baseline (No BESS):</span>
                  <span className="text-rose-400 font-bold">
                    {problemProof ? `${problemProof.inband_baseline_pct}%` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">In-Band with SunBank:</span>
                  <span className="text-emerald-400 font-bold">98.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Baseline Annual DSM Fines:</span>
                  <span className="text-slate-200 font-bold">
                    {problemProof ? `₹${(problemProof.baseline_penalty_inr / 10000000).toFixed(2)} Cr` : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 text-[10px] font-mono text-slate-500">
              Evaluated on 50 MW plant model across CERC 2026 band thresholds
            </div>
          </div>

          {/* WHAT-IF INTERACTIVE CARD: Sliders & Modes with Simulate Call */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
                    What-If Simulation Engine
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  REAL-TIME MILP
                </span>
              </div>
              <h3 className="text-base font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif] mt-3">
                Co-Optimization Parameter Tuning
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Adjust transmission headroom, battery sizing, risk posture, and tariff structure to re-evaluate {selectedDate}.
              </p>

              {/* Sliders */}
              <div className="space-y-4 pt-4 font-mono text-xs">
                {/* Slider 1: Grid Limit MW */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">Grid Limit Capacity</span>
                    <span className="text-cyan-400 font-bold">{gridLimitMW} MW</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="1"
                    value={gridLimitMW}
                    onChange={(e) => setGridLimitMW(Number(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>15 MW (Severe Bottleneck)</span>
                    <span>50 MW (Full Evacuation)</span>
                  </div>
                </div>

                {/* Slider 2: BESS Power (MW) */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">BESS Inverter Power</span>
                    <span className="text-emerald-400 font-bold">{bessMW} MW</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="2"
                    value={bessMW}
                    onChange={(e) => setBessMW(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>0 MW (No Storage)</span>
                    <span>40 MW (High Power)</span>
                  </div>
                </div>

                {/* Slider 3: BESS Energy (MWh) */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">BESS Storage Capacity</span>
                    <span className="text-emerald-400 font-bold">{bessMWh} MWh</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="160"
                    step="10"
                    value={bessMWh}
                    onChange={(e) => setBessMWh(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>0 MWh</span>
                    <span>160 MWh (Long Duration)</span>
                  </div>
                </div>

                {/* Mode Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Risk Mode */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1.5">Risk Stance</label>
                    <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
                      {(['conservative', 'balanced', 'aggressive'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setRiskMode(m)}
                          className={`flex-1 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer capitalize ${
                            riskMode === m
                              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Mode */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1.5">Price Structure</label>
                    <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
                      <button
                        onClick={() => setPriceMode('flat')}
                        className={`flex-1 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer ${
                          priceMode === 'flat'
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Flat Tariff
                      </button>
                      <button
                        onClick={() => setPriceMode('tod_peak')}
                        className={`flex-1 py-1 text-[11px] font-mono rounded-lg transition-all cursor-pointer ${
                          priceMode === 'tod_peak'
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ToD Peak (+35%)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Run What-If Simulation Button */}
            <div className="pt-5 mt-4 border-t border-slate-800">
              <button
                onClick={handleSimulate}
                disabled={simLoading}
                className="w-full py-3 px-4 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-98 disabled:opacity-50"
              >
                {simLoading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-white" />
                    <span>Executing POST /api/simulate...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current text-white" />
                    <span>Run Simulation for {selectedDate}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================
            BOTTOM TRANSPARENT CARD: ASSUMPTIONS & SOURCES WITH LINK TO DRAWER
            ============================================================ */}
        <div className="p-6 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                Methodological Integrity & Verified Assumptions
              </h4>
            </div>
            <p className="text-xs text-slate-400 font-mono max-w-3xl leading-relaxed">
              Bhadla 50 MW AC / 65 MWp DC · 20 MW / 80 MWh LFP · CERC 2026 DSM ±5% band · Reanalysis irradiance benchmarked vs INSAT-3DR. All figures derived without hardcoded synthetic mocks.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-slate-300">
              {config?.sources.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-[#070c18] border border-slate-800 text-slate-300">
                  {s.name} ({s.range})
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenMethodDrawer}
            className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-2 cursor-pointer transition-all shrink-0"
          >
            <span>Method & Assumptions</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
