import React, { useState, useMemo } from 'react';
import { PricePoint } from '../types';
import { Plus, Download, Trash2, Search, ShieldCheck } from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface HistoricalDataTableProps {
  points: PricePoint[];
  productName: string;
  onAddPoint: () => void;
  onDeletePoint: (index: number) => void;
  onExportCsv: () => void;
}

export const HistoricalDataTable: React.FC<HistoricalDataTableProps> = ({
  points,
  productName,
  onAddPoint,
  onDeletePoint,
  onExportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  const filteredPoints = useMemo(() => {
    if (!searchTerm.trim()) return points;
    const term = searchTerm.toLowerCase();
    return points.filter(
      (p) =>
        p.date.includes(term) ||
        p.price.toString().includes(term) ||
        (p.source && p.source.toLowerCase().includes(term)) ||
        (p.notes && p.notes.toLowerCase().includes(term))
    );
  }, [points, searchTerm]);

  const totalPages = Math.ceil(filteredPoints.length / rowsPerPage) || 1;
  const paginatedPoints = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredPoints.slice(start, start + rowsPerPage);
  }, [filteredPoints, currentPage]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-md">
      {/* Header and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">Historical Price Registry</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {points.length} verified records · Chronologically indexed
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Manual Price Button */}
          <button
            onClick={onAddPoint}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-blue-400" />
            <span>Add Manual Price</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search dates, sources, notes..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-medium">
            <tr>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3 text-right">Price (INR / ₹)</th>
              <th className="py-2.5 px-3">Source / Vendor</th>
              <th className="py-2.5 px-3">Notes</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {paginatedPoints.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                  No historical price records match your query.
                </td>
              </tr>
            ) : (
              paginatedPoints.map((p, idx) => {
                const globalIndex = points.indexOf(p);
                return (
                  <tr key={`${p.date}-${idx}`} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2 px-3 font-mono tabular-nums text-slate-200">
                      {p.date}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold tabular-nums text-emerald-400">
                      {formatINR(p.price, true)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 text-slate-300 truncate max-w-[200px]">
                        {p.is_live_verified && (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span>{p.source || 'Historical Record'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-slate-400 truncate max-w-[220px]">
                      {p.notes || '—'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => onDeletePoint(globalIndex)}
                        title="Delete price entry"
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {paginatedPoints.length} of {filteredPoints.length} entries</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-mono">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
