# PricePredictor AI - API Reference

Base URL: `/api` (or `http://localhost:3000/api` / `http://localhost:5000/api`)

---

### 1. `GET /api/products`
Retrieves preloaded catalog items.

**Query Parameters:**
- `category` (optional): `all`, `smartphones`, `laptops`, `cars`, `electronics`, `consumer_goods`

**Response Example:**
```json
[
  {
    "id": "iphone-15-pro",
    "name": "Apple iPhone 15 Pro (128GB)",
    "category": "smartphones",
    "brand": "Apple",
    "sku": "MYNG3LL/A",
    "current_price": 899.00,
    "current_price_source": "Verified Apple Retail API",
    "current_price_timestamp": "2026-10-01 12:00:00 UTC",
    "is_live_api_backed": true,
    "historical_count": 180
  }
]
```

---

### 2. `POST /api/predict`
Calculates future price forecasts using machine learning and DSA algorithms.

**Request Body:**
```json
{
  "product_id": "iphone-15-pro",
  "algorithm": "ensemble",
  "horizon_days": 30
}
```
*Note: You may also pass custom `"historical_prices": [{"date": "2026-06-01", "price": 999.0}]`.*

**Available Algorithms:**
- `ensemble` (Auto-Ensemble multi-model blend)
- `cpp_engine` (C++ DSA Holt-Winters Core)
- `holt_winters` (Double Exponential Smoothing)
- `linear` (Ordinary Least Squares Linear Regression)
- `random_forest` (Decision Tree Ensemble)

**Response Example:**
```json
{
  "algorithm": "Auto-Ensemble (Optimal Multi-Model Blend)",
  "algorithm_id": "ensemble",
  "engine_type": "python_dsa_ml",
  "execution_time_ms": 124.5,
  "metrics": {
    "mae": 8.42,
    "rmse": 11.23,
    "mape": 0.89,
    "r_squared": 0.941,
    "directional_accuracy": 82.5,
    "train_size": 144,
    "test_size": 36
  },
  "expected_change_val": -24.50,
  "expected_change_pct": -2.73,
  "recommendation": "Neutral / Slight Dip — Price expected to soften slightly (-2.73%), remaining within typical volatility.",
  "forecasts": [
    {
      "date": "2026-10-03",
      "predicted_price": 896.20,
      "lower_bound_95": 884.10,
      "upper_bound_95": 908.30
    }
  ]
}
```

---

### 3. `GET /api/current-price/<product_id>`
Fetches verified live price quote from retail vendor API adapter.

**Response Example:**
```json
{
  "product_id": "iphone-15-pro",
  "status": "success",
  "is_live_api_backed": true,
  "source_type": "verified_vendor_api",
  "vendor": "Apple Store / Best Buy API",
  "official_sku": "MYNG3LL/A",
  "current_price": 999.00,
  "currency": "USD",
  "timestamp": "2026-10-01 20:02:22 UTC",
  "in_stock": true,
  "source_url": "https://www.apple.com/shop/buy-iphone/iphone-15-pro",
  "message": "Real price synchronized from Apple Store / Best Buy API"
}
```

---

### 4. `POST /api/upload-csv`
Validates, parses, deduplicates, and chronologically sorts uploaded CSV records.

**Request Body (JSON):**
```json
{
  "csv_content": "Date,Price\n2026-06-01,999.00\n2026-07-01,979.00\n2026-08-01,949.00\n2026-09-01,919.00"
}
```
*(Supports multipart file upload with `file` key as well).*

---

### 5. `POST /api/export-csv`
Generates downloadable CSV containing merged historical records and forecast curves.
