import React, { useState } from 'react';
import { X, Calendar, DollarSign, Tag, FileText } from 'lucide-react';
import { PricePoint } from '../types';

interface ManualAddPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPoint: (point: PricePoint) => void;
}

export const ManualAddPriceModal: React.FC<ManualAddPriceModalProps> = ({
  isOpen,
  onClose,
  onAddPoint,
}) => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  const [source, setSource] = useState('Manual Entry');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Please provide a valid positive numeric price.');
      return;
    }

    if (!date) {
      setError('Please select a valid date.');
      return;
    }

    onAddPoint({
      date,
      price: Math.round(numericPrice * 100) / 100,
      source: source.trim() || 'Manual Entry',
      notes: notes.trim() || undefined,
      is_live_verified: false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white tracking-tight">Add Historical Price Record</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-2.5 text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-300 mb-1">Observation Date</label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Price (INR / ₹)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 119900.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 font-mono text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Source / Retailer</label>
            <input
              type="text"
              placeholder="e.g. Best Buy, Amazon, In-Store"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Context Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Black Friday discount, refurbished, seasonal sale"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-800 px-4 py-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm shadow-blue-600/30"
            >
              Save Price Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
