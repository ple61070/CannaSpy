#!/usr/bin/env python3
"""
dcc_ingest.py — Download CA DCC license data and geocode into dispensaries table.

Data source: CA DCC public license search API (Azure backend powering search.cannabis.ca.gov).
The API returns lat/lng for most records, so geocoding is only used for records missing coordinates.

Run:
    python dcc_ingest.py [--dry-run] [--limit N] [--skip-geocoding] [--county COUNTY]
    python dcc_ingest.py --limit 10 --dry-run
    python dcc_ingest.py --limit 200 --county "Los Angeles"
    python dcc_ingest.py --all-counties            # full CA pull (~3,000+ active retailers)
"""

import argparse
import logging
import os
import sys
import time
from datetime import datetime, timezone
from typing import Optional

import requests
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

ENV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
load_dotenv(dotenv_path=os.path.abspath(ENV_PATH))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    stream=sys.stdout,
)
log = logging.getLogger("dcc_ingest")

# ---------------------------------------------------------------------------
# DCC API config
# ---------------------------------------------------------------------------

# Discovered from search.cannabis.ca.gov/config.js
DCC_API_BASE = "https://as-dcc-pub-cann-w-p-002.azurewebsites.net"
DCC_SEARCH_URL = f"{DCC_API_BASE}/licenses/AdvancedSearch"

# License types we care about for CannaSpy (retail dispensaries)
DCC_LICENSE_TYPES = [
    "Commercial -  Retailer",
    "Commercial -  Retailer - Non-Storefront",
    "Commercial -  Microbusiness",
]

DCC_HEADERS = {
    "Origin": "https://search.cannabis.ca.gov",
    "Referer": "https://search.cannabis.ca.gov/",
    "User-Agent": (
        "Mozilla/5.0 (compatible; CannaSpy-DataPipeline/1.0; "
        "+https://cannaspy.io)"
    ),
    "Accept": "application/json",
}

PAGE_SIZE = 100
REQUEST_DELAY_S = 0.3
RETRY_BACKOFF_BASE = 2
MAX_RETRIES = 4

# CA counties
CA_COUNTIES = [
    "Alameda", "Alpine", "Amador", "Butte", "Calaveras", "Colusa",
    "Contra Costa", "Del Norte", "El Dorado", "Fresno", "Glenn", "Humboldt",
    "Imperial", "Inyo", "Kern", "Kings", "Lake", "Lassen", "Los Angeles",
    "Madera", "Marin", "Mariposa", "Mendocino", "Merced", "Modoc", "Mono",
    "Monterey", "Napa", "Nevada", "Orange", "Placer", "Plumas", "Riverside",
    "Sacramento", "San Benito", "San Bernardino", "San Diego", "San Francisco",
    "San Joaquin", "San Luis Obispo", "San Mateo", "Santa Barbara",
    "Santa Clara", "Santa Cruz", "Shasta", "Sierra", "Siskiyou", "Solano",
    "Sonoma", "Stanislaus", "Sutter", "Tehama", "Trinity", "Tulare",
    "Tuolumne", "Ventura", "Yolo", "Yuba",
]

# ---------------------------------------------------------------------------
# Geocoding (fallback for records missing lat/lng)
# ---------------------------------------------------------------------------

GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
GEOCODE_DELAY_S = 0.05
GEOCODE_BACKOFF_BASE = 2
GEOCODE_MAX_RETRIES = 4


