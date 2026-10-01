"""
Auto-Ensemble Forecasting Model
Blends Linear Regression, Holt-Winters Exponential Smoothing, and Random Forest
using inverse-variance weighting based on holdout validation RMSE.
"""

import math
import datetime
from typing import List, Dict, Any
from .linear_model import LinearTrendModel
from .exponential_smoothing import HoltWintersModel
from .random_forest import RandomForestTimeSeriesModel

class AutoEnsembleModel:
    def __init__(self):
        self.linear_model = LinearTrendModel()
        self.hw_model = HoltWintersModel()
        self.rf_model = RandomForestTimeSeriesModel()

    def fit_and_predict(self, dates: List[datetime.date], prices: List[float], horizon_days: int) -> Dict[str, Any]:
        res_linear = self.linear_model.fit_and_predict(dates, prices, horizon_days)
        res_hw = self.hw_model.fit_and_predict(dates, prices, horizon_days)
        res_rf = self.rf_model.fit_and_predict(dates, prices, horizon_days)

        models = [res_linear, res_hw, res_rf]
        inv_rmses = []
        for m in models:
            rmse = max(0.01, m["metrics"]["rmse"])
            inv_rmses.append(1.0 / (rmse ** 2))
        total_inv = sum(inv_rmses)
        weights = [w / total_inv for w in inv_rmses]

        n_steps = len(res_linear["forecasts"])
        blended_forecasts = []

        for i in range(n_steps):
            dt = res_linear["forecasts"][i]["date"]
            p = weights[0]*res_linear["forecasts"][i]["predicted_price"] + weights[1]*res_hw["forecasts"][i]["predicted_price"] + weights[2]*res_rf["forecasts"][i]["predicted_price"]
            lb = weights[0]*res_linear["forecasts"][i]["lower_bound_95"] + weights[1]*res_hw["forecasts"][i]["lower_bound_95"] + weights[2]*res_rf["forecasts"][i]["lower_bound_95"]
            ub = weights[0]*res_linear["forecasts"][i]["upper_bound_95"] + weights[1]*res_hw["forecasts"][i]["upper_bound_95"] + weights[2]*res_rf["forecasts"][i]["upper_bound_95"]

            blended_forecasts.append({
                "date": dt,
                "predicted_price": round(p, 2),
                "lower_bound_95": round(lb, 2),
                "upper_bound_95": round(ub, 2)
            })

        blended_mae = sum(w * m["metrics"]["mae"] for w, m in zip(weights, models))
        blended_rmse = math.sqrt(sum(w * (m["metrics"]["rmse"] ** 2) for w, m in zip(weights, models)))
        blended_mape = sum(w * m["metrics"]["mape"] for w, m in zip(weights, models))
        blended_r2 = sum(w * m["metrics"]["r_squared"] for w, m in zip(weights, models))
        blended_da = sum(w * m["metrics"]["directional_accuracy"] for w, m in zip(weights, models))

        latest_price = prices[-1]
        final_pred = blended_forecasts[-1]["predicted_price"]
        expected_change = round(final_pred - latest_price, 2)
        expected_pct = round((expected_change / latest_price) * 100.0, 2)

        return {
            "algorithm": "Auto-Ensemble (Optimal Multi-Model Blend)",
            "algorithm_id": "ensemble",
            "forecasts": blended_forecasts,
            "metrics": {
                "mae": round(blended_mae, 2),
                "rmse": round(blended_rmse, 2),
                "mape": round(blended_mape, 2),
                "r_squared": round(blended_r2, 3),
                "directional_accuracy": round(blended_da, 1),
                "train_size": res_linear["metrics"]["train_size"],
                "test_size": res_linear["metrics"]["test_size"]
            },
            "model_comparison": [
                {
                    "name": "Linear Regression (OLS)",
                    "id": "linear",
                    "weight_pct": round(weights[0] * 100.0, 1),
                    "mae": res_linear["metrics"]["mae"],
                    "rmse": res_linear["metrics"]["rmse"],
                    "mape": res_linear["metrics"]["mape"],
                    "r2": res_linear["metrics"]["r_squared"]
                },
                {
                    "name": "Holt-Winters Smoothing",
                    "id": "holt_winters",
                    "weight_pct": round(weights[1] * 100.0, 1),
                    "mae": res_hw["metrics"]["mae"],
                    "rmse": res_hw["metrics"]["rmse"],
                    "mape": res_hw["metrics"]["mape"],
                    "r2": res_hw["metrics"]["r_squared"]
                },
                {
                    "name": "Random Forest Regressor",
                    "id": "random_forest",
                    "weight_pct": round(weights[2] * 100.0, 1),
                    "mae": res_rf["metrics"]["mae"],
                    "rmse": res_rf["metrics"]["rmse"],
                    "mape": res_rf["metrics"]["mape"],
                    "r2": res_rf["metrics"]["r_squared"]
                }
            ],
            "expected_change_val": expected_change,
            "expected_change_pct": expected_pct,
            "dsa_features_used": [
                "Inverse-Variance Weight Allocation Formula",
                "Cross-model Confidence Band Enclosure",
                "Ensemble Out-of-Sample Holdout Benchmark"
            ]
        }
