"""
Random Forest Regressor for non-linear time-series forecasting.
Ensemble of decision trees trained on bootstrap samples with feature subsampling.
"""

import math
import datetime
import statistics
import random
from typing import List, Dict, Any
from .evaluator import evaluate_holdout_test

class SimpleDecisionTree:
    def __init__(self, max_depth=4, min_samples_leaf=2):
        self.max_depth = max_depth
        self.min_samples_leaf = min_samples_leaf
        self.tree = None

    def fit(self, X, y, depth=0):
        if len(y) <= self.min_samples_leaf or depth >= self.max_depth:
            self.tree = {"leaf": True, "value": statistics.mean(y) if y else 0.0}
            return self

        best_feat = None
        best_thresh = None
        best_var_red = -1.0
        n = len(y)
        current_var = statistics.variance(y) if n > 1 else 0.0

        n_features = len(X[0])
        feat_subset = random.sample(range(n_features), max(1, int(math.sqrt(n_features)) + 1))

        for feat_idx in feat_subset:
            vals = sorted(list(set(row[feat_idx] for row in X)))
            if len(vals) <= 1:
                continue
            if len(vals) > 10:
                step = len(vals) // 10
                vals = [vals[k] for k in range(0, len(vals), step)][:10]
            for i in range(len(vals) - 1):
                thresh = (vals[i] + vals[i + 1]) / 2.0
                left_y = [y[j] for j in range(n) if X[j][feat_idx] <= thresh]
                right_y = [y[j] for j in range(n) if X[j][feat_idx] > thresh]

                if len(left_y) < self.min_samples_leaf or len(right_y) < self.min_samples_leaf:
                    continue

                var_l = statistics.variance(left_y) if len(left_y) > 1 else 0.0
                var_r = statistics.variance(right_y) if len(right_y) > 1 else 0.0
                var_red = current_var - (len(left_y)/n * var_l + len(right_y)/n * var_r)

                if var_red > best_var_red:
                    best_var_red = var_red
                    best_feat = feat_idx
                    best_thresh = thresh

        if best_feat is None:
            self.tree = {"leaf": True, "value": statistics.mean(y)}
            return self

        left_X, left_y, right_X, right_y = [], [], [], []
        for j in range(n):
            if X[j][best_feat] <= best_thresh:
                left_X.append(X[j])
                left_y.append(y[j])
            else:
                right_X.append(X[j])
                right_y.append(y[j])

        left_sub = SimpleDecisionTree(self.max_depth, self.min_samples_leaf).fit(left_X, left_y, depth + 1)
        right_sub = SimpleDecisionTree(self.max_depth, self.min_samples_leaf).fit(right_X, right_y, depth + 1)

        self.tree = {
            "leaf": False,
            "feature": best_feat,
            "threshold": best_thresh,
            "left": left_sub,
            "right": right_sub,
            "value": statistics.mean(y)
        }
        return self

    def predict_one(self, node, x):
        if node["leaf"]:
            return node["value"]
        if x[node["feature"]] <= node["threshold"]:
            return self.predict_one(node["left"].tree, x)
        else:
            return self.predict_one(node["right"].tree, x)

    def predict(self, X):
        return [self.predict_one(self.tree, row) for row in X]