def geocode_address(
    address: str,
    city: str,
    zip_code: str,
    api_key: str,
) -> tuple[Optional[float], Optional[float]]:
    """Call Google Geocoding API; return (lat, lng) or (None, None)."""
    full_address = f"{address}, {city}, CA {zip_code}".strip(", ")
    params = {"address": full_address, "key": api_key}

    for attempt in range(GEOCODE_MAX_RETRIES):
        try:
            resp = requests.get(GEOCODE_URL, params=params, timeout=10)
        except requests.RequestException as exc:
            log.warning("Geocode network error (attempt %d): %s", attempt + 1, exc)
            time.sleep(GEOCODE_BACKOFF_BASE ** attempt)
            continue

        if resp.status_code == 429:
            wait = GEOCODE_BACKOFF_BASE ** (attempt + 1)
            log.warning("Geocode 429 rate-limit; backing off %ds", wait)
            time.sleep(wait)
            continue

        if resp.status_code != 200:
            log.warning("Geocode HTTP %s for '%s'", resp.status_code, full_address)
            return None, None

        data = resp.json()
        if data.get("status") == "OK" and data.get("results"):
            loc = data["results"][0]["geometry"]["location"]
            return loc["lat"], loc["lng"]

        if data.get("status") in ("ZERO_RESULTS", "INVALID_REQUEST"):
            log.debug("No geocode results for: %s", full_address)
            return None, None

        if data.get("status") in ("OVER_QUERY_LIMIT",):
            wait = GEOCODE_BACKOFF_BASE ** (attempt + 1)
            log.warning("Geocode OVER_QUERY_LIMIT; backing off %ds", wait)
            time.sleep(wait)
            continue

        log.warning(
            "Geocode unexpected status '%s' for '%s'",
            data.get("status"), full_address
        )
        return None, None

    log.error("Geocode max retries exceeded for '%s'", full_address)
    return None, None


# ---------------------------------------------------------------------------
# DCC API fetch
# ---------------------------------------------------------------------------

def fetch_page(
    license_type: str,
    county: Optional[str],
    page_number: int,
    page_size: int,
) -> dict:
    """Fetch one page from DCC AdvancedSearch API."""
    params: dict = {
        "pageSize": page_size,
        "pageNumber": page_number,
        "licenseType": license_type,
        "licenseStatus": "Active",
    }
    if county:
        params["premiseCounty"] = county

    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.get(
                DCC_SEARCH_URL,
                params=params,
                headers=DCC_HEADERS,
                timeout=30,
            )
        except requests.RequestException as exc:
            wait = RETRY_BACKOFF_BASE ** attempt
            log.warning(
                "DCC API network error (attempt %d/%d): %s. Retrying in %ds",
                attempt + 1, MAX_RETRIES, exc, wait
            )
            time.sleep(wait)
            continue

        if resp.status_code == 429:
            wait = RETRY_BACKOFF_BASE ** (attempt + 1)
            log.warning("DCC API 429 rate-limit; backing off %ds", wait)
            time.sleep(wait)
            continue

        if resp.status_code != 200:
            log.warning(
                "DCC API HTTP %s for licenseType=%s county=%s page=%d",
                resp.status_code, license_type, county, page_number
            )
            return {"metadata": {}, "data": []}

        return resp.json()

    log.error(
        "DCC API max retries exceeded for licenseType=%s county=%s page=%d",
        license_type, county, page_number
    )
    return {"metadata": {}, "data": []}


def normalize_license_type(raw: str) -> str:
    """Map DCC license type string to DB enum (license_type column)."""
    val = raw.lower()
    if "non-storefront" in val:
        return "delivery"
    if "microbusiness" in val:
        return "microbusiness"
    return "retail"


def license_type_to_business_type(license_type: str) -> str:
    """Convert DB license_type to business_type enum.

    retail        → storefront
    delivery      → delivery
    microbusiness → both  (licensed for storefront + delivery)
    """
    if license_type == "delivery":
        return "delivery"
    if license_type == "microbusiness":
        return "both"
    return "storefront"


def fetch_all_licenses(
    counties: Optional[list[str]],
    license_types: list[str],
    limit: Optional[int],
) -> list[dict]:
    """Paginate DCC API and return normalised record dicts."""
    records: list[dict] = []
    seen_ids: set[str] = set()

    search_counties = counties if counties else [None]

    for license_type in license_types:
        for county in search_counties:
            log.info(
                "Fetching: licenseType=%r county=%r",
                license_type, county or "ALL"
            )
            page = 1
            while True:
                data = fetch_page(license_type, county, page, PAGE_SIZE)
                items = data.get("data", [])
                meta = data.get("metadata", {})
                total_pages = meta.get("totalPages", 0)
                total_count = meta.get("totalCount", 0)

                if page == 1:
                    log.info(
                        "  → %d total records, %d pages",
                        total_count, total_pages
                    )

                for item in items:
                    license_number = item.get("licenseNumber", "").strip()
                    if not license_number or license_number in seen_ids:
                        continue
                    seen_ids.add(license_number)

                    lat = item.get("premiseLatitude")
                    lng = item.get("premiseLongitude")
                    # DCC returns 0.0 for missing coords — treat as null
                    if lat == 0.0 or lng == 0.0:
                        lat = None
                        lng = None

                    lt = normalize_license_type(item.get("licenseType", ""))
                    records.append({
                        "dcc_license":   license_number,
                        "name":          (
                            item.get("businessDbaName") or
                            item.get("businessLegalName") or ""
                        ).strip(),
                        "legal_name":    item.get("businessLegalName", "").strip() or None,
                        "address":       item.get("premiseStreetAddress", "").strip(),
                        "city":          item.get("premiseCity", "").strip(),
                        "zip":           item.get("premiseZipCode", "").strip(),
                        "county":        item.get("premiseCounty", "").strip(),
                        "license_type":  lt,
                        "business_type": license_type_to_business_type(lt),
                        "dcc_status":    "active",
                        "lat":           lat,
                        "lng":           lng,
                        "geocoded_at":   (
                            datetime.now(timezone.utc) if lat else None
                        ),
                    })

                    if limit and len(records) >= limit:
                        log.info("Limit of %d reached — stopping fetch.", limit)
                        return records

                if page >= total_pages or not items:
                    break

                page += 1
                time.sleep(REQUEST_DELAY_S)

    return records


