import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PriceChart } from './components/PriceChart';
import { RecommendationCard } from './components/RecommendationCard';
import { MetricsCard } from './components/MetricsCard';
import { HistoricalDataTable } from './components/HistoricalDataTable';
import { CsvUploadModal } from './components/CsvUploadModal';
import { GitHubPublishModal } from './components/GitHubPublishModal';
import { ManualAddPriceModal } from './components/ManualAddPriceModal';
import { Product, PricePoint, PredictionResult, LivePriceQuote, EngineStatus } from './types';
import { formatINR, formatINRCompact } from './utils/formatters';
import {
  Smartphone,
  Laptop,
  Car,
  Tv,
  Package,
  Search,
  Sparkles,
  SlidersHorizontal,
  Cpu,
  Layers,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  History,
  TrendingDown,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Working historical data (allows user to edit, delete, or upload custom data)
  const [currentHistorical, setCurrentHistorical] = useState<PricePoint[]>([]);
  const [customDatasetName, setCustomDatasetName] = useState<string | null>(null);

  // Prediction Form State
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('ensemble');
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [liveQuote, setLiveQuote] = useState<LivePriceQuote | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isGithubOpen, setIsGithubOpen] = useState<boolean>(false);
  const [isAddPriceOpen, setIsAddPriceOpen] = useState<boolean>(false);

  // Saved prediction history session
  const [savedPredictions, setSavedPredictions] = useState<
    { id: string; time: string; product: string; algorithm: string; horizon: number; changePct: number }[]
  >([]);

  // Fetch Catalog & Diagnostics on Mount
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [prodRes, engineRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/engine-status'),
      ]);

      if (!prodRes.ok) throw new Error('Failed to load product catalog');
      const prodData = await prodRes.json();
      setProducts(prodData);

      if (engineRes.ok) {
        const engData = await engineRes.json();
        setEngineStatus(engData);
      }

      if (prodData.length > 0) {
        const first = prodData[0];
        setSelectedProduct(first);
        setCurrentHistorical(first.historical_prices || []);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error connecting to backend services.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Fetch Live Quote when selected product changes
  const fetchLiveQuote = useCallback(async (productId: string) => {
    try {
      const res = await fetch(`/api/current-price/${productId}`);
      if (res.ok) {
        const quote = await res.json();
        setLiveQuote(quote);
      }
    } catch (e) {
      console.warn('Failed to fetch live quote:', e);
    }
  }, []);

  // Run Prediction
  const runPrediction = useCallback(
    async (pointsToUse: PricePoint[], horizon: number, algo: string, prodId?: string) => {
      if (!pointsToUse || pointsToUse.length < 3) {
        setErrorMsg('At least 3 chronological price points are required to compute predictions.');
        return;
      }

      setIsPredicting(true);
      setErrorMsg(null);

      try {
        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: prodId,
            historical_prices: pointsToUse,
            algorithm: algo,
            horizon_days: horizon,
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Prediction calculation failed.');
        }

        setPredictionResult(data);

        // Record in history drawer
        const histItem = {
          id: Math.random().toString(36).substring(7),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          product: customDatasetName || selectedProduct?.name || 'Custom Dataset',
          algorithm: data.algorithm,
          horizon,
          changePct: data.expected_change_pct,
        };
        setSavedPredictions((prev) => [histItem, ...prev.slice(0, 7)]);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to generate forecast.');
      } finally {
        setIsPredicting(false);
      }
    },
    [customDatasetName, selectedProduct]
  );

  // Automatically trigger prediction when selected product or historical data is loaded
  useEffect(() => {
    if (selectedProduct && currentHistorical.length >= 3) {
      fetchLiveQuote(selectedProduct.id);
      runPrediction(currentHistorical, horizonDays, selectedAlgorithm, selectedProduct.id);
    }
  }, [selectedProduct, horizonDays, selectedAlgorithm]);

  // Handle Product Selection
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCustomDatasetName(null);
    setCurrentHistorical(product.historical_prices || []);
  };

  // Handle CSV Upload Success
  const handleCsvImport = (points: PricePoint[], filename: string) => {
    setCustomDatasetName(filename);
    setSelectedProduct(null);
    setCurrentHistorical(points);
    setLiveQuote({
      product_id: 'custom-csv',
      status: 'unverified_user_data',
      is_live_api_backed: false,
      source_type: 'user_uploaded_csv',
      vendor: `User CSV (${filename})`,
      official_sku: 'User Import',
      current_price: points[points.length - 1].price,
      currency: 'USD',
      timestamp: new Date().toISOString(),
      in_stock: true,
      source_url: '',
      message: 'Custom user uploaded dataset active. Predictions calculated directly from CSV timeline.',
    });
    runPrediction(points, horizonDays, selectedAlgorithm);
  };

  // Add Manual Price Point
  const handleAddManualPoint = (newPoint: PricePoint) => {
    const updated = [...currentHistorical, newPoint];
    updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setCurrentHistorical(updated);
    runPrediction(updated, horizonDays, selectedAlgorithm);
  };

  // Delete Historical Point
  const handleDeletePoint = (index: number) => {
    if (currentHistorical.length <= 3) {
      setErrorMsg('Cannot delete: A minimum of 3 points is required to maintain forecasting models.');
      return;
    }
    const updated = currentHistorical.filter((_, i) => i !== index);
    setCurrentHistorical(updated);
    runPrediction(updated, horizonDays, selectedAlgorithm);
  };

  // Export Full Forecast & History to CSV
  const handleExportCsv = async () => {
    try {
      const prodName = customDatasetName || selectedProduct?.name || 'Product';
      const res = await fetch('/api/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: prodName,
          historical_prices: currentHistorical,
          forecasts: predictionResult?.forecasts || [],
        }),
      });

      if (!res.ok) throw new Error('Export generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prodName.toLowerCase().replace(/\s+/g, '_')}_forecast.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      setErrorMsg(e.message || 'Export error');
    }
  };

  // Category Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === 'all' || p.category === activeCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'smartphones':
        return <Smartphone className="h-4 w-4" />;
      case 'laptops':
        return <Laptop className="h-4 w-4" />;
      case 'cars':
        return <Car className="h-4 w-4" />;
      case 'electronics':
        return <Tv className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const currentPriceDisplay = currentHistorical.length > 0 ? currentHistorical[currentHistorical.length - 1].price : 0;
  const currentPriceSourceDisplay =
    liveQuote?.vendor || selectedProduct?.current_price_source || 'Verified Market Retail Index';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract Navigation */}
      <Navbar
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setSearchQuery('');
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenGithub={() => setIsGithubOpen(true)}
        cppAvailable={engineStatus?.cpp_engine_available || false}
        onRefreshData={loadInitialData}
        isLoading={isLoading}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Notification Banner if any */}
        {errorMsg && (
          <div className="flex items-center justify-between rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-white underline text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Product Selection & Search Bar */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search products by model, brand, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Sector / Custom state label */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Selected Item:</span>
              <strong className="text-white truncate max-w-[260px]">
                {customDatasetName ? `Custom CSV: ${customDatasetName}` : selectedProduct?.name || 'Select Product'}
              </strong>
              {customDatasetName && (
                <button
                  onClick={() => {
                    if (products.length > 0) handleSelectProduct(products[0]);
                  }}
                  className="text-blue-400 hover:text-blue-300 underline ml-1"
                >
                  Reset to Catalog
                </button>
              )}
            </div>
          </div>

          {/* Quick Select Catalog Badges */}
          {!customDatasetName && filteredProducts.length > 0 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-all ${
                    selectedProduct?.id === p.id
                      ? 'border-blue-500 bg-blue-600/20 text-white shadow-xs font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span className="text-slate-400">{getCategoryIcon(p.category)}</span>
                  <span>{p.name}</span>
                  <span className="font-mono text-emerald-400 font-bold tabular-nums">
                    {formatINR(p.current_price, false)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Prediction Form Controls Bar */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-md backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Horizon Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-blue-400" />
                Horizon:
              </span>
              <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
                {[
                  { days: 7, label: '7 Days' },
                  { days: 30, label: '30 Days' },
                  { days: 90, label: '3 Months' },
                  { days: 180, label: '6 Months' },
                ].map((h) => (
                  <button
                    key={h.days}
                    onClick={() => setHorizonDays(h.days)}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                      horizonDays === h.days
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Architecture Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 shrink-0">
                <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
                Algorithm:
              </span>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 py-1.5 px-3 text-xs text-white focus:border-blue-500 focus:outline-none font-medium"
              >
                <option value="ensemble">Auto-Ensemble (Optimal Blend - Recommended)</option>
                <option value="cpp_engine">
                  C++ DSA Holt-Winters Core ({engineStatus?.cpp_engine_available ? 'Compiled Native' : 'Python DSA Fallback'})
                </option>
                <option value="holt_winters">Holt-Winters Double Exponential Smoothing</option>
                <option value="linear">Ordinary Least Squares (OLS) Linear Regression</option>
                <option value="random_forest">Random Forest Regressor (Decision Tree Ensemble)</option>
              </select>
            </div>

            {/* Action Button */}
            <div>
              <button
                onClick={() =>
                  runPrediction(currentHistorical, horizonDays, selectedAlgorithm, selectedProduct?.id)
                }
                disabled={isPredicting || currentHistorical.length < 3}
                className="w-full lg:w-auto flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-600/30"
              >
                <Sparkles className={`h-4 w-4 ${isPredicting ? 'animate-spin' : ''}`} />
                <span>{isPredicting ? 'Recalculating Models...' : 'Calculate Forecast'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Interactive Visual Workspace: Chart + Recommendation Card */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Interactive Chart (2 Columns on Desktop) */}
          <div className="lg:col-span-2 space-y-6">
            <PriceChart
              historicalPrices={currentHistorical}
              forecasts={predictionResult?.forecasts || []}
              productName={customDatasetName || selectedProduct?.name || 'Product'}
              currentPrice={currentPriceDisplay}
              currentPriceSource={currentPriceSourceDisplay}
              horizonDays={horizonDays}
              algorithmName={predictionResult?.algorithm || 'Auto-Ensemble'}
            />

            {/* Model Validation & DSA Metrics Card */}
            {predictionResult && (
              <MetricsCard
                metrics={predictionResult.metrics}
                algorithmName={predictionResult.algorithm}
                engineType={predictionResult.engine_type}
                executionTimeMs={predictionResult.execution_time_ms}
                modelComparison={predictionResult.model_comparison}
                dsaFeaturesUsed={predictionResult.dsa_features_used}
              />
            )}
          </div>

          {/* Right Rail: Recommendation & Product Highlights */}
          <div className="space-y-6">
            {predictionResult && (
              <RecommendationCard
                recommendation={predictionResult.recommendation}
                expectedChangeVal={predictionResult.expected_change_val}
                expectedChangePct={predictionResult.expected_change_pct}
                currentPrice={currentPriceDisplay}
                baseMsrp={selectedProduct?.base_msrp || currentPriceDisplay}
                horizonDays={horizonDays}
                liveQuote={liveQuote}
                productName={customDatasetName || selectedProduct?.name || 'Product'}
              />
            )}

            {/* Session Prediction History Drawer */}
            {savedPredictions.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-md backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-blue-400" />
                    Session Prediction History
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {savedPredictions.length} runs
                  </span>
                </div>

                <div className="mt-2.5 divide-y divide-slate-800/60 text-xs">
                  {savedPredictions.map((sp) => (
                    <div key={sp.id} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-200 truncate max-w-[170px]">
                          {sp.product}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {sp.time} · {sp.horizon}d outlook
                        </div>
                      </div>
                      <div
                        className={`font-mono text-xs font-bold tabular-nums flex items-center gap-0.5 ${
                          sp.changePct < 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {sp.changePct < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <TrendingUp className="h-3 w-3" />
                        )}
                        <span>{sp.changePct > 0 ? '+' : ''}{sp.changePct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Historical Price Registry Ledger */}
        <section>
          <HistoricalDataTable
            points={currentHistorical}
            productName={customDatasetName || selectedProduct?.name || 'Product'}
            onAddPoint={() => setIsAddPriceOpen(true)}
            onDeletePoint={handleDeletePoint}
            onExportCsv={handleExportCsv}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            PricePredictor AI · Enterprise Time-Series Forecasting & Real Price Tracking
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Python 3.10 ML</span>
            <span>·</span>
            <span>C++17 DSA Core</span>
            <span>·</span>
            <span>React 19 & Tailwind</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleCsvImport}
      />

      <GitHubPublishModal
        isOpen={isGithubOpen}
        onClose={() => setIsGithubOpen(false)}
      />

      <ManualAddPriceModal
        isOpen={isAddPriceOpen}
        onClose={() => setIsAddPriceOpen(false)}
        onAddPoint={handleAddManualPoint}
      />
    </div>
  );
}
