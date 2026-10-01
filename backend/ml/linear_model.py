"""
Linear Trend Regression Model with 95% Statistical Confidence Intervals.
Uses Ordinary Least Squares (OLS) closed-form calculation.
"""

import math
import datetime
import statistics
from typing import List, Dict, Any
from .evaluator import evaluate_holdout_test

class LinearTrendModel:
    def __init__(self):
        self.slope = 0.0
        self.intercept = 0.0
        self.residuals_stdev = 1.0
        self.mean_x = 0.0
        self.var_x = 1.0
        self.start_date = None
        self.n_samples = 0

    def fit_and_predict(self, dates: List[datetime.date], prices: List[float], horizon_days: int) -> Dict[str, Any]:
        self.n_samples = len(prices)
        self.start_date = dates[0]
        x_all = [(d - self.start_date).days for d in dates]
        y_all = prices

        # Train / Test split (80/20 holdout)
        test_size = max(2, int(self.n_samples * 0.2))
        train_size = self.n_samples - test_size

        x_train, y_train = x_all[:train_size], y_all[:train_size]
        x_test, y_test = x_all[train_size:], y_all[train_size:]

        # Train on split for evaluation
        m_xt = statistics.mean(x_train)
        m_yt = statistics.mean(y_train)
        cov_t = sum((x - m_xt) * (y - m_yt) for x, y in zip(x_train, y_train))
        var_t = sum((x - m_xt) ** 2 for x in x_train)
        slope_t = cov_t / var_t if var_t > 0 else 0.0
        intercept_t = m_yt - slope_t * m_xt

        test_preds = [intercept_t + slope_t * x for x in x_test]
        metrics = evaluate_holdout_test(y_test, test_preds, train_size, test_size)

        # Full fit for future inference
        self.mean_x = statistics.mean(x_all)
        mean_y = statistics.mean(y_all)
        cov_xy = sum((x - self.mean_x) * (y - mean_y) for x, y in zip(x_all, y_all))
        self.var_x = sum((x - self.mean_x) ** 2 for x in x_all)
        self.slope = cov_xy / self.var_x if self.var_x > 0 else 0.0
        self.intercept = mean_y - self.slope * self.mean_x

        fitted = [self.intercept + self.slope * x for x in x_all]
        residuals = [y - f for y, f in zip(y_all, fitted)]
        self.residuals_stdev = statistics.stdev(residuals) if len(residuals) > 1 else 10.0

        # Step count based on horizon
        step_count = 7 if horizon_days <= 7 else (15 if horizon_days <= 30 else (18 if horizon_days <= 90 else 24))
        last_d = dates[-1]
        forecasts = []

        for step in range(1, step_count + 1):
            offset = int(round(step * horizon_days / step_count))
            fut_d = last_d + datetime.timedelta(days=offset)
            fut_x = (fut_d - self.start_date).days
            pred = self.intercept + self.slope * fut_x
            pred = max(pred, prices[-1] * 0.15)

            # 95% Confidence Interval for OLS
            h_weight = math.sqrt(1.0 + 1.0/self.n_samples + ((fut_x - self.mean_x)**2)/self.var_x) if self.var_x > 0 else 1.5
            ci_margin = 1.96 * self.residuals_stdev * h_weight

            forecasts.append({
                "date": fut_d.strftime("%Y-%m-%d"),
                "predicted_price": round(pred, 2),
                "lower_bound_95": round(max(0.0, pred - ci_margin), 2),
                "upper_bound_95": round(pred + ci_margin, 2)
            })

        latest_price = prices[-1]
        final_pred = forecasts[-1]["predicted_price"]
        expected_change = round(final_pred - latest_price, 2)
        expected_pct = round((expected_change / latest_price) * 100.0, 2)

        return {
            "algorithm": "Linear Trend Regression (OLS)",
            "algorithm_id": "linear",
            "forecasts": forecasts,
            "metrics": metrics,
            "expected_change_val": expected_change,
            "expected_change_pct": expected_pct,
            "dsa_features_used": [
                "Closed-form Covariance Accumulation",
                "O(1) Evaluation against Time Vector",
                "Statistical 95% Confidence Band Geometry"
            ]
        }
