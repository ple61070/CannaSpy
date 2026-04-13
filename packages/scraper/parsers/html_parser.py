"""
html_parser.py — Generic HTML fallback parser for non-Dutchie dispensary sites.

Used when Dutchie detection fails. Attempts to extract prices from common
menu page structures using BeautifulSoup.
"""

import re
import requests
from bs4 import BeautifulSoup
from typing import Optional
from playwright.sync_api import sync_playwright


PRICE_PATTERN = re.compile(r"\$\s*(\d+(?:\.\d{1,2})?)")
CATEGORY_KEYWORDS = {
    "flower": ["flower", "bud", "cannabis flower", "indoor", "outdoor", "greenhouse"],
    "preroll": ["pre-roll", "preroll", "joint", "blunt"],
    "edible": ["edible", "gummy", "chocolate", "cookie", "brownie", "candy"],
    "concentrate": ["concentrate", "wax", "shatter", "rosin", "resin", "hash", "dab"],
    "vape": ["vape", "cartridge", "cart", "pod", "distillate"],
    "topical": ["topical", "lotion", "cream", "balm", "patch"],
}


class HTMLParser:
    def __init__(self, use_playwright: bool = True):
        self.use_playwright = use_playwright

    def fetch_page(self, url: str) -> Optional[str]:
        """Fetch page HTML, using Playwright for JS-heavy sites."""
        if self.use_playwright:
            try:
                with sync_playwright() as p:
                    browser = p.chromium.launch(headless=True)
                    page = browser.new_page()
                    page.set_extra_http_headers({
                        "User-Agent": "Mozilla/5.0 (compatible; CannaSpy-Intel/1.0)"
                    })
                    page.goto(url, wait_until="networkidle", timeout=30000)
                    content = page.content()
                    browser.close()
                    return content
            except Exception as e:
                print(f"html_parser: playwright failed for {url}: {e}", flush=True)

        # Fallback to requests
        try:
            resp = requests.get(url, timeout=15, headers={
                "User-Agent": "Mozilla/5.0 (compatible; CannaSpy-Intel/1.0)"
            })
            return resp.text
        except Exception as e:
            print(f"html_parser: requests failed for {url}: {e}", flush=True)
            return None

    def parse_menu(self, html: str, source_url: str) -> list[dict]:
        """Parse product prices from dispensary menu HTML."""
        soup = BeautifulSoup(html, "lxml")
        products = []

        # Strategy 1: Look for structured product cards
        product_cards = self._find_product_cards(soup)
        if product_cards:
            for card in product_cards:
                product = self._parse_card(card, source_url)
                if product:
                    products.append(product)

        # Strategy 2: Table-based menus
        if not products:
            products = self._parse_table_menu(soup, source_url)

        return products

    def _find_product_cards(self, soup: BeautifulSoup) -> list:
        """Find product card elements using common CSS patterns."""
        selectors = [
            "[class*='product-card']",
            "[class*='menu-item']",
            "[class*='product-item']",
            "[class*='item-card']",
            "[data-testid*='product']",
        ]
        for sel in selectors:
            cards = soup.select(sel)
            if len(cards) > 3:
                return cards
        return []

    def _parse_card(self, card, source_url: str) -> Optional[dict]:
        """Extract price data from a product card element."""
        text = card.get_text(" ", strip=True)
        prices = PRICE_PATTERN.findall(text)
        if not prices:
            return None

        # Find name: first non-price text block
        name_elem = (
            card.find(class_=re.compile(r"name|title", re.I))
            or card.find(["h1", "h2", "h3", "h4", "strong"])
        )
        name = name_elem.get_text(strip=True) if name_elem else text[:60]

        price = float(prices[0])
        category = self._detect_category(name + " " + text)

        return {
            "raw_name": name[:255],
            "price": price,
            "in_stock": "out of stock" not in text.lower() and "sold out" not in text.lower(),
            "on_promo": bool(re.search(r"sale|promo|deal|special|discount|%\s*off", text, re.I)),
            "promo_text": None,
            "category": category,
            "source_url": source_url,
        }

    def _parse_table_menu(self, soup: BeautifulSoup, source_url: str) -> list[dict]:
        """Parse table-based menu layouts."""
        products = []
        for table in soup.find_all("table"):
            rows = table.find_all("tr")
            for row in rows[1:]:  # skip header
                cells = row.find_all(["td", "th"])
                if len(cells) < 2:
                    continue
                text = " ".join(c.get_text(strip=True) for c in cells)
                prices = PRICE_PATTERN.findall(text)
                if not prices:
                    continue
                name = cells[0].get_text(strip=True)
                products.append({
                    "raw_name": name[:255],
                    "price": float(prices[0]),
                    "in_stock": True,
                    "on_promo": False,
                    "promo_text": None,
                    "category": self._detect_category(name),
                    "source_url": source_url,
                })
        return products

    def _detect_category(self, text: str) -> str:
        """Detect product category from text."""
        text_lower = text.lower()
        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(kw in text_lower for kw in keywords):
                return category
        return "unknown"
