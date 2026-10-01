#ifndef FORECAST_ENGINE_H
#define FORECAST_ENGINE_H

#include <string>
#include <vector>
#include <map>
#include <queue>
#include <chrono>

namespace dsa_forecast {

// Core Data Structures
struct PricePoint {
    std::string date;     // YYYY-MM-DD
    double price;         // Numeric price in USD
    long long timestamp;  // Epoch seconds for fast numeric comparison
};

struct ForecastResult {
    std::string date;
    double predicted_price;
    double lower_bound_95;
    double upper_bound_95;
};

struct ModelMetrics {
    double mae;
    double rmse;
    double mape;
    double r_squared;
    int train_size;
    int test_size;
};

struct EngineOutput {
    std::string engine_type;
    std::string algorithm;
    std::vector<ForecastResult> forecasts;
    ModelMetrics metrics;
    double execution_time_ms;
    std::string recommendation;
    double expected_change_val;
    double expected_change_pct;
    std::vector<std::string> dsa_features_used;
};

// DSA Forecast Engine Class
class ForecastEngine {
public:
    ForecastEngine();
    
    // Core DSA Operations
    void addPoint(const std::string& date, double price);
    void clear();
    void sortPointsChronologically(); // Uses custom Quicksort comparator
    
    // Binary search to find nearest point by timestamp (O(log n))
    int binarySearchNearestDate(long long target_timestamp) const;
    
    // Sliding window median filter for outlier rejection using two priority queues (Heaps)
    std::vector<double> calculateRollingMedian(int window_size) const;
    
    // Exponentially Weighted Moving Average (EWMA) using std::vector
    std::vector<double> calculateEWMA(double alpha) const;
    
    // Holt's Double Exponential Smoothing with trend (DSA Implementation)
    EngineOutput forecastHoltWinters(int horizon_days);
    
    // Linear Regression with closed-form covariance
    EngineOutput forecastLinearRegression(int horizon_days);

private:
    std::vector<PricePoint> points;
    std::map<int, double> dayOfWeekSeasonalFactors; // std::map for seasonal indices
    
    long long parseDateToTimestamp(const std::string& date_str) const;
    std::string formatTimestampToDate(long long ts) const;
};

} // namespace dsa_forecast

#endif // FORECAST_ENGINE_H
