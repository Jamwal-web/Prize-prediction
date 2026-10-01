# PricePredictor AI - System Architecture & DSA Design

## 1. High-Level Architecture Overview

PricePredictor AI combines modern web technologies with high-performance algorithms to deliver accurate, interpretable product price predictions across five major consumer sectors: Smartphones, Laptops, Cars, Electronics, and Consumer Goods.

```
+-----------------------------------------------------------------------------------+
|                            PricePredictor AI Dashboard                             |
|          (React 19 + Tailwind CSS + Lucide Icons + Tabular Numerals)              |
+-----------------------------------------------------------------------------------+
                                         |
                                         | REST / JSON API (port 3000)
                                         v
+-----------------------------------------------------------------------------------+
|                        Fullstack Server & Bridge Layer                            |
|             (Express / tsx dev middleware + Python Flask Architecture)             |
+-----------------------------------------------------------------------------------+
           |                                                   |
           v                                                   v
+-------------------------------+             +----------------------------------+
|      C++ DSA Native Core      |             |         Python ML Engine         |
|  (Introsort, Binary Search,   |<----------->|  (Auto-Ensemble, OLS Regression, |
|   Double Exp Smoothing, Heaps)|   Fallback  |   Random Forest Bagged Trees,    |
+-------------------------------+             |   Residual Variance 95% CIs)     |
                                              +----------------------------------+
                                                               |
                                                               v
                                              +----------------------------------+
                                              |       Verified Vendor API        |
                                              |   (Timestamped Live Integrations |
                                              |    Distinguished from Records)   |
                                              +----------------------------------+
```

---

## 2. C++ and Data Structures & Algorithms (DSA) Implementation

The forecasting engine in `backend/cpp_engine/` leverages fundamental computer science data structures and algorithmic paradigms:

### A. Sequential Dynamic Memory Buffers (`std::vector`)
- High spatial cache locality for consecutive time-series price points.
- Pre-allocated with `.reserve()` to achieve $O(1)$ amortized insertion.

### B. Dual-Pivot Chronological Quicksort / Introsort
- Enforces strict chronological ordering across timestamps ($O(N \log N)$ average and worst-case).
- Handles irregular sampling frequencies, out-of-order CSV uploads, and chronological normalization.

### C. Binary Search Timeline Interpolation ($O(\log N)$)
- Implemented in `binarySearchNearestDate()`.
- Locates nearest historical points for any arbitrary query date, enabling rapid gap detection and rolling feature calculation without scanning the whole list.

### D. Priority Queue Moving Median Filter (Heaps)
- Uses dual min/max priority queues for sliding window median filtering to reject transient price outliers and flash-crash anomalies.

### E. Holt-Winters Double Exponential Smoothing
- Maintains dynamic state variables:
  - Level ($L_t$): Baseline smoothed price at time $t$
  - Trend ($T_t$): Rate of price change per unit time
  - Equations:
    $$L_t = \alpha Y_t + (1 - \alpha)(L_{t-1} + T_{t-1})$$
    $$T_t = \beta (L_t - L_{t-1}) + (1 - \beta)T_{t-1}$$
    $$\hat{Y}_{t+h} = L_t + h \cdot T_t \cdot \phi^h$$
  - $\phi$ represents the damping parameter ($0.98$) preventing divergent extrapolations on long horizons (90 and 180 days).

---

## 3. Machine Learning Algorithms

### 1. Ordinary Least Squares (OLS) Linear Trend Regression
- Computes closed-form covariance and variance in $O(N)$ time.
- Employs studentized prediction standard errors for true 95% confidence intervals:
  $$\text{CI}_{95\%} = \hat{y} \pm 1.96 \cdot s_e \sqrt{1 + \frac{1}{n} + \frac{(x - \bar{x})^2}{\sum(x_i - \bar{x})^2}}$$

### 2. Random Forest Regressor (Decision Tree Ensemble)
- Bootstrap aggregation (bagging) with $B = 16$ trees.
- Recursive greedy binary variance reduction splits.
- Feature space:
  - `days_from_start` (Trend line)
  - `day_of_week` (Weekly purchase cycle effect)
  - `day_of_month` (Monthly promotional cycle effect)
  - `lag_1` & `lag_7` (Autoregressive dependencies)
  - `rolling_mean_14` (Medium-term price level)
  - `momentum` (Price to rolling mean ratio)

### 3. Auto-Ensemble Blend
- Weights models inversely to their out-of-sample holdout Mean Squared Error:
  $$w_m = \frac{\frac{1}{\text{RMSE}_m^2}}{\sum_k \frac{1}{\text{RMSE}_k^2}}$$
- Combines individual point predictions and expands confidence envelopes to represent cross-model epistemic uncertainty.

---

## 4. Model Evaluation Protocol

Every forecasting run uses a strict **80/20 chronological holdout test split**:
- **Train partition**: Earliest 80% of data points.
- **Test partition**: Most recent 20% of data points.
- Evaluated metrics:
  - **MAE** (Mean Absolute Error)
  - **RMSE** (Root Mean Squared Error)
  - **MAPE** (Mean Absolute Percentage Error %)
  - **$R^2$** (Coefficient of Determination)
  - **Directional Accuracy** (% of correct price movement directions)
