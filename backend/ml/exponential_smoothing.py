"""
Holt-Winters Double Exponential Smoothing with Trend & Damping.
Includes grid search for optimal alpha (level) and beta (trend) smoothing parameters.
"""

import math
import datetime
import statistics
from typing import List, Dict, Any
from .evaluator import evaluate_holdout_test

class HoltWintersModel:
    def __init__(self):
        self.alpha = 0.35
        self.beta = 0.1
        self.damping = 0.98

    def fit_and_predict(self, dates: List[datetime.date], prices: List[float], horizon_days: int) -> Dict[str, Any]:
        n = len(prices)
        test_size = max(2, int(n * 0.2))
        train_size = n - test_size

        train_prices = prices[:train_size]
        test_prices = prices[train_size:]

        # Grid search on train set to find best alpha and beta
        best_a, best_b = 0.35, 0.1
        min_sse = float('inf')

        for a in [0.15, 0.3, 0.5, 0.7]:
            for b in [0.05, 0.1, 0.2, 0.3]:
                l = train_prices[0]
                t = train_prices[1] - train_prices[0] if len(train_prices) > 1 else 0.0
                sse = 0.0
                for i in range(1, len(train_prices)):
                    y = train_prices[i]
                    pred = l + t
                    sse += (y - pred) ** 2
                    new_l = a * y + (1.0 - a) * (l + t)
                    new_t = b * (new_l - l) + (1.0 - b) * t
                    l, t = new_l, new_t
                if sse < min_sse:
                    min_sse = sse
                    best_a, best_b = a, b

        self.alpha, self.beta = best_a, best_b

        # Evaluate on test set
        l_eval = train_prices[0]
        t_eval = train_prices[1] - train_prices[0] if len(train_prices) > 1 else 0.0
        for i in range(1, len(train_prices)):
            y = train_prices[i]
            new_l = self.alpha * y + (1.0 - self.alpha) * (l_eval + t_eval)
            new_t = self.beta * (new_l - l_eval) + (1.0 - self.beta) * t_eval
            l_eval, t_eval = new_l, new_t

        test_preds = [l_eval + h * t_eval for h in range(1, test_size + 1)]
        metrics = evaluate_holdout_test(test_prices, test_preds, train_size, test_size)

        # Full fit for future inference
        l_full = prices[0]
        t_full = prices[1] - prices[0] if len(prices) > 1 else 0.0
        residuals = []

        for i in range(1, n):
            y = prices[i]
            pred = l_full + t_full
            residuals.append(y - pred)
            new_l = self.alpha * y + (1.0 - self.alpha) * (l_full + t_full)
            new_t = self.beta * (new_l - l_full) + (1.0 - self.beta) * t_full
            l_full, t_full = new_l, new_t

        se = statistics.stdev(residuals) if len(residuals) > 1 else 15.0

        step_count = 7 if horizon_days <= 7 else (15 if horizon_days <= 30 else (18 if horizon_days <= 90 else 24))
        last_d = dates[-1]
        forecasts = []

        for step in range(1, step_count + 1):
            offset = int(round(step * horizon_days / step_count))
            fut_d = last_d + datetime.timedelta(days=offset)
            damp = self.damping ** offset
            pred = l_full + (offset * t_full * damp)
            pred = max(pred, prices[-1] * 0.2)

            margin = 1.96 * se * math.sqrt(1.0 + offset / 25.0)

            forecasts.append({
                "date": fut_d.strftime("%Y-%m-%d"),
                "predicted_price": round(pred, 2),
                "lower_bound_95": round(max(0.0, pred - margin), 2),
                "upper_bound_95": round(pred + margin, 2)
            })

        latest_price = prices[-1]
        final_pred = forecasts[-1]["predicted_price"]
        expected_change = round(final_pred - latest_price, 2)
        expected_pct = round((expected_change / latest_price) * 100.0, 2)

        return {
            "algorithm": "Holt-Winters Double Exponential Smoothing",
            "algorithm_id": "holt_winters",
            "forecasts": forecasts,
            "metrics": metrics,
            "expected_change_val": expected_change,
            "expected_change_pct": expected_pct,
            "dsa_features_used": [
                "Dynamic State Variables Maintenance (Level, Trend)",
                "Damped Trend Progression to prevent runaway extrapolation",
                "Sliding Residual Standard Error Envelope"
            ]
        }
