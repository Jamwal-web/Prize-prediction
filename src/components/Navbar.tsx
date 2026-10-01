import React from 'react';
import { UploadCloud, Github, Cpu, Database, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenUpload: () => void;
  onOpenGithub: () => void;
  cppAvailable: boolean;
  onRefreshData: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeCategory,
  onSelectCategory,
  onOpenUpload,
  onOpenGithub,
  cppAvailable,
  onRefreshData,
  isLoading,
}) => {
  const categories = [
    { id: 'all', label: 'All Sectors' },
    { id: 'smartphones', label: 'Smartphones' },
    { id: 'laptops', label: 'Laptops' },
    { id: 'cars', label: 'Cars' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'consumer_goods', label: 'Consumer Goods' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-mono font-bold text-lg shadow-lg shadow-blue-500/20">
            P
          </div>
          <div>
            <a href="/" className="text-lg font-bold tracking-tight text-white hover:text-blue-400 transition-colors">
              PricePredictor AI
            </a>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Python ML</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3 text-cyan-400" />
                {cppAvailable ? 'C++ DSA Core' : 'Python DSA Fallback'}
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Category Filter Tabs */}
        <nav className="hidden lg:flex items-center gap-1 rounded-lg bg-slate-900/80 p-1 border border-slate-800/80">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCategory(c.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeCategory === c.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefreshData}
            disabled={isLoading}
            title="Reload live feeds"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <UploadCloud className="h-4 w-4 text-blue-400" />
            <span className="hidden sm:inline">Upload CSV</span>
          </button>

          <button
            onClick={onOpenGithub}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-all shadow-sm shadow-blue-600/30"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </button>
        </div>
      </div>
    </header>
  );
};
