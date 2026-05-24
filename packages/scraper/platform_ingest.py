#!/usr/bin/env python3
"""
platform_ingest.py — Ingest dispensary listings (delivery + storefront) from the
primary data collection platform into the dispensaries table.

Tiles California with bounding boxes, fetches all listings per tile, and upserts
into dispensaries. Delivery operators (no DCC license in platform data) are stored
using platform_slug as their unique key. Storefront operators with a matching
dcc_license get their lat/lng + platform_slug backfilled on existing DCC records.

Usage:
    python platform_ingest.py             # full CA ingest
    python platform_ingest.py --tile la   # LA metro only (quick test)
    python platform_ingest.py --dry-run   # print counts without writing to DB

Environment:
    CANNASPY_PRIMARY_API_HOST  — platform API host
    DATABASE_URL               — Railway Postgres connection string
"""
import argparse
import logging
import os
import time

import psycopg2
import psycopg2.extras
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# California bounding box tiles: (lat_min, lng_min, lat_max, lng_max)
CA_TILES = {
    "san_diego":    (32.5, -117.6, 33.4, -116.0),
    "la":           (33.4, -118.9, 34.5, -116.9),
    "inland_empire":(33.4, -117.6, 34.5, -115.8),
    "sb_ventura":   (34.3, -120.5, 34.9, -118.5),
    "central_coast":(34.9, -121.5, 36.5, -119.0),
    "sf_bay":       (37.2, -122.6, 38.0, -121.5),
    "east_bay":     (37.5, -122.4, 38.2, -121.5),
    "sacramento":   (38.2, -121.8, 38.8, -120.8),
    "fresno":       (36.5, -120.5, 37.5, -119.0),
    "north_bay":    (38.0, -123.2, 39.0, -122.0),
    "redding":      (40.0, -123.0, 40.8, -121.5),
    "humboldt":     (40.5, -124.5, 41.5, -123.0),
}


def _api_host() -> str:
    host = os.environ.get("CANNASPY_PRIMARY_API_HOST", "").strip().rstrip("/")
    if not host:
        raise RuntimeError("CANNASPY_PRIMARY_API_HOST not set")
    return host


def _db_conn():
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        raise RuntimeError("DATABASE_URL not set")
    return psycopg2.connect(url, sslmode="require")


def derive_business_type(listing: dict) -> str:
    oo = listing.get("online_ordering", {})
    delivery = bool(oo.get("enabled_for_delivery"))
    pickup = bool(oo.get("enabled_for_pickup"))
    if delivery and pickup:
        return "both"
    if delivery:
        return "delivery"
    return "storefront"


def fetch_tile(host: str, lat_min: float, lng_min: float, lat_max: float, lng_max: float):
    """Yield all listings in a bounding box, paginating as needed."""
    bbox = f"{lat_min},{lng_min},{lat_max},{lng_max}"
    page = 1
    seen = 0
    while True:
        r = requests.get(
            f"https://{host}/discovery/v1/listings",
            params={"filter[bounding_box]": bbox, "page_size": 50, "page": page},
            timeout=15,
            headers={"User-Agent": "python-requests/2.31.0"},
        )
        r.raise_for_status()
        data = r.json()
        listings = data.get("data", {}).get("listings", [])
        if not listings:
            break
        yield from listings
        seen += len(listings)
        total = data.get("meta", {}).get("total_listings", 0)
        logger.debug("tile page %d: %d/%d fetched", page, seen, total)
        if seen >= total:
            break
        page += 1
        time.sleep(0.4)


def upsert_listing(cur, listing: dict) -> str:
    """
    Upsert one listing. Returns 'dcc_update', 'slug_insert', or 'skip'.
    - If listing has a license_number matching a DCC record: update that row.
    - Otherwise: insert/update by platform_slug.
    """
    slug = listing.get("slug")
    name = listing.get("name", "")
    city = listing.get("city", "")
    lat = listing.get("latitude")
    lng = listing.get("longitude")
    license_num = listing.get("license_number") or None
    business_type = derive_business_type(listing)
    state = listing.get("state", "")

    if not slug or lat is None or lng is None:
        return "skip"
    # Only ingest California listings
    if state not in ("California", "CA"):
        return "skip"
    # Storefronts are fully covered by DCC ingest with authoritative data — skip to avoid duplicates
    if business_type == "storefront":
        return "skip"

    # Step 1: if we have a DCC license, try to update existing DCC record
    if license_num:
        cur.execute(
            """
            UPDATE dispensaries
            SET lat = %s, lng = %s, platform_slug = %s,
                business_type = %s, enriched = TRUE, updated_at = NOW()
            WHERE dcc_license = %s
            """,
            [lat, lng, slug, business_type, license_num],
        )
        if cur.rowcount > 0:
            return "dcc_update"

    # Step 2: upsert by platform_slug (handles new delivery-only operators)
    cur.execute(
        """
        INSERT INTO dispensaries
            (dcc_license, platform_slug, name, city, lat, lng, business_type, enriched)
        VALUES
            (%s, %s, %s, %s, %s, %s, %s, TRUE)
        ON CONFLICT DO NOTHING
        """,
        [license_num, slug, name, city, lat, lng, business_type],
    )
    return "slug_insert" if cur.rowcount > 0 else "skip"


def run(tiles: list[tuple], dry_run: bool = False):
    host = _api_host()
    conn = None if dry_run else _db_conn()
    stats = {"dcc_update": 0, "slug_insert": 0, "skip": 0, "error": 0}

    try:
        for tile_name, (lat_min, lng_min, lat_max, lng_max) in tiles:
            logger.info("Processing tile: %s (%s,%s → %s,%s)", tile_name, lat_min, lng_min, lat_max, lng_max)
            count = 0
            for listing in fetch_tile(host, lat_min, lng_min, lat_max, lng_max):
                if dry_run:
                    bt = derive_business_type(listing)
                    if bt in ("delivery", "both"):
                        logger.info("DRY delivery: %s | lat=%s | lng=%s | slug=%s",
                                    listing.get("name"), listing.get("latitude"),
                                    listing.get("longitude"), listing.get("slug"))
                    stats["slug_insert"] += 1
                    count += 1
                    continue
                try:
                    cur = conn.cursor()
                    result = upsert_listing(cur, listing)
                    stats[result] += 1
                    count += 1
                    if count % 100 == 0:
                        conn.commit()
                        logger.info("tile %s: %d processed so far", tile_name, count)
                except Exception as exc:
                    conn.rollback()
                    logger.warning("Error on listing %s: %s", listing.get("slug"), exc)
                    stats["error"] += 1

            if not dry_run:
                conn.commit()
            logger.info("tile %s done: %d listings", tile_name, count)
    finally:
        if conn:
            conn.close()

    logger.info("Final stats: %s", stats)
    return stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tile", help="Run a single named tile (e.g. 'la')")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.tile:
        tile_name = args.tile.lower()
        if tile_name not in CA_TILES:
            print(f"Unknown tile. Choose from: {', '.join(CA_TILES)}")
            raise SystemExit(1)
        tiles_to_run = [(tile_name, CA_TILES[tile_name])]
    else:
        tiles_to_run = list(CA_TILES.items())

    run(tiles_to_run, dry_run=args.dry_run)
