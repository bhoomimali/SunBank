import React from 'react';
import { PageId } from '../types';

interface FooterProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenMethodDrawer?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenMethodDrawer }) => {
  return (
    <footer className="w-full py-10 px-4 sm:px-6 lg:px-8 border-t bg-white border-slate-200 text-slate-500 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span className="font-extrabold tracking-wider font-['Space_Grotesk',sans-serif] text-slate-900 flex items-center">
            <span>SUN</span><span className="text-amber-500 font-extrabold">BANK</span>
          </span>
          <span className="hidden sm:inline text-slate-300" aria-hidden="true">·</span>
          <span>CodeNoir 2026</span>
          <span className="hidden sm:inline text-slate-300" aria-hidden="true">·</span>
          <span>Bhadla Solar Park · CERC & KERC ±5% DSM Compliant</span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('hero')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('impact')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Impact
          </button>
          <button
            onClick={() => onNavigate('control')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Control Room
          </button>
          <button
            onClick={() => onNavigate('forecasting')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Probabilistic AI
          </button>
          <button
            onClick={() => onNavigate('digital-twin')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            BESS Twin
          </button>
          <button
            onClick={() => onNavigate('sandbox')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Climate Sandbox
          </button>
          {onOpenMethodDrawer && (
            <button
              onClick={onOpenMethodDrawer}
              className="hover:text-blue-600 transition-colors cursor-pointer text-slate-700 font-medium underline underline-offset-2"
            >
              Method & Assumptions
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
