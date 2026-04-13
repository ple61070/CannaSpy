"""
dispensary_scraper.py — CannaSpy fallback data pipeline.

NOTE: This is the fallback pipeline. The primary pipeline is collector.py.

This scraper is invoked when the primary API pipeline is unavailable, or
as part of the weekly 50-dispensary test cohort that keeps fallback parsers
current. It must NEVER be the sole data collection mechanism in production.

Invoked by ScrapeWorker (Node.js/BullMQ) via child_process.spawn():
  python dispensary_scraper.py --competitor-id <uuid> --output json

Writes JSON result to stdout. All errors to stderr.
Exit code 0 = success, 1 = failure.

IMPORTANT: Only scrapes dispensaries' own public websites.
Never scrapes aggregator platforms directly.
Always checks robots.txt compliance before scraping.
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from typing import Optional

import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Add parent directory to path for relative imports
sys.path.insert(0, os.path.dirname(__file__))

from compliance.robots_checker import check_robots_allowed, get_crawl_delay
from parsers.dutchie_parser import DutchieParser
from parsers.html_parser import HTMLParser


def get_competitor(conn, competitor_id: str) -> Optional[dict]:
    """Fetch competitor record from database."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, name, address, website_url, platform, robots_ok, last_scraped
            FROM competitors
            WHERE id = %s
            """,
            (competitor_id,),
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            "id": str(row[0]),
            "name": row[1],
            "address": row[2],
            "website_url": row[3],
            "platform": row[4],
            "robots_ok": row[5],
            "last_scraped": row[6],
        }


def detect_platform(url: str) -> str:
    """Detect the menu platform used by a dispensary website."""
    dutchie = DutchieParser()
    if dutchie.is_dutchie_site(url):
        return "dutchie"
    return "custom"


def scrape_competitor(competitor: dict) -> dict:
    """
    Main scrape function for a single competitor.
    Returns structured price/promotion data.
    """
    url = competitor.get("website_url")
    if not url:
        return {
            "competitor_id": competitor["id"],
            "prices": [],
            "promotions": [],
            "error": "No website URL configured",
        }

    # robots.txt compliance check — NON-NEGOTIABLE
    if not check_robots_allowed(url):
        return {
            "competitor_id": competitor["id"],
            "prices": [],
            "promotions": [],
            "error": f"robots.txt disallows scraping {url}",
            "robots_blocked": True,
        }

    # Respect crawl delay
    crawl_delay = get_crawl_delay(url)
    if crawl_delay:
        time.sleep(crawl_delay)

    platform = competitor.get("platform") or detect_platform(url)
    prices = []
    promotions = []

    try:
        if platform == "dutchie":
            parser = DutchieParser()
            slug = parser.extract_dutchie_slug(url)
            if slug:
                products = parser.fetch_menu(slug)
                prices = [p for p in products if p.get("price", 0) > 0]
                promotions = [
                    {
                        "promo_text": p["promo_text"],
                        "promo_type": "daily_special",
                        "category": p.get("category"),
                        "source_url": url,
                    }
                    for p in products
                    if p.get("on_promo") and p.get("promo_text")
                ]
        else:
            # Generic HTML scraping
            parser = HTMLParser(use_playwright=True)
            html = parser.fetch_page(url)
            if html:
                products = parser.parse_menu(html, url)
                prices = [p for p in products if p.get("price", 0) > 0]
                promotions = [
                    {
                        "promo_text": p.get("promo_text", "Active promotion"),
                        "promo_type": "daily_special",
                        "category": p.get("category"),
                        "source_url": url,
                    }
                    for p in products
                    if p.get("on_promo")
                ]

    except Exception as e:
        return {
            "competitor_id": competitor["id"],
            "prices": [],
            "promotions": [],
            "error": str(e),
        }

    return {
        "competitor_id": competitor["id"],
        "platform_detected": platform,
        "prices": prices,
        "promotions": promotions,
        "scraped_at": datetime.utcnow().isoformat(),
    }


def main():
    parser = argparse.ArgumentParser(description="CannaSpy dispensary scraper")
    parser.add_argument("--competitor-id", required=True, help="UUID of competitor to scrape")
    parser.add_argument("--output", choices=["json", "pretty"], default="json")
    parser.add_argument("--daemon", action="store_true", help="Run as background daemon (unused)")
    args = parser.parse_args()

    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
    except Exception as e:
        print(json.dumps({"error": f"Database connection failed: {e}"}), file=sys.stderr)
        sys.exit(1)

    try:
        competitor = get_competitor(conn, args.competitor_id)
        if not competitor:
            print(
                json.dumps({"error": f"Competitor {args.competitor_id} not found"}),
                file=sys.stderr,
            )
            sys.exit(1)

        result = scrape_competitor(competitor)

        if args.output == "pretty":
            print(json.dumps(result, indent=2))
        else:
            print(json.dumps(result))

        conn.close()
        sys.exit(0)

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        conn.close()
        sys.exit(1)


if __name__ == "__main__":
    main()
