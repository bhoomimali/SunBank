import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Database, Layers, AlertCircle, FileText } from 'lucide-react';
import { api, ConfigResponse } from '../api';

interface MethodAssumptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodAssumptionsDrawer: React.FC<MethodAssumptionsDrawerProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<ConfigResponse | null>(null);

  useEffect(() => {
    api.getConfig().then(setConfig).catch(console.error);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer (same card background, border, font) */}
      <aside className="relative z-10 w-full max-w-xl bg-[#0b1120] border-l border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                Method & Assumptions
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Technical foundation, data provenance & modeling boundaries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-xs">
          {/* Section 1: Real vs Simulated (Two-column list) */}
          <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Real vs Simulated Architecture
            </h3>
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div className="space-y-2 border-r border-slate-800 pr-3">
                <div className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider">
                  Real / Empirical Data
                </div>
                <ul className="space-y-1.5 text-slate-300 leading-relaxed list-disc list-inside">
                  <li>INSAT-3DR rapid scan radiance channels</li>
                  <li>ERA5 hourly surface solar reanalysis</li>
                  <li>POSOCO / NLDC 50 Hz grid frequency telemetry</li>
                  <li>CERC & KERC 2026 DSM ±5% regulatory tolerance</li>
                  <li>Bhadla Feeder 04 33kV geometry & line capacity</li>
                </ul>
              </div>
              <div className="space-y-2 pl-1">
                <div className="text-cyan-400 font-bold uppercase text-[10px] tracking-wider">
                  Simulated / Modelled
                </div>
                <ul className="space-y-1.5 text-slate-300 leading-relaxed list-disc list-inside">
                  <li>LFP rack thermal gradients & Arrhenius aging</li>
                  <li>Real-time PCS inverter throttle response</li>
                  <li>Lookahead linear program dispatch trajectory</li>
                  <li>Equivalent avoided thermal coal displacement</li>
                  <li>Counterfactual No-BESS curtailment baseline</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Data Sources with Date Ranges */}
          <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Data Sources & Validation Coverage
            </h3>
            {config?.sources.map((src, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-baseline justify-between py-1 border-b border-slate-800/60 last:border-0 gap-1">
                <span className="text-slate-200">{src.name}</span>
                <span className="text-[10px] text-amber-400 font-semibold">{src.range}</span>
              </div>
            ))}
          </div>

          {/* Section 3: Every Assumption from /api/config */}
          <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Core Physical & Market Assumptions
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-300">
              {config?.assumptions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 4: Metric Definitions */}
          <div className="p-4 rounded-xl bg-[#070c18] border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Key Metric Definitions
            </h3>
            <div className="space-y-2 text-[11px] text-slate-300">
              <div>
                <strong className="text-white">nMAE:</strong> Normalized Mean Absolute Error divided by AC plant rated capacity (50 MW).
              </div>
              <div>
                <strong className="text-white">Pinball Loss:</strong> Asymmetric scoring function penalizing quantile under/over-estimation across P10, P50, and P90.
              </div>
              <div>
                <strong className="text-white">In-Band Blocks %:</strong> Percentage of 15-minute settlement intervals where actual injection is within ±5% of scheduled commitment.
              </div>
              <div>
                <strong className="text-white">C-Rate Limit:</strong> 0.25C maximum charge/discharge rate (20 MW active power on 80 MWh nameplate storage).
              </div>
            </div>
          </div>

          {/* Section 5: What We Do Not Claim */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-300/90 space-y-2 text-[11px]">
            <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              What We Do Not Claim
            </h3>
            <ul className="space-y-1.5 list-disc list-inside leading-relaxed text-slate-300">
              <li>We do not claim 100% forecast certainty; weather chaos necessitates probabilistic risk bounds.</li>
              <li>Reference irradiance values are calibrated ERA5 reanalysis and satellite flux, not local pyranometer sensors.</li>
              <li>Financial gains depend on regulatory tariff structures and utility PPA agreements.</li>
            </ul>
          </div>
        </div>

        {/* Footer Data Mode Indicator */}
        <div className="p-4 border-t border-slate-800 bg-[#070c18] flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">System Mode Status:</span>
          <span className={`px-2.5 py-1 rounded font-bold text-[11px] ${
            config?.data_mode === 'LIVE'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            Data source: {config?.data_mode === 'LIVE' ? 'LIVE API' : 'MOCK'}
          </span>
        </div>
      </aside>
    </div>
  );
};
