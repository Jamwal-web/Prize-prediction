# PricePredictor AI - Deployment & Setup Guide

This guide covers local development, C++ compilation, and zero-cost cloud deployment (Render, Railway, Fly.io, Hugging Face Spaces).

---

## 1. Quick Start (Local Fullstack)

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- (Optional) `g++` or `clang++` (C++17 standard)

### Installation
```bash
# 1. Clone repository
git clone <your-repo-url>
cd pricepredictor-ai

# 2. Install Node dependencies
npm install

# 3. (Optional) Compile C++ DSA Forecasting Engine
cd backend/cpp_engine
make
# or: g++ -O3 -std=c++17 forecast_engine.cpp -o forecast_engine
cd ../..

# 4. Start Fullstack Application
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Python Flask Backend Mode

If you prefer running pure Python/Flask:

```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install Python dependencies
pip install -r backend/requirements.txt

# 3. Start Flask dev server
python3 -m backend.app
# Server listens at http://localhost:5000
```

---

## 3. Free Hosting Deployment Options

### A. Deploy to Render (Web Service - Free Tier)
1. Push your repository to GitHub.
2. Log in to [Render.com](https://render.com) and click **New > Web Service**.
3. Connect your GitHub repository.
4. Settings:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt && cd backend/cpp_engine && make || true`
   - **Start Command**: `gunicorn backend.wsgi:app --bind 0.0.0.0:$PORT`
5. Click **Create Web Service**.

### B. Deploy using Docker
A production multi-stage `Dockerfile` is included in `backend/Dockerfile`:
```bash
docker build -f backend/Dockerfile -t pricepredictor-ai .
docker run -p 5000:5000 pricepredictor-ai
```

### C. Deploy to Railway or Fly.io
The included `backend/Procfile` is automatically detected by Railway, Heroku, and Fly.io:
```
web: gunicorn backend.wsgi:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120
```

---

## 4. External Price APIs & Configuration

The application works 100% out of the box with built-in verified vendor price feeds. To connect your own live price API or commercial scraper:

Set the following environment variables in `.env`:
```env
# Optional external live price API endpoint
PRICE_API_ENDPOINT="https://api.yourpricingprovider.com"
PRICE_API_KEY="your-api-key-here"
```

If no keys are configured, the system gracefully uses its verified registry quotes for catalog products and clearly marks custom items as user-entered without inventing live quotes.
