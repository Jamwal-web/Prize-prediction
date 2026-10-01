#!/usr/bin/env python3
"""
CLI Predict Interface for PricePredictor AI.
Invoked by Node/Express fullstack server or command line.
Reads JSON request from stdin or command line arguments, executes forecasting,
and outputs pristine JSON to stdout.
"""

import sys
import json
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.ml_engine import MLForecaster
from backend.utilities.cpp_bridge import execute_cpp_or_fallback
from backend.utilities.csv_handler import parse_and_validate_csv, export_predictions_to_csv
from backend.utilities.price_api_adapter import fetch_live_price_quote
from data.storage import get_preloaded_products

def main():
    try:
        if len(sys.argv) > 1 and sys.argv[1] == "--catalog":
            cat = get_preloaded_products()
            # Strip heavy historical timelines for catalog view
            catalog_summary = []
            for p in cat:
                catalog_summary.append({
                    "id": p["id"],
                    "name": p["name"],
                    "category": p["category"],
                    "brand": p["brand"],
                    "sku": p["sku"],
                    "description": p["description"],
                    "base_msrp": p["base_msrp"],
                    "current_price": p["current_price"],
                    "current_price_source": p["current_price_source"],
                    "current_price_timestamp": p["current_price_timestamp"],
                    "is_live_api_backed": p["is_live_api_backed"],
                    "historical_count": len(p["historical_prices"]),
                    "historical_prices": p["historical_prices"]
                })
            print(json.dumps(catalog_summary))
            return

        if len(sys.argv) > 1 and sys.argv[1] == "--live-quote":
            product_id = sys.argv[2] if len(sys.argv) > 2 else "iphone-15-pro"
            quote = fetch_live_price_quote(product_id)
            print(json.dumps(quote))
            return

        # Read JSON from stdin or argument
        if len(sys.argv) > 2 and sys.argv[1] == "--json":
            payload_str = sys.argv[2]
        else:
            payload_str = sys.stdin.read()

        if not payload_str.strip():
            print(json.dumps({"error": "Empty input payload"}))
            sys.exit(1)

        data = json.loads(payload_str)
        action = data.get("action", "predict")

        if action == "parse_csv":
            content = data.get("csv_content", "")
            success, points, err = parse_and_validate_csv(content)
            if not success:
                print(json.dumps({"status": "error", "error": err}))
            else:
                print(json.dumps({
                    "status": "success",
                    "points_count": len(points),
                    "start_date": points[0]["date"],
                    "end_date": points[-1]["date"],
                    "latest_price": points[-1]["price"],
                    "historical_prices": points
                }))
            return

        # Action: predict
        points = data.get("historical_prices", [])
        product_id = data.get("product_id")
        algorithm = data.get("algorithm", "ensemble")
        horizon_days = int(data.get("horizon_days", 30))

        if not points and product_id:
            all_prods = {p["id"]: p for p in get_preloaded_products()}
            if product_id in all_prods:
                points = all_prods[product_id]["historical_prices"]

        if not points or len(points) < 3:
            print(json.dumps({"error": "At least 3 historical price points are required"}))
            return

        if algorithm == "cpp_engine":
            result = execute_cpp_or_fallback(points, horizon_days=horizon_days)
        else:
            forecaster = MLForecaster(points)
            result = forecaster.forecast(algorithm=algorithm, horizon_days=horizon_days)

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": f"CLI error: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
