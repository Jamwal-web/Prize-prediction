# PricePredictor AI

[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![C++17](https://img.shields.io/badge/C++-17-00599C?logo=c%2B%2B&logoColor=white)](https://isocpp.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**PricePredictor AI** is an advanced product price prediction and historical price analytics platform. It combines Python machine learning, C++ Data Structures & Algorithms (DSA), and an interactive dark-themed dashboard to forecast future prices across smartphones, laptops, cars, electronics, and consumer goods.

---

## Key Features

1. **Modern Dark-Themed Dashboard**
   - Responsive layout for desktop, tablet, and mobile.
   - Interactive historical and predictive charts with 95% Confidence Interval envelopes.
   - Time-series window toggles (7 Days, 30 Days, 3 Months, 6 Months).
   - "Buy Now" vs. "Wait for Drop" actionable recommendation engine.

2. **Historical Price Analysis**
   - Manual price point adding and editing.
   - Drag-and-drop CSV uploads with instant validation, date normalization, and error handling.
   - Chronological sorting and gap detection.
   - Export analysis to CSV format.

3. **Verified Current Price Feeds**
   - Integration-ready live price adapter (Apple Store, Best Buy, Amazon, Tesla, B&H Photo, etc.).
   - Explicit distinction between verified API live quotes and user-entered records.
   - Zero hallucinated prices policy.

4. **Machine Learning & Time-Series Models**
   - **Auto-Ensemble**: Inverse-variance weighted combination of all models.
   - **Linear Trend Regression (OLS)**: Closed-form covariance with studentized confidence intervals.
   - **Random Forest Regressor**: Pure Python ensemble with recursive binary splitting, lag features, rolling momentum, and bagging.
   - **Holt-Winters Exponential Smoothing**: Level, trend, and damping factor optimization.
   - **Holdout Validation Metrics**: Rigorous 80/20 train/test evaluation reporting MAE, RMSE, MAPE, $R^2$, and Directional Accuracy.

5. **C++ and DSA Forecasting Core**
   - Contiguous memory time-series buffer (`std::vector`).
   - Chronological sorting using Introsort / Quicksort ($O(N \log N)$).
   - Binary Search ($O(\log N)$) nearest-neighbor date lookups.
   - Priority queue rolling median filters for outlier suppression.
   - Exponential trend forecasting with Python fallback bridge.

---

## Directory Structure

```
├── backend/
│   ├── cpp_engine/              # C++ DSA Forecasting Engine
│   │   ├── forecast_engine.h    # DSA Header
│   │   ├── forecast_engine.cpp  # Engine Implementation & CLI
│   │   ├── Makefile             # C++ Build configuration
│   │   └── CMakeLists.txt       # CMake build file
│   ├── ml/                      # Machine Learning Submodules
│   │   ├── linear_model.py      # OLS Linear Regression & CI
│   │   ├── random_forest.py     # Bagged Decision Tree Regressor
│   │   ├── exponential_smoothing.py # Holt-Winters Exponential Smoothing
│   │   ├── ensemble.py          # Auto-Ensemble Blended Model
│   │   └── evaluator.py         # Statistical evaluation (MAE, RMSE, MAPE, R2)
│   ├── models/                  # Data classes and Schemas
│   │   ├── product.py           # Product and price quote models
│   │   └── time_series.py       # Time-series dataset and validation
│   ├── routes/                  # Flask REST API and Views
│   │   ├── api.py               # REST API endpoints
│   │   └── views.py             # Server-rendered HTML view
│   ├── utilities/               # Helper utilities
│   │   ├── cpp_bridge.py        # Reliable C++ binary bridge with fallback
│   │   ├── csv_handler.py       # CSV parser, validator & exporter
│   │   └── price_api_adapter.py # Real vendor price API adapter
│   ├── app.py                   # Flask Application Factory
│   ├── wsgi.py                  # Production WSGI entry point
│   ├── cli_predict.py           # CLI invocation interface for Node/Express
│   ├── ml_engine.py             # Unified ML & DSA Forecasting Engine
│   ├── Dockerfile               # Multi-stage container build
│   ├── Procfile                 # PaaS deployment configuration
│   └── requirements.txt         # Python dependencies
├── data/
│   ├── datasets/                # Sample datasets for 5 categories
│   │   ├── iphone_15_pro.csv
│   │   ├── macbook_pro_m3.csv
│   │   └── tesla_model_3.csv
│   ├── sample_template.csv      # CSV template for user uploads
│   └── storage.py               # In-memory session store & seeders
├── docs/
│   ├── ARCHITECTURE.md          # Architectural and DSA specifications
│   ├── API_REFERENCE.md         # Complete REST API documentation
│   └── DEPLOYMENT.md            # Detailed deployment guide
├── src/                         # Modern React 19 Frontend
│   ├── components/              # Modular UI components
│   ├── types.ts                 # TypeScript type definitions
│   ├── App.tsx                  # Main Dashboard Viewport
│   └── main.tsx                 # Entry Point
├── index.html                   # HTML Entry Point
├── server.ts                    # Fullstack Node/Express bridge server
├── package.json                 # Node dependencies & scripts
└── tsconfig.json                # TypeScript configuration
```

---

## Getting Started

### 1. Run the Fullstack Web App
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 2. Run the Python Flask Backend
```bash
pip install -r backend/requirements.txt
python3 -m backend.app
```

### 3. Compile the C++ Module (Optional)
```bash
cd backend/cpp_engine
make
```

---

## GitHub Publishing

To publish this project to your GitHub account:

```bash
git remote add origin https://github.com/<your-username>/pricepredictor-ai.git
git add .
git commit -m "feat: complete PricePredictor AI platform with C++ DSA & Python ML"
git push -u origin main
```
