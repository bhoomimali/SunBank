import React, { useState, useEffect, useRef } from 'react';
import { TimeBlockData } from '../types';
import { api, ForecastResponse } from '../api';
import {
  Database,
  Eye,
  Cpu,
  Clock,
  TrendingUp,
  Zap,
  Sparkles,
  Layers,
  ArrowUpRight,
  BatteryCharging,
  Sliders,
  CheckCircle2,
  Info,
  Activity
} from 'lucide-react';

interface ProbabilisticPageProps {
  full24hrData: TimeBlockData[];
  currentBlock: number;
  selectedDate?: string;
}

// Generate smooth cubic bezier SVG path from a set of points (x, y)
function getSmoothCurvePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bezier conversion
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

export const ProbabilisticPage: React.FC<ProbabilisticPageProps> = ({ full24hrData, currentBlock, selectedDate = '2024-03-15' }) => {
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(48); // default to noon block (12:00 IST)
  const [duckHoverIndex, setDuckHoverIndex] = useState<number>(74); // default to 18:30 IST evening peak
  const [duckTimeZoom, setDuckTimeZoom] = useState<'24h' | '12h' | '6h' | '2h'>('24h');
  const [duckViewMode, setDuckViewMode] = useState<'combined' | 'duck-only' | 'dispatch-only'>('combined');
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    api.getForecast(selectedDate)
      .then((data) => {
        setForecastData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedDate]);
  const [chartMode, setChartMode] = useState<'bars-and-quantiles' | 'quantiles-only' | 'bars-only'>('bars-and-quantiles');

  const [visibleSeries, setVisibleSeries] = useState<{
    actualBars: boolean;
    target: boolean;
    p10: boolean;
    p50: boolean;
    p90: boolean;
    envelope: boolean;
  }>({
    actualBars: true,
    target: true,
    p10: true,
    p50: true,
    p90: true,
    envelope: true,
  });

  const chartSvgRef = useRef<SVGSVGElement | null>(null);
  const duckSvgRef = useRef<SVGSVGElement | null>(null);

  const activePoint = full24hrData[activeBlockIndex] || full24hrData[48];

  // Mouse & Touch move handlers for Unified Power Generation & Quantile Chart
  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clientX / rect.width));
    const block = Math.round(fraction * (full24hrData.length - 1));
    setActiveBlockIndex(block);
  };

  const handleChartTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current || !e.touches[0]) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const clientX = e.touches[0].clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clientX / rect.width));
    const block = Math.round(fraction * (full24hrData.length - 1));
    setActiveBlockIndex(block);
  };

  // Duck curve data slice based on selected zoom
  const getDuckSlice = () => {
    switch (duckTimeZoom) {
      case '2h': // Critical Evening Neck Ramp (18:00 to 20:00, blocks 72 to 80)
        return {
          slice: full24hrData.slice(72, 81),
          title: '2-Hour Critical Evening Ramp Window (18:00 – 20:15 IST)',
          description: 'High-frequency 15-minute resolution showing the steep net load ramp (+42 GW)',
        };
      case '6h': // Solar Belly & Pre-Sunset (11:00 to 17:00, blocks 44 to 68)
        return {
          slice: full24hrData.slice(44, 69),
          title: '6-Hour Midday Belly & Transition Window (11:00 – 17:15 IST)',
          description: 'Tracks deepest solar belly dip and transitional pre-sunset battery charging',
        };
      case '12h': // Daylight Operations (08:00 to 20:00, blocks 32 to 80)
        return {
          slice: full24hrData.slice(32, 81),
          title: '12-Hour Daylight & Evening Peak (08:00 – 20:15 IST)',
          description: 'Complete daytime solar injection and subsequent evening peak dispatch',
        };
      case '24h':
      default:
        return {
          slice: full24hrData,
          title: '24-Hour Diurnal Overview (00:00 – 24:00 IST)',
          description: 'Full 96-block diurnal cycle showing gross load vs solar-depressed net demand & BESS dispatch',
        };
    }
  };

  const { slice: duckSlice, title: duckZoomTitle, description: duckZoomDesc } = getDuckSlice();
  const duckActivePoint = duckSlice[duckHoverIndex] || duckSlice[Math.floor(duckSlice.length / 2)] || full24hrData[74];

  // Mouse & Touch move handlers for Duck Curve
  const handleDuckMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!duckSvgRef.current) return;
    const rect = duckSvgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clientX / rect.width));
    const index = Math.round(fraction * (duckSlice.length - 1));
    setDuckHoverIndex(index);
  };

  const handleDuckTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!duckSvgRef.current || !e.touches[0]) return;
    const rect = duckSvgRef.current.getBoundingClientRect();
    const clientX = e.touches[0].clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clientX / rect.width));
    const index = Math.round(fraction * (duckSlice.length - 1));
    setDuckHoverIndex(index);
  };

  // Calculations for active point from API blocks when available
  const fcstBlock = forecastData?.blocks[activeBlockIndex];
  const actualGen = fcstBlock?.actual ?? activePoint.solarGenMW;
  const targetGen = fcstBlock?.clearsky ?? activePoint.targetMW;
  const p50Gen = fcstBlock?.p50 ?? activePoint.p50MW;
  const p10Gen = fcstBlock?.p10 ?? activePoint.p10MW;
  const p90Gen = fcstBlock?.p90 ?? activePoint.p90MW;
  const devMW = (actualGen - targetGen).toFixed(2);
  const devPercent = targetGen > 0 ? (((actualGen - targetGen) / targetGen) * 100).toFixed(1) : '0.0';
  const isWithinBand = Math.abs(parseFloat(devPercent)) <= 5.0;

  // Prepare points for smooth Catmull-Rom bezier curves in Duck Curve SVG
  // Y range: 100 GW to 260 GW (span 160 GW), height 220px, baseline at y=210
  const grossPoints = duckSlice.map((d, i) => {
    const x = (i / (duckSlice.length - 1)) * 960;
    const y = 210 - ((d.grossDemandGW - 100) / 160) * 180;
    return { x, y };
  });

  const netPoints = duckSlice.map((d, i) => {
    const x = (i / (duckSlice.length - 1)) * 960;
    const y = 210 - ((d.netDemandGW - 100) / 160) * 180;
    return { x, y };
  });

  const smoothGrossPath = getSmoothCurvePath(grossPoints);
  const smoothNetPath = getSmoothCurvePath(netPoints);

  // Closed polygon for shaded duck belly between gross and net demand
  const bellyAreaPath =
    smoothGrossPath +
    ` L ${grossPoints[grossPoints.length - 1].x} ${netPoints[netPoints.length - 1].y} ` +
    duckSlice
      .slice()
      .reverse()
      .map((d, i) => {
        const revIdx = duckSlice.length - 1 - i;
        const x = (revIdx / (duckSlice.length - 1)) * 960;
        const y = 210 - ((d.netDemandGW - 100) / 160) * 180;
        return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ') +
    ' Z';

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Lab Header - Green, Blue, Yellow, White Palette with Glassy Accents */}
        <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-600 font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scientific Instrument Console · Bhadla Array 50 MW</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
              Probabilistic Solar Generation & Duck Curve Engine
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Multi-horizon quantile regression (P10/P50/P90) curves overlaid with actual 15-minute power generation bar graphs, calibrated to eliminate CERC DSM penalties.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-200 font-medium">
              Quantile Model: <strong className="text-blue-900">P10 / P50 / P90</strong>
            </span>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 font-medium">
              Confidence Band: <strong className="text-emerald-900">{loading || !forecastData ? '—' : `${forecastData.metrics.coverage}%`}</strong>
            </span>
          </div>
        </div>

        {/* ============================================================
            CHART 1: POWER GENERATION BAR GRAPH WITH P10 / P50 / P90 CURVES
            ============================================================ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-slate-950 font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  Solar Power Generation & Quantile Prediction (P10 / P50 / P90)
                </h2>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  15-Min Bar Cadence
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Actual Generation depicted as 15-min bars · P10 (yellow-amber), P50 median (blue), and P90 (green) quantile curves
              </p>
            </div>

            {/* Display Mode Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono">
              <button
                onClick={() => setChartMode('bars-and-quantiles')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'bars-and-quantiles'
                    ? 'bg-white text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Bars + Quantiles
              </button>
              <button
                onClick={() => setChartMode('quantiles-only')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'quantiles-only'
                    ? 'bg-white text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Quantiles Only
              </button>
              <button
                onClick={() => setChartMode('bars-only')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'bars-only'
                    ? 'bg-white text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Bars Only
              </button>
            </div>
          </div>

          {/* Interactive Legends with Toggle Capability */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-600 pt-1">
            <span className="text-slate-400">Click legend elements to toggle visibility:</span>
            <div className="flex flex-wrap items-center gap-4">
              {/* Actual Bars (Amber/Yellow) */}
              <button
                onClick={() =>
                  setVisibleSeries((prev) => ({ ...prev, actualBars: !prev.actualBars }))
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  visibleSeries.actualBars
                    ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                    : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                }`}
              >
                <span className="w-2.5 h-3 bg-amber-500 rounded-xs" />
                <span>Actual Power Generation (15-Min Bar)</span>
              </button>

              {/* P50 Median (Blue) */}
              <button
                onClick={() => setVisibleSeries((prev) => ({ ...prev, p50: !prev.p50 }))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  visibleSeries.p50
                    ? 'bg-blue-50 text-blue-900 border-blue-300 font-semibold'
                    : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                }`}
              >
                <span className="w-3.5 h-1 bg-blue-600 rounded-xs" />
                <span>P50 Median Forecast (MW)</span>
              </button>

              {/* P90 Upper (Green) */}
              <button
                onClick={() => setVisibleSeries((prev) => ({ ...prev, p90: !prev.p90 }))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  visibleSeries.p90
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
                    : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                }`}
              >
                <span className="w-3.5 h-1 border-b-2 border-dashed border-emerald-600" />
                <span>P90 Upper Risk (MW)</span>
              </button>

              {/* P10 Lower (Yellow) */}
              <button
                onClick={() => setVisibleSeries((prev) => ({ ...prev, p10: !prev.p10 }))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  visibleSeries.p10
                    ? 'bg-yellow-50 text-yellow-900 border-yellow-300 font-semibold'
                    : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                }`}
              >
                <span className="w-3.5 h-1 border-b-2 border-dashed border-yellow-500" />
                <span>P10 Lower Floor (MW)</span>
              </button>
            </div>
          </div>

          {/* SVG STAGE 1: POWER GENERATION BAR GRAPH & QUANTILE ENVELOPE */}
          <div className="space-y-2">
            <div className="h-80 w-full relative">
              <svg
                ref={chartSvgRef}
                onMouseMove={handleChartMouseMove}
                className="w-full h-full cursor-crosshair select-none"
                viewBox="0 0 960 250"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Shaded Quantile Prediction Envelope Gradient */}
                  <linearGradient id="quantileEnvelopeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.10" />
                  </linearGradient>

                  {/* Power Generation Bar Gradient */}
                  <linearGradient id="actualBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.45" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Gridlines & Reference Markers */}
                <line x1="0" y1="20" x2="960" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="70" x2="960" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="120" x2="960" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="170" x2="960" y2="170" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="220" x2="960" y2="220" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Y-Axis MW Labels */}
                <text x="6" y="24" fill="#64748b" fontSize="9" fontFamily="monospace">50 MW (Max AC)</text>
                <text x="6" y="74" fill="#64748b" fontSize="9" fontFamily="monospace">37.5 MW</text>
                <text x="6" y="124" fill="#64748b" fontSize="9" fontFamily="monospace">25 MW</text>
                <text x="6" y="174" fill="#64748b" fontSize="9" fontFamily="monospace">12.5 MW</text>
                <text x="6" y="218" fill="#64748b" fontSize="9" fontFamily="monospace">0 MW</text>

                {/* 1. ACTUAL GENERATION 15-MINUTE BAR GRAPH */}
                {(chartMode === 'bars-and-quantiles' || chartMode === 'bars-only') &&
                  visibleSeries.actualBars && (
                    <g>
                      {full24hrData.map((d, i) => {
                        if (d.solarGenMW <= 0) return null;
                        const x = (i / 95) * 960;
                        const barWidth = 7;
                        const barHeight = (d.solarGenMW / 52) * 200;
                        const y = 220 - barHeight;
                        const isHovered = i === activeBlockIndex;

                        return (
                          <rect
                            key={i}
                            x={x - barWidth / 2}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill={isHovered ? '#d97706' : 'url(#actualBarGrad)'}
                            rx="2"
                            stroke={isHovered ? '#b45309' : '#f59e0b'}
                            strokeWidth={isHovered ? '1.5' : '0.5'}
                            opacity={isHovered ? 1 : 0.85}
                          />
                        );
                      })}
                    </g>
                  )}

                {/* 2. P10 to P90 Quantile Uncertainty Envelope */}
                {(chartMode === 'bars-and-quantiles' || chartMode === 'quantiles-only') &&
                  visibleSeries.envelope && (
                    <path
                      d={`M 0 220 ${full24hrData
                        .map((d, i) => {
                          const x = (i / 95) * 960;
                          const yP90 = 220 - (d.p90MW / 52) * 200;
                          return `L ${x.toFixed(1)} ${yP90.toFixed(1)}`;
                        })
                        .join(' ')} ${full24hrData
                        .slice()
                        .reverse()
                        .map((d, i) => {
                          const revIndex = 95 - i;
                          const x = (revIndex / 95) * 960;
                          const yP10 = 220 - (d.p10MW / 52) * 200;
                          return `L ${x.toFixed(1)} ${yP10.toFixed(1)}`;
                        })
                        .join(' ')} Z`}
                      fill="url(#quantileEnvelopeGrad)"
                    />
                  )}

                {/* 3. P90 Upper Bound Curve (Dashed Green) */}
                {(chartMode === 'bars-and-quantiles' || chartMode === 'quantiles-only') &&
                  visibleSeries.p90 && (
                    <path
                      d={`M 0 220 ${full24hrData
                        .map((d, i) => {
                          const x = (i / 95) * 960;
                          const y = 220 - (d.p90MW / 52) * 200;
                          return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                        })
                        .join(' ')}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                  )}

                {/* 4. P10 Lower Bound Curve (Dashed Yellow) */}
                {(chartMode === 'bars-and-quantiles' || chartMode === 'quantiles-only') &&
                  visibleSeries.p10 && (
                    <path
                      d={`M 0 220 ${full24hrData
                        .map((d, i) => {
                          const x = (i / 95) * 960;
                          const y = 220 - (d.p10MW / 52) * 200;
                          return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                        })
                        .join(' ')}`}
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                    />
                  )}

                {/* 5. P50 Expected Median Curve (Solid Blue Line) */}
                {(chartMode === 'bars-and-quantiles' || chartMode === 'quantiles-only') &&
                  visibleSeries.p50 && (
                    <path
                      d={`M 0 220 ${full24hrData
                        .map((d, i) => {
                          const x = (i / 95) * 960;
                          const y = 220 - (d.p50MW / 52) * 200;
                          return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                        })
                        .join(' ')}`}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3"
                    />
                  )}

                {/* ACTIVE SCRUBBER TRACKING LINE & BEACONS */}
                {(() => {
                  const xPos = (activeBlockIndex / 95) * 960;
                  const yP50 = 220 - (activePoint.p50MW / 52) * 200;
                  const yP10 = 220 - (activePoint.p10MW / 52) * 200;
                  const yP90 = 220 - (activePoint.p90MW / 52) * 200;
                  const yActual = 220 - (activePoint.solarGenMW / 52) * 200;

                  return (
                    <g className="pointer-events-none">
                      {/* Vertical Scrubber Cursor Line */}
                      <line
                        x1={xPos}
                        y1="10"
                        x2={xPos}
                        y2="225"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity="0.8"
                      />

                      {/* Scrubber Time Capsule on bottom axis */}
                      <rect
                        x={xPos - 32}
                        y="228"
                        width="64"
                        height="20"
                        rx="4"
                        fill="#0f172a"
                      />
                      <text
                        x={xPos}
                        y="242"
                        fill="#ffffff"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {activePoint.time}
                      </text>

                      {/* Point Beacon on P50 Median (Blue) */}
                      {visibleSeries.p50 && (
                        <circle
                          cx={xPos}
                          cy={yP50}
                          r="4.5"
                          fill="#2563eb"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      )}

                      {/* Point Beacon on P90 Upper (Green) */}
                      {visibleSeries.p90 && (
                        <circle
                          cx={xPos}
                          cy={yP90}
                          r="3.5"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Point Beacon on P10 Lower (Yellow) */}
                      {visibleSeries.p10 && (
                        <circle
                          cx={xPos}
                          cy={yP10}
                          r="3.5"
                          fill="#eab308"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Bar top marker for Actual Gen */}
                      {visibleSeries.actualBars && activePoint.solarGenMW > 0 && (
                        <circle
                          cx={xPos}
                          cy={yActual}
                          r="4"
                          fill="#f59e0b"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      )}
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* Time Axis Labels */}
            <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-200">
              <span>00:00</span>
              <span>03:00</span>
              <span>06:00</span>
              <span>09:00</span>
              <span className="font-bold text-blue-700">12:00 (Solar Peak)</span>
              <span>15:00</span>
              <span className="font-bold text-yellow-700">18:00 (Sunset)</span>
              <span>21:00</span>
              <span>24:00</span>
            </div>

            {/* Note under the chart */}
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              Reference data is reanalysis, not sensor readings.
            </div>
          </div>

          {/* DYNAMIC SCRUBBED TELEMETRY HUD CARD - GREEN / BLUE / YELLOW / WHITE */}
          <div className="p-5 rounded-2xl bg-slate-950 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 border border-slate-800">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono text-white">
                    {activePoint.time} IST
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    Block {activePoint.block} / 96
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Clear-Sky Irradiance: <strong className="text-yellow-300">{activePoint.ghi} W/m²</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono w-full md:w-auto">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-emerald-400 uppercase font-semibold">Actual Gen (Bar)</div>
                <div className="text-base font-bold text-emerald-300 mt-0.5">{actualGen.toFixed(1)} MW</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-blue-400 uppercase font-semibold">P50 Median Curve</div>
                <div className="text-base font-bold text-blue-300 mt-0.5">{p50Gen.toFixed(1)} MW</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-yellow-400 uppercase font-semibold">P10 Lower Bound</div>
                <div className="text-base font-bold text-yellow-300 mt-0.5">{p10Gen.toFixed(1)} MW</div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-[10px] text-emerald-300 uppercase font-semibold">P90 Upper Bound</div>
                <div className="text-base font-bold text-emerald-300 mt-0.5">{p90Gen.toFixed(1)} MW</div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto justify-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-mono">DSM Deviation</div>
                <div
                  className={`text-sm font-bold font-mono ${
                    isWithinBand ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {parseFloat(devMW) > 0 ? `+${devMW}` : devMW} MW ({devPercent}%)
                </div>
              </div>
              <div className="ml-2">
                {isWithinBand ? (
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    WITHIN ±5%
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    EXCEEDS BAND
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            PROBABILISTIC DIAGNOSTIC TRIAD (3 CARDS IN EXISTING CARD STYLE)
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Metrics Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900 font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                    Forecast Accuracy Metrics
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  BENCHMARK
                </span>
              </div>

              <div className="pt-3 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Normalized MAE (nMAE)</span>
                  <span className="text-slate-900 font-bold">
                    {loading || !forecastData ? '—' : `${forecastData.metrics.nmae}%`}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Normalized RMSE (nRMSE)</span>
                  <span className="text-slate-900 font-bold">
                    {loading || !forecastData ? '—' : `${forecastData.metrics.nrmse}%`}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Pinball Loss</span>
                  <span className="text-slate-900 font-bold">
                    {loading || !forecastData ? '—' : `${forecastData.metrics.pinball}%`}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">P10–P90 Coverage</span>
                  <span className="text-emerald-600 font-bold">
                    {loading || !forecastData ? '—' : `${forecastData.metrics.coverage}%`}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Skill vs Raw Forecast</span>
                  <span className="text-blue-600 font-bold">
                    {loading || !forecastData ? '—' : `+${forecastData.metrics.skill_vs_raw}%`}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Skill vs Persistence</span>
                  <span className="text-blue-600 font-bold">
                    {loading || !forecastData ? '—' : `+${forecastData.metrics.skill_vs_persistence}%`}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-500">
              Evaluated on 96 settlement intervals vs 50 MW plant nameplate
            </div>
          </div>

          {/* Card 2: Regime Breakdown */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900 font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                    Regime Breakdown
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                  CLIMATE REGIMES
                </span>
              </div>

              <div className="pt-3 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[11px] font-semibold text-slate-400 pb-1 border-b border-slate-100">
                  <span>Regime</span>
                  <span>nMAE</span>
                  <span>Coverage</span>
                </div>
                {forecastData?.by_regime.map((r, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-slate-100/60 last:border-0">
                    <span className="text-slate-800 font-medium">{r.regime}</span>
                    <span className="text-slate-700 font-bold">{loading ? '—' : `${r.nmae}%`}</span>
                    <span className="text-emerald-600 font-bold">{loading ? '—' : `${r.coverage}%`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-500">
              INSAT-3DR cloud classification & thermal infrared validation
            </div>
          </div>

          {/* Card 3: Calibration Plot (Nominal vs Observed Coverage) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900 font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                    Calibration Reliability
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  RELIABILITY
                </span>
              </div>

              {/* Calibration SVG Chart */}
              <div className="h-44 w-full relative mt-3">
                <svg className="w-full h-full" viewBox="0 0 200 140">
                  {/* Grid lines */}
                  <line x1="30" y1="20" x2="190" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="50" x2="190" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="80" x2="190" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="30" y1="110" x2="190" y2="110" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="30" y1="20" x2="30" y2="110" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Ideal 1:1 line (dashed slate) */}
                  <line x1="30" y1="110" x2="190" y2="20" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* Observed line connecting calibration points */}
                  {forecastData?.calibration && (
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      points={forecastData.calibration
                        .map((pt) => {
                          const x = 30 + (pt.nominal / 100) * 160;
                          const y = 110 - (pt.observed / 100) * 90;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Observed point circles */}
                  {forecastData?.calibration.map((pt, idx) => {
                    const x = 30 + (pt.nominal / 100) * 160;
                    const y = 110 - (pt.observed / 100) * 90;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#2563eb"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Labels */}
                  <text x="30" y="125" fill="#64748b" fontSize="8" fontFamily="monospace">0%</text>
                  <text x="110" y="125" fill="#64748b" fontSize="8" fontFamily="monospace">Nominal 50%</text>
                  <text x="180" y="125" fill="#64748b" fontSize="8" fontFamily="monospace">100%</text>
                  <text x="10" y="112" fill="#64748b" fontSize="8" fontFamily="monospace">0%</text>
                  <text x="8" y="24" fill="#64748b" fontSize="8" fontFamily="monospace">100%</text>
                </svg>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Observed vs Nominal Quantile</span>
              <span className="text-blue-600 font-semibold">Near-Ideal 1:1 Slope</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            CHART 2: THE RE-ENGINEERED SMOOTH DUCK & DISPATCH CURVE
            Replaced broken polygon stepped charts with high-precision
            Catmull-Rom cubic bezier curves showing:
            - Smooth Gross Regional Demand (Dashed Blue line)
            - Smooth Golden Duck Curve Net Demand (Solid Amber curve)
            - The Deep Solar Belly Dip with soft golden ambient fill
            - The Steep Evening Neck Ramp (+42 GW surge)
            - Smart BESS Battery Absorption during midday & Peak Injection
            ============================================================ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-slate-950 font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
                  National / Regional Duck Curve & Net Demand Engine
                </h2>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                  ILLUSTRATIVE
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                  Smooth Bezier Dynamics
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {duckZoomDesc}
              </p>
            </div>

            {/* Time Window Zoom Selector & View Modes */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Window Selector */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono">
                <button
                  onClick={() => setDuckTimeZoom('24h')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    duckTimeZoom === '24h'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  24h
                </button>
                <button
                  onClick={() => setDuckTimeZoom('12h')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    duckTimeZoom === '12h'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  12h
                </button>
                <button
                  onClick={() => setDuckTimeZoom('6h')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    duckTimeZoom === '6h'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  6h Belly
                </button>
                <button
                  onClick={() => setDuckTimeZoom('2h')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    duckTimeZoom === '2h'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2h Ramp
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-mono">
                <button
                  onClick={() => setDuckViewMode('combined')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    duckViewMode === 'combined'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Full View
                </button>
                <button
                  onClick={() => setDuckViewMode('duck-only')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    duckViewMode === 'duck-only'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Duck Only
                </button>
                <button
                  onClick={() => setDuckViewMode('dispatch-only')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    duckViewMode === 'dispatch-only'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  BESS Dispatch
                </button>
              </div>
            </div>
          </div>

          {/* Duck Curve Chart Legends */}
          <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-600 pt-1">
            <span className="font-semibold text-slate-800">{duckZoomTitle}</span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
                <span className="w-3.5 h-1 border-b-2 border-dashed border-blue-600" />
                <span>Gross Demand (GW)</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                <span className="w-3 h-1.5 bg-amber-500 rounded-xs" />
                <span>Net Demand Duck Curve (GW)</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                <span>BESS Absorb Buffer (MW)</span>
              </span>
              <span className="flex items-center gap-1.5 text-blue-800 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
                <span>BESS Peak Injection (MW)</span>
              </span>
            </div>
          </div>

          {/* SVG DUCK & DISPATCH CURVE STAGE */}
          <div className="space-y-3">
            <div className="h-84 sm:h-96 w-full relative bg-slate-950/2 rounded-2xl p-2 border border-slate-100">
              <svg
                ref={duckSvgRef}
                onMouseMove={handleDuckMouseMove}
                className="w-full h-full cursor-crosshair select-none"
                viewBox="0 0 960 260"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Net Demand Belly Area Gradient (Warm Amber glow) */}
                  <linearGradient id="duckBellyGradSmooth" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.38" />
                    <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#fef3c7" stopOpacity="0.02" />
                  </linearGradient>

                  {/* Solar Deficit Shade Gradient between Gross and Net */}
                  <linearGradient id="solarDisplacementGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#eab308" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                <line x1="0" y1="30" x2="960" y2="30" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="0" y1="75" x2="960" y2="75" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="960" y2="120" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="0" y1="165" x2="960" y2="165" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="0" y1="210" x2="960" y2="210" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Left Y-axis demand labels with white badge backing for high readability */}
                <g className="font-mono text-[10px] select-none">
                  <rect x="8" y="20" width="135" height="18" rx="4" fill="#ffffff" stroke="#e2e8f0" opacity="0.95" />
                  <text x="14" y="33" fill="#1e293b" fontWeight="bold">260 GW (Peak Evening)</text>

                  <rect x="8" y="65" width="60" height="18" rx="4" fill="#ffffff" stroke="#e2e8f0" opacity="0.95" />
                  <text x="14" y="78" fill="#475569" fontWeight="medium">220 GW</text>

                  <rect x="8" y="110" width="120" height="18" rx="4" fill="#ffffff" stroke="#e2e8f0" opacity="0.95" />
                  <text x="14" y="123" fill="#0284c7" fontWeight="bold">180 GW (Solar Noon)</text>

                  <rect x="8" y="155" width="60" height="18" rx="4" fill="#ffffff" stroke="#e2e8f0" opacity="0.95" />
                  <text x="14" y="168" fill="#475569" fontWeight="medium">140 GW</text>

                  <rect x="8" y="200" width="115" height="18" rx="4" fill="#ffffff" stroke="#e2e8f0" opacity="0.95" />
                  <text x="14" y="213" fill="#b45309" fontWeight="bold">100 GW (Grid Floor)</text>
                </g>

                {/* 1. Shaded Solar Belly Area between Gross and Net (The Classic Duck Belly) */}
                {(duckViewMode === 'combined' || duckViewMode === 'duck-only') && (
                  <path
                    d={bellyAreaPath}
                    fill="url(#solarDisplacementGrad)"
                  />
                )}

                {/* 2. Shaded Net Demand Under-Curve */}
                {(duckViewMode === 'combined' || duckViewMode === 'duck-only') && (
                  <path
                    d={`${smoothNetPath} L 960 210 L 0 210 Z`}
                    fill="url(#duckBellyGradSmooth)"
                  />
                )}

                {/* 3. Smooth Gross Demand Curve (Dashed Blue) */}
                {(duckViewMode === 'combined' || duckViewMode === 'duck-only') && (
                  <path
                    d={smoothGrossPath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                  />
                )}

                {/* 4. Smooth Net Demand Curve (Solid Golden Amber) */}
                {(duckViewMode === 'combined' || duckViewMode === 'duck-only') && (
                  <path
                    d={smoothNetPath}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="3.5"
                  />
                )}

                {/* 5. BESS Dispatch Columns (Green Charging / Blue Discharging) */}
                {(duckViewMode === 'combined' || duckViewMode === 'dispatch-only') &&
                  duckSlice.map((d, i) => {
                    if (d.bessPowerMW === 0) return null;
                    const x = (i / (duckSlice.length - 1)) * 960;
                    const isCh = d.bessPowerMW > 0;
                    const barH = (Math.abs(d.bessPowerMW) / 10) * 35;
                    return (
                      <rect
                        key={i}
                        x={x - 3.5}
                        y={isCh ? 210 - barH : 210}
                        width="7"
                        height={barH}
                        fill={isCh ? '#10b981' : '#2563eb'}
                        rx="2"
                        opacity="0.9"
                      />
                    );
                  })}

                {/* 6. Key Annotations based on 24h view */}
                {duckTimeZoom === '24h' && duckViewMode !== 'dispatch-only' && (
                  <>
                    {/* Belly Annotation */}
                    <g>
                      <rect x="375" y="148" width="180" height="26" rx="6" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1.5" />
                      <text x="465" y="165" fill="#92400e" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                        ▼ Midday Solar Belly
                      </text>
                    </g>

                    {/* Evening Ramp Annotation */}
                    <g>
                      <rect x="680" y="40" width="180" height="26" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.5" />
                      <text x="770" y="57" fill="#1e40af" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                        ▲ Evening Neck Ramp
                      </text>
                    </g>
                  </>
                )}

                {/* 7. Active Interactive Scrubber Cursor with floating value pill */}
                {duckActivePoint && (
                  <g className="pointer-events-none">
                    {(() => {
                      const x = (duckHoverIndex / (duckSlice.length - 1)) * 960;
                      const yNet = 210 - ((duckActivePoint.netDemandGW - 100) / 160) * 180;
                      const yGross = 210 - ((duckActivePoint.grossDemandGW - 100) / 160) * 180;

                      // Clamp tooltip box x to keep within SVG boundary - increased width to 175px and clean spacing to eliminate text overlap
                      const boxWidth = 175;
                      const boxX = Math.max(10, Math.min(960 - boxWidth - 10, x - boxWidth / 2));

                      return (
                        <>
                          <line
                            x1={x}
                            y1="15"
                            x2={x}
                            y2="215"
                            stroke="#0f172a"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                          />
                          {/* Gross marker */}
                          <circle
                            cx={x}
                            cy={yGross}
                            r="4.5"
                            fill="#2563eb"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                          {/* Net duck marker */}
                          <circle
                            cx={x}
                            cy={yNet}
                            r="6"
                            fill="#d97706"
                            stroke="#ffffff"
                            strokeWidth="2.5"
                          />

                          {/* Floating Value Pill attached to Scrubber Cursor - fixed text overlap */}
                          <g transform={`translate(${boxX}, 10)`}>
                            <rect
                              width={boxWidth}
                              height="44"
                              rx="8"
                              fill="#0f172a"
                              stroke="#38bdf8"
                              strokeWidth="1.5"
                              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                            />
                            <text x={boxWidth / 2} y="15" fill="#f8fafc" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                              {duckActivePoint.time} IST
                            </text>
                            <text x="12" y="32" fill="#93c5fd" fontSize="9.5" fontFamily="monospace">
                              Gross: <tspan fontWeight="bold" fill="#ffffff">{duckActivePoint.grossDemandGW} GW</tspan>
                            </text>
                            <text x="96" y="32" fill="#fcd34d" fontSize="9.5" fontFamily="monospace">
                              Net: <tspan fontWeight="bold" fill="#ffffff">{duckActivePoint.netDemandGW} GW</tspan>
                            </text>
                          </g>
                        </>
                      );
                    })()}
                  </g>
                )}
              </svg>
            </div>

            {/* Clear Time Axis Ticks */}
            <div className="flex justify-between items-center text-xs font-mono text-slate-600 px-2 pt-1 border-t border-slate-200">
              {duckTimeZoom === '24h' ? (
                <>
                  <span className="font-semibold">00:00</span>
                  <span>03:00</span>
                  <span className="text-amber-700 font-bold">06:00 (Sunrise)</span>
                  <span>09:00</span>
                  <span className="text-blue-700 font-bold">12:00 (Solar Peak)</span>
                  <span>15:00</span>
                  <span className="text-amber-700 font-bold">18:00 (Sunset)</span>
                  <span className="text-blue-900 font-bold">21:00 (Evening Peak)</span>
                  <span className="font-semibold">24:00</span>
                </>
              ) : (
                duckSlice.filter((_, idx) => idx % Math.max(1, Math.floor(duckSlice.length / 8)) === 0).map((pt, i) => (
                  <span key={i} className="font-medium text-slate-700">{pt.time}</span>
                ))
              )}
            </div>
          </div>

          {/* DUCK CURVE LIVE TELEMETRY HUD CARD - Clear high-contrast values */}
          {duckActivePoint && (
            <div className="p-5 rounded-2xl bg-slate-950 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 border border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold font-mono text-white">
                      {duckActivePoint.time} IST
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                      Block {duckActivePoint.block} / 96
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Solar PV Generation: <strong className="text-emerald-400">{duckActivePoint.solarGenMW} MW</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono w-full md:w-auto">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-blue-400 uppercase font-semibold">Gross Regional Demand</div>
                  <div className="text-base font-bold text-blue-300 mt-0.5">{duckActivePoint.grossDemandGW} GW</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-amber-400 uppercase font-semibold">Net Duck Demand</div>
                  <div className="text-base font-bold text-amber-300 mt-0.5">{duckActivePoint.netDemandGW} GW</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-emerald-400 uppercase font-semibold">Solar Deficit / Relief</div>
                  <div className="text-base font-bold text-emerald-300 mt-0.5">
                    {(duckActivePoint.grossDemandGW - duckActivePoint.netDemandGW).toFixed(1)} GW
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-center px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">BESS Dispatch State</div>
                  <div
                    className={`text-sm font-bold font-mono ${
                      duckActivePoint.bessPowerMW > 0
                        ? 'text-emerald-400'
                        : duckActivePoint.bessPowerMW < 0
                        ? 'text-blue-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {duckActivePoint.bessPowerMW > 0
                      ? `+${duckActivePoint.bessPowerMW} MW (Charging)`
                      : duckActivePoint.bessPowerMW < 0
                      ? `${duckActivePoint.bessPowerMW} MW (Discharging)`
                      : '0.0 MW (Standby)'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            SECTION 3: METEOROLOGICAL TELEMETRY & MULTI-MODEL COMPARISON
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-950 font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
              Multi-Horizon Forecast Ensemble Architecture
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              SunBank merges three distinct horizon pipelines to provide non-linear quantile forecasts for CERC 15-minute settlement blocks:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-mono font-bold text-yellow-600">NOWCAST (0–60 MIN)</div>
                <div className="text-sm font-bold text-slate-900 mt-1">Optical Flow Vector</div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  OpenCV Farneback algorithm on all-sky camera frames tracks cloud velocity across arrays.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-mono font-bold text-blue-600">INTRADAY (1–6 HOURS)</div>
                <div className="text-sm font-bold text-slate-900 mt-1">Satellite XGBoost</div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  INSAT-3DR thermal infrared and visible channels predict convective cell genesis.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-mono font-bold text-emerald-600">DAY-AHEAD (6–48 HOURS)</div>
                <div className="text-sm font-bold text-slate-900 mt-1">WRF-Solar Numerical</div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  High-resolution numerical weather prediction resolves Thar Desert boundary layer physics.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-950 font-['Helvetica_Neue',Helvetica,Arial,sans-serif] mb-2">
                Live Data Ingestion Pipeline
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Direct ground-truth sensor synchronization at Bhadla Substation.
              </p>

              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-yellow-600" />
                    <div>
                      <div className="font-bold text-slate-900">ISRO MOSDAC</div>
                      <div className="text-[10px] text-slate-500">INSAT-3DR L2B CMK/AOD</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600">LIVE (30m)</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-bold text-slate-900">All-Sky Camera</div>
                      <div className="text-[10px] text-slate-500">OpenCV Cloud Vector</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600">ACTIVE (10s)</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold text-slate-900">Class-A Pyranometer</div>
                      <div className="text-[10px] text-slate-500">MODBUS GHI Ground-Truth</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600">MODBUS (1s)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-mono text-slate-400">
              TimescaleDB retention: 365 days · 96 settlement blocks/day.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