class RandomForestTimeSeriesModel:
    def __init__(self, n_estimators=16, max_depth=4):
        self.n_estimators = n_estimators
        self.max_depth = max_depth

    def _extract_features(self, dates, prices):
        X, y = [], []
        start_d = dates[0]
        for i in range(1, len(prices)):
            d = dates[i]
            days = (d - start_d).days
            dow = d.weekday()
            dom = d.day
            lag_1 = prices[i - 1]
            lag_7 = prices[max(0, i - 7)]
            window = prices[max(0, i - 14):i]
            roll_mean = sum(window) / len(window)
            momentum = lag_1 / roll_mean if roll_mean > 0 else 1.0

            X.append([float(days), float(dow), float(dom), float(lag_1), float(lag_7), float(roll_mean), float(momentum)])
            y.append(prices[i])
        return X, y

    def fit_and_predict(self, dates: List[datetime.date], prices: List[float], horizon_days: int) -> Dict[str, Any]:
        random.seed(42)
        X_all, y_all = self._extract_features(dates, prices)
        
        test_size = max(2, int(len(prices) * 0.2))
        train_size = len(prices) - test_size
        split_idx = max(2, len(X_all) - test_size)

        X_train, y_train = X_all[:split_idx], y_all[:split_idx]
        X_test, y_test = X_all[split_idx:], y_all[split_idx:]

        # Fit on train for holdout metrics
        trees_eval = []
        for _ in range(self.n_estimators):
            sample_indices = [random.randint(0, len(X_train) - 1) for _ in range(len(X_train))]
            sub_X = [X_train[k] for k in sample_indices]
            sub_y = [y_train[k] for k in sample_indices]
            t = SimpleDecisionTree(max_depth=self.max_depth, min_samples_leaf=2)
            t.fit(sub_X, sub_y)
            trees_eval.append(t)

        test_preds = []
        for row in X_test:
            vals = [tree.predict_one(tree.tree, row) for tree in trees_eval]
            test_preds.append(statistics.mean(vals))

        metrics = evaluate_holdout_test(y_test, test_preds, len(y_train), len(y_test))

        # Fit full ensemble
        trees_full = []
        for _ in range(self.n_estimators):
            sample_indices = [random.randint(0, len(X_all) - 1) for _ in range(len(X_all))]
            sub_X = [X_all[k] for k in sample_indices]
            sub_y = [y_all[k] for k in sample_indices]
            t = SimpleDecisionTree(max_depth=self.max_depth + 1, min_samples_leaf=2)
            t.fit(sub_X, sub_y)
            trees_full.append(t)

        fitted = []
        for row in X_all:
            vals = [tree.predict_one(tree.tree, row) for tree in trees_full]
            fitted.append(statistics.mean(vals))
        residuals = [y - f for y, f in zip(y_all, fitted)]
        se = statistics.stdev(residuals) if len(residuals) > 1 else 12.0

        # Multi-step forecasting
        step_count = 7 if horizon_days <= 7 else (15 if horizon_days <= 30 else (18 if horizon_days <= 90 else 24))
        last_d = dates[-1]
        curr_prices = list(prices)
        forecasts = []

        for step in range(1, step_count + 1):
            offset = int(round(step * horizon_days / step_count))
            fut_d = last_d + datetime.timedelta(days=offset)
            days = (fut_d - dates[0]).days
            dow = fut_d.weekday()
            dom = fut_d.day
            lag_1 = curr_prices[-1]
            lag_7 = curr_prices[max(0, len(curr_prices) - 7)]
            window = curr_prices[max(0, len(curr_prices) - 14):]
            roll_mean = sum(window) / len(window)
            momentum = lag_1 / roll_mean if roll_mean > 0 else 1.0

            feat_row = [float(days), float(dow), float(dom), float(lag_1), float(lag_7), float(roll_mean), float(momentum)]
            preds = [tree.predict_one(tree.tree, feat_row) for tree in trees_full]
            pred = max(statistics.mean(preds), prices[-1] * 0.2)
            curr_prices.append(pred)

            margin = 1.96 * se * math.sqrt(1.0 + offset / 20.0)

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
            "algorithm": "Random Forest Regressor (Decision Tree Ensemble)",
            "algorithm_id": "random_forest",
            "forecasts": forecasts,
            "metrics": metrics,
            "expected_change_val": expected_change,
            "expected_change_pct": expected_pct,
            "dsa_features_used": [
                "Bootstrap Aggregation (Bagging) sampling",
                "Recursive Binary Split Tree with variance reduction",
                "Autoregressive rolling lag vector updates"
            ]
        }
