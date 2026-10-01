import React from 'react';
import { ModelMetrics, ModelComparisonItem } from '../types';
import { Cpu } from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface MetricsCardProps {
  metrics: ModelMetrics;
  algorithmName: string;
  engineType: string;
  executionTimeMs: number;
  modelComparison?: ModelComparisonItem[];
  dsaFeaturesUsed?: string[];
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  metrics,
  algorithmName,
  engineType,
  executionTimeMs,
  modelComparison,
  dsaFeaturesUsed,
}) => {
  const isCpp = engineType === 'cpp_dsa_engine';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">Model Validation & DSA Benchmarks</h3>
          <p className="text-xs text-slate-400 mt-0.5">80/20 chronological train/test holdout evaluation</p>
        </div>

        {/* Engine status indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-slate-300 font-mono">
            <Cpu className={`h-3.5 w-3.5 ${isCpp ? 'text-cyan-400' : 'text-blue-400'}`} />
            <span>{isCpp ? 'C++ Native DSA Core' : 'Python DSA ML Engine'}</span>
          </span>
          <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-slate-400 font-mono text-[11px] tabular-nums">
            {executionTimeMs} ms
          </span>
        </div>
      </div>

      {/* 4 Core Statistical Metrics Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-medium">MAE (Mean Absolute Error)</div>
          <div className="mt-1 text-lg font-bold font-mono text-white tabular-nums">
            {formatINR(metrics.mae, true)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Average rupee deviation</div>
        </div>

        <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-medium">RMSE (Root Mean Square)</div>
          <div className="mt-1 text-lg font-bold font-mono text-white tabular-nums">
            {formatINR(metrics.rmse, true)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Penalizes large errors</div>
        </div>

        <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-medium">MAPE (Mean Percentage Error)</div>
          <div className="mt-1 text-lg font-bold font-mono text-emerald-400 tabular-nums">
            {metrics.mape.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Relative variance %</div>
        </div>

        <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-medium">R² Determination Score</div>
          <div className="mt-1 text-lg font-bold font-mono text-cyan-400 tabular-nums">
            {metrics.r_squared.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Explained variance (0 to 1)</div>
        </div>
      </div>

      {/* Multi-Model Comparison Table if available */}
      {modelComparison && modelComparison.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Multi-Model Holdout Benchmark & Inverse-Variance Weights
          </h4>
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Model Architecture</th>
                  <th className="py-2.5 px-3 text-right">Ensemble Weight</th>
                  <th className="py-2.5 px-3 text-right">Test MAE</th>
                  <th className="py-2.5 px-3 text-right">Test RMSE</th>
                  <th className="py-2.5 px-3 text-right">Test MAPE</th>
                  <th className="py-2.5 px-3 text-right">R² Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                {modelComparison.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2 px-3 font-sans font-medium text-white">{m.name}</td>
                    <td className="py-2 px-3 text-right text-blue-400 font-bold tabular-nums">
                      {m.weight_pct}%
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatINR(m.mae, true)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{formatINR(m.rmse, true)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{m.mape.toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right text-emerald-400 tabular-nums">
                      {m.r2.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DSA Features Highlight */}
      {dsaFeaturesUsed && dsaFeaturesUsed.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium">DSA Modules Executed: </span>
          <span className="text-slate-300 font-mono text-[11px]">
            {dsaFeaturesUsed.join(' · ')}
          </span>
        </div>
      )}
    </div>
  );
};
