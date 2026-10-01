"""
Product and Price data models for PricePredictor AI.
"""

from dataclasses import dataclass, asdict
from typing import List, Optional
import datetime

@dataclass
class PriceRecord:
    date: str  # YYYY-MM-DD
    price: float  # In USD
    source: str = "User Historical Record"  # e.g., "Best Buy API", "User CSV", "Manual Entry"
    is_live_verified: bool = False
    notes: Optional[str] = None

    def to_dict(self):
        return asdict(self)

@dataclass
class LivePriceQuote:
    product_id: str
    current_price: float
    vendor: str
    currency: str
    timestamp: str
    in_stock: bool
    source_url: str
    is_verified: bool = True

    def to_dict(self):
        return asdict(self)

@dataclass
class Product:
    id: str
    name: str
    category: str  # smartphones, laptops, cars, electronics, consumer_goods
    brand: str
    sku: str
    image_url: str
    description: str
    base_msrp: float
    current_price: float
    current_price_source: str
    current_price_timestamp: str
    is_live_api_backed: bool
    historical_prices: List[PriceRecord]

    def to_dict(self):
        data = asdict(self)
        data["historical_count"] = len(self.historical_prices)
        return data
