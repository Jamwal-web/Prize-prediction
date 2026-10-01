"""
Time series dataset management with chronological validation and gap analysis.
"""

from typing import List, Dict, Any, Tuple
import datetime
import statistics

class TimeSeriesDataset:
    def __init__(self, records: List[Dict[str, Any]]):
        self.records = self._clean_and_sort(records)

    def _clean_and_sort(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        valid = []
        for r in records:
            date_str = str(r.get("date", "")).strip()
            price_val = r.get("price")
            try:
                p = float(price_val)
                if p <= 0:
                    continue
                # Validate date format YYYY-MM-DD
                dt = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
                valid.append({
                    "date": dt.strftime("%Y-%m-%d"),
                    "price": round(p, 2),
                    "source": r.get("source", "Historical Dataset"),
                    "is_live_verified": bool(r.get("is_live_verified", False)),
                    "notes": r.get("notes")
                })
            except Exception:
                continue

        # Sort chronologically O(N log N)
        valid.sort(key=lambda x: x["date"])
        return valid

    def summary_statistics(self) -> Dict[str, Any]:
        if not self.records:
            return {
                "count": 0, "min_price": 0.0, "max_price": 0.0,
                "mean_price": 0.0, "median_price": 0.0, "volatility": 0.0
            }

        prices = [r["price"] for r in self.records]
        avg = statistics.mean(prices)
        med = statistics.median(prices)
        stdev = statistics.stdev(prices) if len(prices) > 1 else 0.0

        return {
            "count": len(prices),
            "start_date": self.records[0]["date"],
            "end_date": self.records[-1]["date"],
            "min_price": min(prices),
            "max_price": max(prices),
            "mean_price": round(avg, 2),
            "median_price": round(med, 2),
            "volatility": round(stdev, 2),
            "latest_price": prices[-1],
            "price_range": round(max(prices) - min(prices), 2)
        }

    def detect_date_gaps(self, max_gap_days: int = 14) -> List[Dict[str, Any]]:
        """Identify intervals where data points have significant gaps."""
        gaps = []
        for i in range(len(self.records) - 1):
            d1 = datetime.datetime.strptime(self.records[i]["date"], "%Y-%m-%d").date()
            d2 = datetime.datetime.strptime(self.records[i+1]["date"], "%Y-%m-%d").date()
            delta = (d2 - d1).days
            if delta > max_gap_days:
                gaps.append({
                    "from_date": str(d1),
                    "to_date": str(d2),
                    "gap_days": delta
                })
        return gaps