# ---------------------------------------------------------------------------
# Database upsert
# ---------------------------------------------------------------------------

UPSERT_SQL = """
INSERT INTO dispensaries (
    dcc_license, name, legal_name, address, city, zip, county,
    license_type, business_type, dcc_status, lat, lng, geocoded_at
)
VALUES (
    %(dcc_license)s, %(name)s, %(legal_name)s, %(address)s, %(city)s, %(zip)s, %(county)s,
    %(license_type)s, %(business_type)s, %(dcc_status)s, %(lat)s, %(lng)s, %(geocoded_at)s
)
ON CONFLICT (dcc_license) DO UPDATE SET
    name          = EXCLUDED.name,
    legal_name    = EXCLUDED.legal_name,
    address       = EXCLUDED.address,
    city          = EXCLUDED.city,
    zip           = EXCLUDED.zip,
    county        = EXCLUDED.county,
    license_type  = EXCLUDED.license_type,
    business_type = EXCLUDED.business_type,
    dcc_status    = EXCLUDED.dcc_status,
    lat           = COALESCE(EXCLUDED.lat, dispensaries.lat),
    lng           = COALESCE(EXCLUDED.lng, dispensaries.lng),
    geocoded_at   = COALESCE(EXCLUDED.geocoded_at, dispensaries.geocoded_at),
    updated_at    = NOW()
"""


