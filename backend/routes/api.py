"""
API Blueprint for PricePredictor AI.
Exposes RESTful endpoints for catalog browsing, real price API retrieval,
CSV parsing, and Python/C++ DSA machine learning forecasts.
"""

from flask import Blueprint, request, jsonify, Response
from ..ml_engine import MLForecaster
from ..utilities.cpp_bridge import execute_cpp_or_fallback, is_cpp_binary_available
from ..utilities.csv_handler import parse_and_validate_csv, export_predictions_to_csv
from ..utilities.price_api_adapter import fetch_live_price_quote
from ...data.storage import get_preloaded_products

api_bp = Blueprint("api", __name__, url_prefix="/api")

# In-memory session catalog
PRODUCTS_CATALOG = get_preloaded_products()
PRODUCTS_DICT = {p["id"]: p for p in PRODUCTS_CATALOG}

@api_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "PricePredictor AI Backend",
        "cpp_engine_available": is_cpp_binary_available(),
        "total_catalog_products": len(PRODUCTS_DICT)
    })

@api_bp.route("/engine-status", methods=["GET"])
def engine_status():
    cpp_avail = is_cpp_binary_available()
    return jsonify({
        "cpp_engine_available": cpp_avail,
        "engine_label": "C++ Native DSA Core" if cpp_avail else "Python DSA High-Performance Fallback",
        "algorithms_supported": [
            {"id": "ensemble", "name": "Auto-Ensemble (Optimal Multi-Model Blend)", "default": True},
            {"id": "cpp_engine", "name": "C++ DSA Forecasting Engine (Holt-Winters)", "native": cpp_avail},
            {"id": "holt_winters", "name": "Holt-Winters Exponential Smoothing", "native": False},
            {"id": "linear", "name": "Ordinary Least Squares (OLS) Linear Regression", "native": False},
            {"id": "random_forest", "name": "Random Forest Regressor (Decision Tree Ensemble)", "native": False}
        ],
        "horizons_supported": [
            {"days": 7, "label": "7 Days (Short-term)"},
            {"days": 30, "label": "30 Days (Monthly)"},
            {"days": 90, "label": "3 Months / 90 Days (Quarterly)"},
            {"days": 180, "label": "6 Months / 180 Days (Long-term)"}
        ]
    })

@api_bp.route("/products", methods=["GET"])
def list_products():
    category = request.args.get("category")
    results = []
    for p in PRODUCTS_DICT.values():
        if category and category != "all" and p["category"] != category:
            continue
        # Send lightweight card representation
        results.append({
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
            "historical_count": len(p["historical_prices"])
        })
    return jsonify(results)

@api_bp.route("/products/<product_id>", methods=["GET"])
def get_product(product_id):
    if product_id not in PRODUCTS_DICT:
        return jsonify({"error": f"Product with ID '{product_id}' not found."}), 404
    return jsonify(PRODUCTS_DICT[product_id])

@api_bp.route("/current-price/<product_id>", methods=["GET"])
def get_current_price(product_id):
    prod = PRODUCTS_DICT.get(product_id)
    quote = fetch_live_price_quote(product_id, prod)
    return jsonify(quote)

@api_bp.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "Missing JSON request body."}), 400

        product_id = data.get("product_id")
        points = data.get("historical_prices")
        algorithm = data.get("algorithm", "ensemble")
        horizon_days = int(data.get("horizon_days", 30))

        # Horizon validation
        if horizon_days not in [7, 30, 90, 180]:
            if horizon_days <= 10:
                horizon_days = 7
            elif horizon_days <= 45:
                horizon_days = 30
            elif horizon_days <= 120:
                horizon_days = 90
            else:
                horizon_days = 180

        # If points not directly supplied, grab from catalog product
        if not points and product_id and product_id in PRODUCTS_DICT:
            points = PRODUCTS_DICT[product_id]["historical_prices"]

        if not points or len(points) < 3:
            return jsonify({"error": "A minimum of 3 historical price points is required to calculate predictions."}), 400

        # If C++ Engine requested
        if algorithm == "cpp_engine":
            result = execute_cpp_or_fallback(points, horizon_days=horizon_days)
            return jsonify(result)

        # Python ML Engine
        forecaster = MLForecaster(points)
        result = forecaster.forecast(algorithm=algorithm, horizon_days=horizon_days)
        return jsonify(result)

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Forecasting calculation error: {str(e)}"}), 500

@api_bp.route("/upload-csv", methods=["POST"])
def upload_csv():
    """Validates and parses raw CSV string."""
    try:
        if "file" in request.files:
            file = request.files["file"]
            content = file.read().decode("utf-8", errors="ignore")
        else:
            data = request.get_json(silent=True) or {}
            content = data.get("csv_content", "")

        if not content:
            return jsonify({"error": "No CSV content provided."}), 400

        success, points, err = parse_and_validate_csv(content)
        if not success:
            return jsonify({"error": err}), 400

        return jsonify({
            "status": "success",
            "points_count": len(points),
            "start_date": points[0]["date"],
            "end_date": points[-1]["date"],
            "latest_price": points[-1]["price"],
            "historical_prices": points
        })

    except Exception as e:
        return jsonify({"error": f"Failed to process CSV file: {str(e)}"}), 500

@api_bp.route("/export-csv", methods=["POST"])
def export_csv():
    try:
        data = request.get_json(force=True) or {}
        historical = data.get("historical_prices", [])
        forecasts = data.get("forecasts", [])
        product_name = data.get("product_name", "PricePredictor_Analysis")

        csv_text = export_predictions_to_csv(historical, forecasts, product_name)
        filename = f"{product_name.lower().replace(' ', '_')}_forecast.csv"

        return Response(
            csv_text,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment;filename={filename}"}
        )
    except Exception as e:
        return jsonify({"error": f"Export failed: {str(e)}"}), 500
