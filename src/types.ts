export interface PricePoint {
  date: string;
  price: number;
  source?: string;
  is_live_verified?: boolean;
  notes?: string;
}

export interface ForecastPoint {
  date: string;
  predicted_price: number;
  lower_bound_95: number;
  upper_bound_95: number;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  mape: number;
  r_squared: number;
  directional_accuracy?: number;
  train_size: number;
  test_size: number;
}

export interface ModelComparisonItem {
  name: string;
  id: string;
  weight_pct: number;
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
}

export interface PredictionResult {
  algorithm: string;
  algorithm_id: string;
  engine_type: string;
  execution_time_ms: number;
  metrics: ModelMetrics;
  model_comparison?: ModelComparisonItem[];
  expected_change_val: number;
  expected_change_pct: number;
  recommendation: string;
  forecasts: ForecastPoint[];
  dsa_features_used?: string[];
  engine_status?: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'smartphones' | 'laptops' | 'cars' | 'electronics' | 'consumer_goods';
  brand: string;
  sku: string;
  description: string;
  base_msrp: number;
  current_price: number;
  current_price_source: string;
  current_price_timestamp: string;
  is_live_api_backed: boolean;
  historical_count: number;
  historical_prices?: PricePoint[];
}

export interface LivePriceQuote {
  product_id: string;
  status: string;
  is_live_api_backed: boolean;
  source_type: string;
  vendor: string;
  official_sku: string;
  current_price: number;
  currency: string;
  timestamp: string;
  in_stock: boolean;
  source_url: string;
  message: string;
}

export interface EngineStatus {
  cpp_engine_available: boolean;
  active_engine: string;
  environment: string;
  supported_algorithms: {
    id: string;
    name: string;
    badge: string;
  }[];
}
