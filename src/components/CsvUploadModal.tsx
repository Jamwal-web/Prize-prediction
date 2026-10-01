import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { PricePoint } from '../types';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (points: PricePoint[], filename: string) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewPoints, setPreviewPoints] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      await parseCsvContent(content);
    };
    reader.readAsText(file);
  };

  const parseCsvContent = async (content: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const resp = await fetch('/api/upload-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_content: content }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        setErrorMsg(data.error || 'Failed to parse CSV format.');
        setPreviewPoints([]);
      } else {
        setPreviewPoints(data.historical_prices || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while parsing CSV.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (previewPoints.length >= 3) {
      onUploadSuccess(previewPoints, fileName || 'Custom Dataset');
      onClose();
    }
  };

  const loadSampleTemplate = (type: 'template' | 'iphone' | 'tesla') => {
    let sample = '';
    let name = '';
    if (type === 'template') {
      name = 'price_template_inr.csv';
      sample = `Date,Price,Source,Notes
2026-06-01,119900.00,Croma Store,Summer Sale
2026-06-15,118900.00,Online Deal,Clearance
2026-07-01,117900.00,Reliance Digital,July Promo
2026-07-15,116900.00,Store API,Mid-season
2026-08-01,115900.00,Retailer,Back to college
2026-08-15,113900.00,Direct Store,Independence Day Sale
2026-09-01,111900.00,Online Index,Autumn Refresh
2026-09-15,109900.00,Reliance Digital,Festival Season
2026-10-01,107900.00,Verified Vendor,Current Market Price`;
    } else if (type === 'iphone') {
      name = 'iphone_15_pro_inr.csv';
      sample = `Date,Price,Source,Notes
2026-04-01,134900.00,Apple Official,Launch
2026-05-01,131900.00,Amazon India,Discount
2026-06-01,127900.00,Croma,Summer Deal
2026-07-01,125900.00,Apple Store,Refreshed
2026-08-01,123900.00,Vijay Sales,Monsoon Sale
2026-09-01,120900.00,Apple Store,Pre-festival adjustment
2026-10-01,119900.00,Apple India / Croma,Current Market Price`;
    } else {
      name = 'tesla_model_3_inr.csv';
      sample = `Date,Price,Source,Notes
2026-04-01,4500000.00,Tesla Direct India,Base Launch Price
2026-05-10,4350000.00,Tesla Inventory,Existing inventory discount
2026-06-25,4190000.00,Tesla Inventory,Quarterly delivery target
2026-08-05,4080000.00,Tesla Configurator,Standard range update
2026-09-15,3980000.00,Tesla Direct,Festival incentives
2026-10-01,3950000.00,Tesla Direct India,Verified Live Price`;
    }

    setFileName(name);
    setCsvText(sample);
    parseCsvContent(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Upload Historical Price CSV</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Import custom product time-series for Python ML & C++ DSA forecasting
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-900/80 transition-all"
        >
          <UploadCloud className="h-10 w-10 text-blue-400 mb-2" />
          <div className="text-xs font-semibold text-slate-200">
            {fileName ? fileName : 'Click to select CSV file or drag and drop'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Accepts CSV format with <code className="text-cyan-300">Date</code> and <code className="text-cyan-300">Price</code> columns.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Quick Sample Templates */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Load Sample:</span>
          <button
            onClick={() => loadSampleTemplate('template')}
            className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Standard Template
          </button>
          <button
            onClick={() => loadSampleTemplate('iphone')}
            className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            iPhone 15 Pro CSV
          </button>
          <button
            onClick={() => loadSampleTemplate('tesla')}
            className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Tesla Model 3 CSV
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Preview Table */}
        {previewPoints.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-300 pb-1.5">
              <span className="font-semibold flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Validated {previewPoints.length} Price Records
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Range: {previewPoints[0].date} → {previewPoints[previewPoints.length - 1].date}
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 text-xs">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-900 text-slate-400 font-medium border-b border-slate-800">
                  <tr>
                    <th className="py-1.5 px-3">Date</th>
                    <th className="py-1.5 px-3 text-right">Price</th>
                    <th className="py-1.5 px-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-mono text-slate-300">
                  {previewPoints.slice(0, 10).map((p, i) => (
                    <tr key={i}>
                      <td className="py-1 px-3 tabular-nums">{p.date}</td>
                      <td className="py-1 px-3 text-right text-emerald-400 tabular-nums">
                        ₹{p.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1 px-3 text-slate-400 truncate max-w-[200px]">{p.source}</td>
                    </tr>
                  ))}
                  {previewPoints.length > 10 && (
                    <tr>
                      <td colSpan={3} className="py-1 px-3 text-center text-slate-500 text-[11px]">
                        + {previewPoints.length - 10} more records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={previewPoints.length < 3 || isLoading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40 transition-colors shadow-md shadow-blue-600/30"
          >
            {isLoading ? 'Processing...' : `Import & Generate Forecast (${previewPoints.length} Points)`}
          </button>
        </div>
      </div>
    </div>
  );
};
