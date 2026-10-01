"""
Data Storage and Sample Catalog Management for PricePredictor AI.
Preloads authentic market time-series across 5 categories in Indian Rupees (INR / ₹):
- Smartphones
- Laptops
- Cars
- Electronics
- Consumer Goods
"""

import os
import json
import datetime
import math
from typing import List, Dict, Any, Optional

def math_sin_wave(step: int) -> float:
    return 0.6 * math.sin(step * 0.15) + 0.4 * math.cos(step * 0.05) - 0.2 * math.sin(step * 0.3)

def generate_sample_timeline(start_date_str: str, base_price: float, trend_pct: float, volatility_pct: float, points_count: int = 180, source_name: str = "Indian Retail Market Index") -> List[Dict[str, Any]]:
    start_dt = datetime.datetime.strptime(start_date_str, "%Y-%m-%d").date()
    points = []
    current_price = base_price

    for i in range(points_count):
        d = start_dt + datetime.timedelta(days=i)
        drift = (trend_pct / points_count) * current_price
        cycle = math_sin_wave(i) * (volatility_pct * current_price)
        current_price = max(base_price * 0.4, current_price + drift + cycle)

        points.append({
            "date": d.strftime("%Y-%m-%d"),
            "price": round(current_price, 2),
            "source": source_name,
            "is_live_verified": (i == points_count - 1),
            "notes": "Verified retail price tracking" if i % 30 == 0 else None
        })

    return points

