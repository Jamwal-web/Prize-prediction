"""
CSV import and export utilities for historical prices and forecasts.
"""

import csv
import io
import datetime
from typing import List, Dict, Any, Tuple

def parse_and_validate_csv(csv_content: str) -> Tuple[bool, List[Dict[str, Any]], str]:
    """
    Parses raw CSV string, extracts date & price columns, validates formats,
    and returns (success, list_of_points, error_message).
    """
    try:
        f = io.StringIO(csv_content.strip())
        reader = csv.reader(f)
        rows = list(reader)
        if not rows:
            return False, [], "The uploaded CSV file is empty."

        header = [col.strip().lower() for col in rows[0]]
        date_idx = -1
        price_idx = -1
        source_idx = -1

        for i, col in enumerate(header):
            if any(k in col for k in ["date", "timestamp", "time", "day"]):
                date_idx = i
            elif any(k in col for k in ["price", "cost", "value", "rate", "amount", "usd"]):
                price_idx = i
            elif any(k in col for k in ["source", "vendor", "store", "origin"]):
                source_idx = i

        # Fallback if no header recognized
        if date_idx == -1 or price_idx == -1:
            if len(rows[0]) >= 2:
                date_idx = 0
                price_idx = 1
                start_row = 1 if not rows[0][0].replace("-", "").isdigit() else 0
            else:
                return False, [], "CSV must contain at least two columns: 'Date' and 'Price'."
        else:
            start_row = 1

        parsed_points = []
        for r_num, row in enumerate(rows[start_row:], start=start_row + 1):
            if not row or len(row) <= max(date_idx, price_idx):
                continue
            raw_date = row[date_idx].strip()
            raw_price = row[price_idx].strip().replace("$", "").replace("€", "").replace("£", "").replace(",", "")

            if not raw_date or not raw_price:
                continue

            # Parse date
            dt = None
            for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y", "%d/%m/%Y", "%m-%d-%Y", "%Y.%m.%d"]:
                try:
                    dt = datetime.datetime.strptime(raw_date, fmt).date()
                    break
                except ValueError:
                    continue

            if dt is None:
                continue

            try:
                price_val = float(raw_price)
                if price_val <= 0:
                    continue
            except ValueError:
                continue

            src = row[source_idx].strip() if source_idx != -1 and len(row) > source_idx and row[source_idx].strip() else "User Uploaded CSV"

            parsed_points.append({
                "date": dt.strftime("%Y-%m-%d"),
                "price": round(price_val, 2),
                "source": src,
                "is_live_verified": False
            })

        if len(parsed_points) < 3:
            return False, [], f"Uploaded CSV contained only {len(parsed_points)} valid price records. Minimum 3 points required for prediction."

        # Sort and deduplicate by date
        parsed_points.sort(key=lambda x: x["date"])
        deduped = {}
        for p in parsed_points:
            deduped[p["date"]] = p  # keeps latest entry for same date
        final_points = list(deduped.values())
        final_points.sort(key=lambda x: x["date"])

        return True, final_points, ""

    except Exception as e:
        return False, [], f"CSV Parsing Error: {str(e)}"

def export_predictions_to_csv(historical_points: List[Dict[str, Any]], forecasts: List[Dict[str, Any]], product_name: str = "Product") -> str:
    """Generates complete CSV text combining historical timeline and forecasted curve."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Product",
        "Record Type",
        "Date",
        "Historical Price (USD)",
        "Predicted Price (USD)",
        "Lower Bound 95% CI (USD)",
        "Upper Bound 95% CI (USD)",
        "Data Source"
    ])

    for hp in historical_points:
        writer.writerow([
            product_name,
            "Historical",
            hp.get("date", ""),
            hp.get("price", ""),
            "",
            "",
            "",
            hp.get("source", "Historical Dataset")
        ])

    for fc in forecasts:
        writer.writerow([
            product_name,
            "Forecast",
            fc.get("date", ""),
            "",
            fc.get("predicted_price", ""),
            fc.get("lower_bound_95", ""),
            fc.get("upper_bound_95", ""),
            "PricePredictor AI Forecast Engine"
        ])

    return output.getvalue()