def upsert_dispensaries(
    records: list[dict],
    database_url: str,
) -> tuple[int, int]:
    """Upsert records into dispensaries table. Returns (upserted, errors)."""
    conn = psycopg2.connect(database_url)
    conn.autocommit = False
    cur = conn.cursor()

    upserted = 0
    errors = 0
    batch_size = 50

    try:
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            try:
                psycopg2.extras.execute_batch(cur, UPSERT_SQL, batch)
                conn.commit()
                upserted += len(batch)
                log.info(
                    "Upserted batch %d-%d / %d",
                    i + 1, min(i + batch_size, len(records)), len(records)
                )
            except psycopg2.Error as exc:
                conn.rollback()
                log.warning(
                    "Batch upsert failed (rows %d-%d): %s — falling back to row-by-row",
                    i, i + batch_size, exc
                )
                cur = conn.cursor()
                # Row-by-row fallback
                for rec in batch:
                    try:
                        cur.execute(UPSERT_SQL, rec)
                        conn.commit()
                        upserted += 1
                    except psycopg2.Error as row_exc:
                        conn.rollback()
                        log.warning(
                            "Row upsert failed for license %s: %s",
                            rec.get("dcc_license"), row_exc
                        )
                        errors += 1
                        cur = conn.cursor()

        log.info(
            "DB upsert complete — %d upserted, %d errors", upserted, errors
        )
    finally:
        cur.close()
        conn.close()

    return upserted, errors


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run(
    dry_run: bool,
    limit: Optional[int],
    skip_geocoding: bool,
    county: Optional[str],
    all_counties: bool,
) -> None:
    database_url = os.environ.get("DATABASE_URL", "")
    google_api_key = os.environ.get("GOOGLE_PLACES_API_KEY", "")

    if not dry_run and not database_url:
        log.error("DATABASE_URL is not set. Aborting.")
        sys.exit(1)

    if not skip_geocoding and not google_api_key:
        log.info(
            "GOOGLE_PLACES_API_KEY not set — geocoding will be skipped "
            "(DCC API provides lat/lng for most records anyway)."
        )
        skip_geocoding = True

    # Determine county scope
    counties: Optional[list[str]]
    if all_counties:
        counties = CA_COUNTIES
        log.info("Running full CA pull across %d counties.", len(CA_COUNTIES))
    elif county:
        counties = [county]
    else:
        # Default to Los Angeles + San Francisco for a fast test
        counties = ["Los Angeles", "San Francisco", "San Diego",
                    "Sacramento", "Orange", "Alameda"]
        log.info(
            "No county specified — defaulting to 6 major counties. "
            "Use --all-counties for full CA pull."
        )

    # 1. Fetch from DCC API
    log.info("=== Step 1: Fetch from DCC license API ===")
    records = fetch_all_licenses(
        counties=counties,
        license_types=DCC_LICENSE_TYPES,
        limit=limit,
    )

    if not records:
        log.error("No records fetched from DCC API. Exiting.")
        sys.exit(1)

    log.info("Fetched %d unique license records.", len(records))

    # 2. Geocode records missing lat/lng (fallback)
    if not skip_geocoding:
        missing_coords = [r for r in records if r["lat"] is None]
        log.info(
            "=== Step 2: Geocode %d records missing lat/lng ===",
            len(missing_coords)
        )
        geocoded = 0
        for i, rec in enumerate(missing_coords):
            lat, lng = geocode_address(
                rec["address"],
                rec["city"],
                rec["zip"],
                google_api_key,
            )
            rec["lat"] = lat
            rec["lng"] = lng
            rec["geocoded_at"] = datetime.now(timezone.utc) if lat else None
            if lat:
                geocoded += 1
            time.sleep(GEOCODE_DELAY_S)

        if missing_coords:
            log.info(
                "Geocoding complete — %d/%d resolved (%.0f%%)",
                geocoded, len(missing_coords),
                (geocoded / len(missing_coords)) * 100,
            )
    else:
        log.info("=== Step 2: Geocoding skipped ===")

    # 3. Stats
    has_coords = sum(1 for r in records if r["lat"] is not None)
    log.info(
        "Coordinate coverage: %d/%d (%.0f%%)",
        has_coords, len(records),
        (has_coords / len(records)) * 100 if records else 0,
    )

    # 4. Dry-run preview
    if dry_run:
        log.info("=== DRY RUN — no DB writes ===")
        log.info("Sample records (first 5):")
        for rec in records[:5]:
            log.info(
                "  [%s] %s | %s, %s %s | %s | lat=%s lng=%s",
                rec["dcc_license"],
                rec["name"],
                rec["address"],
                rec["city"],
                rec["zip"],
                rec["license_type"],
                rec.get("lat"),
                rec.get("lng"),
            )
        log.info(
            "Dry run complete. Would write %d records to dispensaries table.",
            len(records)
        )
        return

    # 5. Upsert
    log.info("=== Step 3: Upsert into dispensaries table ===")
    upserted, errors = upsert_dispensaries(records, database_url)
    log.info(
        "Pipeline complete — %d upserted, %d errors out of %d total.",
        upserted, errors, len(records)
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Download CA DCC license data from the official license search API "
            "and upsert into dispensaries table."
        )
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and parse but do not write to the database.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        metavar="N",
        help="Only process the first N records.",
    )
    parser.add_argument(
        "--skip-geocoding",
        action="store_true",
        help=(
            "Skip Google geocoding for records missing lat/lng. "
            "Most DCC records already include coordinates."
        ),
    )
    parser.add_argument(
        "--county",
        type=str,
        default=None,
        metavar="COUNTY",
        help="Restrict fetch to a single CA county (e.g. 'Los Angeles').",
    )
    parser.add_argument(
        "--all-counties",
        action="store_true",
        help="Fetch all CA counties (full state pull, ~3,000+ records).",
    )
    args = parser.parse_args()

    run(
        dry_run=args.dry_run,
        limit=args.limit,
        skip_geocoding=args.skip_geocoding,
        county=args.county,
        all_counties=args.all_counties,
    )


if __name__ == "__main__":
    main()
