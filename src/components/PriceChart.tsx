import React, { useState, useMemo, useRef } from 'react';
import { PricePoint, ForecastPoint } from '../types';
import { TrendingUp, Layers, Eye, Calendar, Sparkles } from 'lucide-react';

interface PriceChartProps {
  historicalPrices: PricePoint[];
  forecasts: ForecastPoint[];
  productName: string;
  currentPrice: number;
  currentPriceSource: string;
  horizonDays: number;
  algorithmName: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  historicalPrices,
  forecasts,
  productName,
  currentPrice,
  currentPriceSource,
  horizonDays,
  algorithmName,
}) => {
  const [timeRange, setTimeRange] = useState<'all' | '90d' | '30d' | 'forecast_only'>('all');
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    price: number;
    type: 'historical' | 'forecast';
    lowerBound?: number;
    upperBound?: number;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter historical points by selected time range
  const filteredHistorical = useMemo(() => {
    if (timeRange === 'forecast_only') {
      return historicalPrices.slice(-5); // Keep last 5 for context
    }
    if (timeRange === '30d') {
      return historicalPrices.slice(-30);
    }
    if (timeRange === '90d') {
      return historicalPrices.slice(-90);
    }
    return historicalPrices;
  }, [historicalPrices, timeRange]);

  // Compute 7-point Moving Average for historical points
  const movingAverages = useMemo(() => {
    const ma: { date: string; value: number }[] = [];
    const windowSize = 7;
    for (let i = 0; i < filteredHistorical.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const sub = filteredHistorical.slice(start, i + 1);
      const avg = sub.reduce((acc, curr) => acc + curr.price, 0) / sub.length;
      ma.push({ date: filteredHistorical[i].date, value: avg });
    }
    return ma;
  }, [filteredHistorical]);

  // Combine and find min/max values for scaling
  const { minPrice, maxPrice, allDates } = useMemo(() => {
    const prices: number[] = [];
    const dates: string[] = [];

    filteredHistorical.forEach((p) => {
      prices.push(p.price);
      dates.push(p.date);
    });

    forecasts.forEach((f) => {
      prices.push(f.predicted_price);
      if (showConfidenceBand) {
        prices.push(f.lower_bound_95);
        prices.push(f.upper_bound_95);
      }
      dates.push(f.date);
    });

    if (prices.length === 0) {
      return { minPrice: 0, maxPrice: 100, allDates: [] };
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    // Add 8% padding to top and bottom for clean viewing
    const padding = (max - min) * 0.08 || min * 0.05;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
      allDates: dates,
    };
  }, [filteredHistorical, forecasts, showConfidenceBand]);

  // Chart Dimensions
  const svgWidth = 1000;
  const svgHeight = 420;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 50;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const totalPoints = filteredHistorical.length + forecasts.length;

  const getX = (index: number) => {
    if (totalPoints <= 1) return paddingLeft;
    return paddingLeft + (index / (totalPoints - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    if (maxPrice === minPrice) return paddingTop + chartHeight / 2;
    const ratio = (val - minPrice) / (maxPrice - minPrice);
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  // Build SVG Paths
  const historicalPath = useMemo(() => {
    if (filteredHistorical.length === 0) return '';
    return filteredHistorical
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.price).toFixed(1)}`)
      .join(' ');
  }, [filteredHistorical, minPrice, maxPrice]);

  const movingAveragePath = useMemo(() => {
    if (movingAverages.length === 0) return '';
    return movingAverages
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.value).toFixed(1)}`)
      .join(' ');
  }, [movingAverages, minPrice, maxPrice]);

  // Connect last historical point to first forecast point
  const forecastStartIndex = filteredHistorical.length - 1;

  const forecastPath = useMemo(() => {
    if (forecasts.length === 0 || filteredHistorical.length === 0) return '';
    const lastHist = filteredHistorical[filteredHistorical.length - 1];
    let path = `M ${getX(forecastStartIndex).toFixed(1)} ${getY(lastHist.price).toFixed(1)}`;
    forecasts.forEach((f, idx) => {
      const x = getX(forecastStartIndex + 1 + idx);
      const y = getY(f.predicted_price);
      path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    return path;
  }, [forecasts, filteredHistorical, minPrice, maxPrice]);

  // 95% Confidence Interval Area Path
  const confidenceBandPath = useMemo(() => {
    if (!showConfidenceBand || forecasts.length === 0 || filteredHistorical.length === 0) return '';
    const lastHist = filteredHistorical[filteredHistorical.length - 1];

    // Upper curve forward
    let forward = `M ${getX(forecastStartIndex).toFixed(1)} ${getY(lastHist.price).toFixed(1)}`;
    forecasts.forEach((f, idx) => {
      const x = getX(forecastStartIndex + 1 + idx);
      const y = getY(f.upper_bound_95);
      forward += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    // Lower curve backward
    let backward = '';
    for (let idx = forecasts.length - 1; idx >= 0; idx--) {
      const x = getX(forecastStartIndex + 1 + idx);
      const y = getY(forecasts[idx].lower_bound_95);
      backward += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    backward += ` L ${getX(forecastStartIndex).toFixed(1)} ${getY(lastHist.price).toFixed(1)} Z`;

    return forward + backward;
  }, [forecasts, filteredHistorical, showConfidenceBand, minPrice, maxPrice]);

  // Y-axis grid ticks
  const yTicks = useMemo(() => {
    const ticksCount = 5;
    const ticks: number[] = [];
    const step = (maxPrice - minPrice) / (ticksCount - 1);
    for (let i = 0; i < ticksCount; i++) {
      ticks.push(minPrice + i * step);
    }
    return ticks;
  }, [minPrice, maxPrice]);

  // X-axis date labels (sample 6 evenly spaced dates)
  const xLabels = useMemo(() => {
    if (allDates.length === 0) return [];
    const count = Math.min(6, allDates.length);
    const step = Math.floor(allDates.length / count);
    const labels: { text: string; x: number }[] = [];
    for (let i = 0; i < allDates.length; i += step) {
      labels.push({ text: allDates[i], x: getX(i) });
      if (labels.length >= 6) break;
    }
    // Always include the last forecast date
    if (allDates.length > 0) {
      const lastIdx = allDates.length - 1;
      labels[labels.length - 1] = { text: allDates[lastIdx], x: getX(lastIdx) };
    }
    return labels;
  }, [allDates, totalPoints]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white tracking-tight">Price Trajectory & Forecast Horizon</h3>
            <span className="text-xs text-slate-400 font-mono">({horizonDays}d outlook)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Model: {algorithmName}</span>
            <span aria-hidden="true">·</span>
            <span>Current: <strong className="text-emerald-400 font-mono tabular-nums">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-[180px] text-slate-400">{currentPriceSource}</span>
          </div>
        </div>

        {/* Filter controls & layer toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range buttons */}
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            {(['all', '90d', '30d', 'forecast_only'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  timeRange === r
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'all' ? 'Full History' : r === '90d' ? '90 Days' : r === '30d' ? '30 Days' : 'Forecast Focus'}
              </button>
            ))}
          </div>

          {/* Toggle Confidence Band */}
          <button
            onClick={() => setShowConfidenceBand(!showConfidenceBand)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showConfidenceBand
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>95% CI Band</span>
          </button>

          {/* Toggle Moving Average */}
          <button
            onClick={() => setShowMovingAverage(!showMovingAverage)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showMovingAverage
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>7d MA</span>
          </button>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div ref={containerRef} className="relative mt-4 w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.04" />
            </linearGradient>

            <linearGradient id="historicalGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Y-axis labels */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 12}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="11"
                  textAnchor="end"
                  className="font-mono tabular-nums"
                >
                  ${Math.round(tick).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Vertical Transition Boundary Line (Today / Forecast split) */}
          {forecastStartIndex >= 0 && (
            <g>
              <line
                x1={getX(forecastStartIndex)}
                y1={paddingTop}
                x2={getX(forecastStartIndex)}
                y2={svgHeight - paddingBottom}
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={getX(forecastStartIndex)}
                y={paddingTop - 10}
                fill="#818cf8"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
              >
                Forecast Origin
              </text>
            </g>
          )}

          {/* 95% Confidence Interval Band */}
          {showConfidenceBand && confidenceBandPath && (
            <path d={confidenceBandPath} fill="url(#confidenceGradient)" />
          )}

          {/* 7-day Moving Average Line */}
          {showMovingAverage && movingAveragePath && (
            <path
              d={movingAveragePath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.8"
            />
          )}

          {/* Historical Price Line */}
          {historicalPath && (
            <path
              d={historicalPath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Forecasted Price Line (Dashed) */}
          {forecastPath && (
            <path
              d={forecastPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Historical Interactive Dots */}
          {filteredHistorical.map((p, i) => {
            const x = getX(i);
            const y = getY(p.price);
            // Render visible dots periodically to keep DOM clean
            const shouldRenderDot = i % Math.max(1, Math.floor(filteredHistorical.length / 25)) === 0 || i === filteredHistorical.length - 1;
            return (
              <g key={`h-${i}`}>
                {shouldRenderDot && (
                  <circle
                    cx={x}
                    cy={y}
                    r={i === filteredHistorical.length - 1 ? 4 : 2.5}
                    fill={i === filteredHistorical.length - 1 ? '#38bdf8' : '#0284c7'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                )}
                {/* Hit target for hover */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      date: p.date,
                      price: p.price,
                      type: 'historical',
                      x,
                      y,
                    })
                  }
                />
              </g>
            );
          })}

          {/* Forecast Interactive Dots */}
          {forecasts.map((f, idx) => {
            const index = forecastStartIndex + 1 + idx;
            const x = getX(index);
            const y = getY(f.predicted_price);
            return (
              <g key={`f-${idx}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={idx === forecasts.length - 1 ? 4.5 : 3}
                  fill="#f59e0b"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
                {/* Hit target */}
                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      date: f.date,
                      price: f.predicted_price,
                      type: 'forecast',
                      lowerBound: f.lower_bound_95,
                      upperBound: f.upper_bound_95,
                      x,
                      y,
                    })
                  }
                />
              </g>
            );
          })}

          {/* Hover highlight circle */}
          {hoveredPoint && (
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="6.5"
              fill={hoveredPoint.type === 'historical' ? '#38bdf8' : '#f59e0b'}
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}

          {/* X-axis Date Labels */}
          {xLabels.map((lbl, idx) => (
            <text
              key={idx}
              x={lbl.x}
              y={svgHeight - 15}
              fill="#64748b"
              fontSize="11"
              textAnchor="middle"
              className="font-mono tabular-nums"
            >
              {lbl.text}
            </text>
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-20 rounded-lg border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md transition-all text-xs"
            style={{
              left: `${Math.min(Math.max(10, (hoveredPoint.x / svgWidth) * 100), 85)}%`,
              top: `${Math.max(10, (hoveredPoint.y / svgHeight) * 100 - 35)}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="flex items-center gap-1.5 font-medium text-slate-300 pb-1 border-b border-slate-800">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{hoveredPoint.date}</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  hoveredPoint.type === 'historical' ? 'text-cyan-400' : 'text-amber-400 font-semibold'
                }
              >
                {hoveredPoint.type === 'historical' ? 'Recorded Price' : 'Predicted Price'}
              </span>
            </div>

            <div className="mt-2 text-base font-bold font-mono text-white tabular-nums">
              ${hoveredPoint.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>

            {hoveredPoint.lowerBound !== undefined && hoveredPoint.upperBound !== undefined && (
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                <div>95% CI: <span className="text-amber-300 font-medium">${hoveredPoint.lowerBound.toLocaleString()} – ${hoveredPoint.upperBound.toLocaleString()}</span></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-6 rounded-full bg-cyan-400" />
            <span>Historical Recorded Price</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-6 border-b-2 border-dashed border-amber-400" />
            <span>Predicted Forecast Curve</span>
          </div>
          {showConfidenceBand && (
            <div className="flex items-center gap-2">
              <span className="h-3 w-4 rounded-xs bg-amber-400/20 border border-amber-400/50" />
              <span>95% Stat Confidence Envelope</span>
            </div>
          )}
        </div>

        <div className="font-mono text-[11px] text-slate-400">
          Showing {filteredHistorical.length} historical points + {forecasts.length} future projections
        </div>
      </div>
    </div>
  );
};
