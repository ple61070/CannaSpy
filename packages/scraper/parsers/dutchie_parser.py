"""
dutchie_parser.py — Dutchie GraphQL API parser.

Dutchie powers many CA dispensaries. Their menu data is accessible via
GraphQL queries, which is higher-quality than HTML scraping.
Platform detection: check for dutchie.com in script tags or iframe src.
"""

import re
import json
import requests
from typing import Optional
from bs4 import BeautifulSoup


DUTCHIE_GRAPHQL_URL = "https://dutchie.com/graphql"
DUTCHIE_DETECTION_PATTERNS = [
    r"dutchie\.com",
    r"dutchie-plus",
    r"iheartjane",  # Jane is another common platform
]

MENU_QUERY = """
query GetDispensaryMenu($dispensarySlug: String!, $menuType: MenuType) {
  dispensaryMenu(dispensarySlug: $dispensarySlug, menuType: $menuType) {
    products {
      id
      name
      brand {
        name
      }
      category
      subcategory
      prices {
        gram
        twoGrams
        eighth
        quarter
        halfOz
        ounce
        each
        unit
      }
      inStock
      specialData {
        specialTitle
        specialText
      }
    }
  }
}
"""


class DutchieParser:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (compatible; CannaSpy-Intel/1.0)",
            "Content-Type": "application/json",
        })

    def is_dutchie_site(self, url: str) -> bool:
        """Check if a dispensary website uses Dutchie."""
        try:
            resp = self.session.get(url, timeout=15)
            for pattern in DUTCHIE_DETECTION_PATTERNS:
                if re.search(pattern, resp.text, re.IGNORECASE):
                    return True
        except Exception:
            pass
        return False

    def extract_dutchie_slug(self, url: str) -> Optional[str]:
        """Extract the Dutchie dispensary slug from a menu URL."""
        patterns = [
            r"dutchie\.com/(?:menu/)?([a-z0-9-]+)",
            r"(?:menu|order)\.([a-z0-9-]+)\.com",
        ]
        for pattern in patterns:
            match = re.search(pattern, url, re.IGNORECASE)
            if match:
                return match.group(1)
        return None

    def fetch_menu(self, slug: str, menu_type: str = "RECREATIONAL") -> list[dict]:
        """Fetch menu via Dutchie GraphQL API."""
        try:
            resp = self.session.post(
                DUTCHIE_GRAPHQL_URL,
                json={
                    "query": MENU_QUERY,
                    "variables": {"dispensarySlug": slug, "menuType": menu_type},
                },
                timeout=30,
            )
            data = resp.json()
            products = data.get("data", {}).get("dispensaryMenu", {}).get("products", [])
            return [self._normalize_product(p) for p in products]
        except Exception as e:
            print(f"dutchie_parser: error fetching {slug}: {e}", flush=True)
            return []

    def _normalize_product(self, product: dict) -> dict:
        """Convert Dutchie product format to CannaSpy price_observation format."""
        prices = product.get("prices", {})
        specials = product.get("specialData", {})

        # Pick the most common unit price
        price = (
            prices.get("each")
            or prices.get("gram")
            or prices.get("unit")
            or prices.get("eighth")
            or 0
        )

        brand = product.get("brand", {})
        brand_name = brand.get("name") if isinstance(brand, dict) else None

        raw_name = product.get("name", "")
        if brand_name and brand_name not in raw_name:
            raw_name = f"{brand_name} {raw_name}"

        return {
            "raw_name": raw_name.strip(),
            "price": float(price) if price else 0.0,
            "in_stock": product.get("inStock", True),
            "on_promo": bool(specials.get("specialTitle") or specials.get("specialText")),
            "promo_text": specials.get("specialTitle") or specials.get("specialText"),
            "category": (product.get("category") or "unknown").lower(),
        }
