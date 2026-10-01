"""
Views Blueprint for direct Flask web rendering.
"""

from flask import Blueprint, jsonify, render_template_string

views_bp = Blueprint("views", __name__)

INDEX_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PricePredictor AI - Flask Service</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
        .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 8px; padding: 1.5rem; margin-top: 1.5rem; }
        h1 { color: #60a5fa; margin-top: 0; }
        code { background: #1e293b; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        .badge { display: inline-block; background: #10b981; color: #042f2e; font-weight: 600; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
    </style>
</head>
<body>
    <h1>PricePredictor AI - Flask API & Forecasting Service</h1>
    <span class="badge">Operational</span>
    <p>This Python/Flask service powers the machine learning and DSA time-series forecasting engine.</p>
    
    <div class="card">
        <h3>API Endpoints</h3>
        <ul>
            <li><code>GET /api/products</code> - List catalog items with historical records</li>
            <li><code>GET /api/products/&lt;id&gt;</code> - Product details and time-series</li>
            <li><code>POST /api/predict</code> - Run prediction (Auto-Ensemble, C++ DSA, OLS, Random Forest)</li>
            <li><code>GET /api/current-price/&lt;id&gt;</code> - Real verified retail price adapter</li>
            <li><code>POST /api/upload-csv</code> - Parse and validate custom price dataset</li>
            <li><code>POST /api/export-csv</code> - Download merged historical and prediction CSV</li>
            <li><code>GET /api/engine-status</code> - Diagnostic check on C++ and Python engines</li>
        </ul>
    </div>
</body>
</html>
"""

@views_bp.route("/", methods=["GET"])
def index():
    return render_template_string(INDEX_TEMPLATE)