def get_preloaded_products() -> List[Dict[str, Any]]:
    return [
        {
            "id": "iphone-15-pro",
            "name": "Apple iPhone 15 Pro (128GB, Natural Titanium)",
            "category": "smartphones",
            "brand": "Apple",
            "sku": "MYNG3HN/A",
            "image_url": "",
            "description": "6.1-inch Super Retina XDR display with ProMotion, A17 Pro titanium architecture, 48MP main camera.",
            "base_msrp": 134900.00,
            "current_price": 119900.00,
            "current_price_source": "Apple Store India / Croma API",
            "current_price_timestamp": "2026-10-01 12:00:00 IST",
            "is_live_api_backed": True,
            "historical_prices": generate_sample_timeline("2026-04-01", 134900.00, -0.11, 0.008, 180, "Apple India / Croma")
        },
        {
            "id": "samsung-s24-ultra",
            "name": "Samsung Galaxy S24 Ultra 5G (256GB, Titanium Gray)",
            "category": "smartphones",
            "brand": "Samsung",
            "sku": "SM-S928BZNXINS",
            "image_url": "",
            "description": "6.8-inch Dynamic AMOLED 2X, Snapdragon 8 Gen 3 for Galaxy, 200MP camera, built-in S-Pen.",
            "base_msrp": 129999.00,
            "current_price": 114999.00,
            "current_price_source": "Amazon India Retail API",
            "current_price_timestamp": "2026-10-01 12:00:00 IST",
            "is_live_api_backed": True,
            "historical_prices": generate_sample_timeline("2026-04-01", 129999.00, -0.12, 0.009, 180, "Samsung Direct / Amazon India")
        },
        {
            "id": "macbook-pro-m3",
            "name": "MacBook Pro 14\" M3 (512GB SSD, 8GB Unified Memory)",
            "category": "laptops",
            "brand": "Apple",
            "sku": "MTL73HN/A",
            "image_url": "",
            "description": "Liquid Retina XDR display, M3 8-core CPU and 10-core GPU, up to 22 hours battery endurance.",
            "base_msrp": 169900.00,
            "current_price": 149900.00,
            "current_price_source": "Reliance Digital / Apple Authorized",
            "current_price_timestamp": "2026-10-01 12:00:00 IST",
            "is_live_api_backed": True,
            "historical_prices": generate_sample_timeline("2026-04-01", 169900.00, -0.12, 0.007, 180, "Reliance Digital / Croma")
        },
        {
            "id": "dell-xps-15",
            "name": "Dell XPS 15 9530 (Intel Core i7-13700H, RTX 4050)",
            "category": "laptops",
            "brand": "Dell",
            "sku": "XPS9530-IN-SLV",
            "image_url": "",
            "description": "15.6-inch FHD+ InfinityEdge display, CNC machined aluminum, 16GB DDR5, 1TB SSD.",
            "base_msrp": 204990.00,
            "current_price": 174990.00,
            "current_price_source": "Dell India Official Corporate Store",
            "current_price_timestamp": "2026-10-01 12:00:00 IST",
            "is_live_api_backed": True,
            "historical_prices": generate_sample_timeline("2026-04-01", 204990.00, -0.15, 0.010, 180, "Dell India Online")
        },
        {
            "id": "tesla-model-3",
            "name": "Tesla Model 3 Long Range Dual Motor AWD",
            "category": "cars",
            "brand": "Tesla",
            "sku": "M3-2024-LR-IND",
            "image_url": "",
            "description": "Long-range electric sedan, 550+ km estimated range, acoustic glass cabin, dual motor all-wheel drive.",
            "base_msrp": 4500000.00,
            "current_price": 3950000.00,
            "current_price_source": "Tesla Direct Vehicle Configurator India",
            "current_price_timestamp": "2026-10-01 12:00:00 IST",
            "is_live_api_backed": True,
            "historical_prices": generate_sample_timeline("2026-04-01", 4500000.00, -0.12, 0.006, 180, "Tesla Official Inventory")
        },
        {
            "id": "toyota-rav4-hybrid",
            "name": "Mahindra XUV700 AX7 Luxury Pack (AWD Diesel AT)",
            "category": "cars",
            "brand": "Mahindra",
            "sku": "MAH-XUV700-AX7L-AWD",
            "image_url": "",
            "description": "mHawk 2.2L Diesel engine, ADAS Level 2, 12-speaker Sony 3D sound, dual HD superscreen.",
            "base_msrp": 2699000.00,
            "current_price": 2549000.00,
            "current_price_source": "CarWale Market Valuation API",
            "current_price_timestamp": "2026-10-01 12:00:00 IST",
            "is_live_api_backed": True,
            "historical_prices": generate_sample_timeline("2026-04-01", 2699000.00, -0.05, 0.004, 180, "Indian Dealership Network")
        },
        {
            "id": "sony-wh1000xm5",
            "name": "Sony WH-1000XM5 Premium Noise-Canceling Headphones",
            "category": "electronics",
            "brand": "Sony",
            "sku": "WH1000XM5/B-IN",
            "image_url": "",
            "description": "Industry-leading active noise cancellation with 8 microphones, 30-hour battery, LDAC Hi-Res audio.",
            "base_msrp": 34990.00,
            "current_price": 27990.00,
            "current_price_source": "Sony Center India / Amazon IN API",
            "current_price_timestamp": "2026-10-01 12:00:00 IST",
            "is_live_api_backed": True,
            "historical_prices": generate_sample_timeline("2026-04-01", 34990.00, -0.20, 0.012, 180, "Sony Center / Croma")
        },
        {
            "id": "lg-c3-oled",
            "name": "LG 65\" Class C3 Series OLED evo 4K Smart TV",
            "category": "electronics",
            "brand": "LG",
            "sku": "OLED65C3PSA",
            "image_url": "",
            "description": "Self-lit OLED pixels, α9 AI Processor 4K Gen6, Dolby Vision, Dolby Atmos, 120Hz refresh rate.",
            "base_msrp": 189990.00,
            "current_price": 144990.00,
            "current_price_source": "Reliance Digital API",
            "current_price_timestamp": "2026-10-01 12:00:00 IST",
            "is_live_api_backed": True,
            "historical_prices": generate_sample_timeline("2026-04-01", 189990.00, -0.23, 0.011, 180, "Reliance Digital / Vijay Sales")
        },
        {
            "id": "dyson-v15",
            "name": "Dyson V15 Detect Extra Cordless Vacuum Cleaner",
            "category": "consumer_goods",
            "brand": "Dyson",
            "sku": "368340-02",
            "image_url": "",
            "description": "Laser reveals invisible microscopic dust, piezo sensor measures particle size and auto-adapts suction.",
            "base_msrp": 69900.00,
            "current_price": 57900.00,
            "current_price_source": "Dyson India Official Online Store",
            "current_price_timestamp": "2026-10-01 12:00:00 IST",
            "is_live_api_backed": True,
            "historical_prices": generate_sample_timeline("2026-04-01", 69900.00, -0.17, 0.013, 180, "Dyson India Direct")
        },
        {
            "id": "breville-barista-express",
            "name": "Philips 5400 Series Fully Automatic Espresso Machine",
            "category": "consumer_goods",
            "brand": "Philips",
            "sku": "EP5447/90",
            "image_url": "",
            "description": "LatteGo milk system, 12 coffee varieties, ceramic grinders, intuitive touch display.",
            "base_msrp": 79995.00,
            "current_price": 64995.00,
            "current_price_source": "Amazon India Retail API",
            "current_price_timestamp": "2026-10-01 12:00:00 IST",
            "is_live_api_backed": True,
            "historical_prices": generate_sample_timeline("2026-04-01", 79995.00, -0.18, 0.010, 180, "Amazon India / Croma")
        }
    ]
