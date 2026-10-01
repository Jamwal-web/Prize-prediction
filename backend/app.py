"""
Flask Application Factory for PricePredictor AI.
"""

import os
from flask import Flask
from .routes.api import api_bp
from .routes.views import views_bp

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "pricepredictor-ai-secure-secret-key-2026"),
        JSON_SORT_KEYS=False
    )

    if test_config is not None:
        app.config.update(test_config)

    # Register blueprints
    app.register_blueprint(api_bp)
    app.register_blueprint(views_bp)

    # Enable CORS headers for API endpoints
    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        return response

    return app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app = create_app()
    print(f"[*] PricePredictor AI Flask Server listening on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
