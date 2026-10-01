import React from 'react';
import { ExternalLink, CheckCircle2, Clock, ShieldCheck, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { LivePriceQuote } from '../types';
import { formatINR } from '../utils/formatters';

interface RecommendationCardProps {
  recommendation: string;
  expectedChangeVal: number;
  expectedChangePct: number;
  currentPrice: number;
  baseMsrp: number;
  horizonDays: number;
  liveQuote?: LivePriceQuote | null;
  productName: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  expectedChangeVal,
  expectedChangePct,
  currentPrice,
  baseMsrp,
  horizonDays,
  liveQuote,
  productName,
}) => {
  const isDrop = expectedChangePct < -1.5;
  const isSurge = expectedChangePct > 1.5;

  const msrpDelta = currentPrice - baseMsrp;
  const msrpDeltaPct = ((msrpDelta / baseMsrp) * 100).toFixed(1);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
      <div>
        {/* Recommendation Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-medium text-slate-400">Market Decision Guidance</span>
          <span className="text-xs font-mono text-slate-400">{horizonDays}-day outlook</span>
        </div>

        {/* Primary Verdict Banner */}
        <div className={`mt-4 rounded-lg p-4 border transition-all ${
          isDrop
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
            : isSurge
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            : 'border-blue-500/30 bg-blue-500/10 text-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {isDrop ? (
              <ArrowDownRight className="h-5 w-5 text-amber-400 shrink-0" />
            ) : isSurge ? (
              <ArrowUpRight className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <Minus className="h-5 w-5 text-blue-400 shrink-0" />
            )}
            <h4 className="text-sm font-semibold tracking-tight">
              {isDrop ? 'Wait for Price Drop' : isSurge ? 'Favorable Buy Window' : 'Fair Market Valuation'}
            </h4>
          </div>
          <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
            {recommendation}
          </p>
        </div>

        {/* Forecasted Price Delta Matrix */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium">Projected Shift</span>
            <div className={`mt-1 text-base font-bold font-mono tabular-nums flex items-center gap-1 ${
              expectedChangeVal < 0 ? 'text-amber-400' : expectedChangeVal > 0 ? 'text-emerald-400' : 'text-slate-200'
            }`}>
              {expectedChangeVal > 0 ? '+' : ''}{formatINR(expectedChangeVal, true)}
              <span className="text-xs font-medium font-sans">
                ({expectedChangePct > 0 ? '+' : ''}{expectedChangePct}%)
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium">Vs. Original MSRP</span>
            <div className={`mt-1 text-base font-bold font-mono tabular-nums ${
              msrpDelta < 0 ? 'text-emerald-400' : 'text-slate-300'
            }`}>
              {msrpDelta > 0 ? '+' : ''}{formatINR(msrpDelta, false)}
              <span className="text-xs font-normal text-slate-400 ml-1">
                ({msrpDeltaPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Live Vendor Feed Attribution */}
      <div className="mt-5 pt-4 border-t border-slate-800 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Pricing Feed Source
          </span>

          {liveQuote?.is_live_api_backed ? (
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Verified API Live Feed
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono">
              User Record Feed
            </span>
          )}
        </div>

        <div className="mt-2 text-slate-300">
          <strong>Vendor:</strong> {liveQuote?.vendor || 'Retail Index Partner'}
        </div>

        {liveQuote?.timestamp && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <Clock className="h-3 w-3" />
            <span>Updated: {liveQuote.timestamp}</span>
          </div>
        )}

        {liveQuote?.source_url && (
          <div className="mt-2.5">
            <a
              href={liveQuote.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
            >
              <span>View live listing on vendor site</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
