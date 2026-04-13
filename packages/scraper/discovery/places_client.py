"""
places_client.py — Google Places API radius scan for competitor discovery.

Uses the licensed Google Places API (not scraping) to find dispensaries
within a radius of each operator location.

CLI usage (matches spawn pattern in scrape.worker.ts):
  python3 discovery/places_client.py --lat 34.05 --lng -118.24 --radius 5
  python3 discovery/places_client.py --lat 34.05 --lng -118.24 --radius 5 --location-id <uuid>

Writes discovered competitors + resolved slugs to the database.
Outputs JSON array to stdout on completion.
"""

import json
import logging
import os
import re
import sys
import time
from typing import Optional
import googlemaps
import psycopg2
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class PlacesClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GOOGLE_PLACES_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_PLACES_API_KEY not set")
        self.client = googlemaps.Client(key=self.api_key)

    def find_dispensaries_near(
        self,
        lat: float,
        lng: float,
        radius_miles: float = 5.0,
        max_results: int = 50,
    ) -> list[dict]:
        """
        Find licensed dispensaries within radius_miles of (lat, lng).
        Returns list of candidate competitors.
        """
        radius_meters = int(radius_miles * 1609.34)
        results = []
        page_token = None

        for _ in range(3):  # max 3 pages = ~60 results
            kwargs = {
                "location": (lat, lng),
                "radius": radius_meters,
                "keyword": "cannabis dispensary",
                "type": "store",
            }
            if page_token:
                kwargs["page_token"] = page_token

            response = self.client.places_nearby(**kwargs)

            for place in response.get("results", []):
                results.append(self._parse_place(place, lat, lng))
                if len(results) >= max_results:
                    break

            page_token = response.get("next_page_token")
            if not page_token or len(results) >= max_results:
                break

            time.sleep(2)  # Google requires delay before using next_page_token

        return results

    def _parse_place(self, place: dict, origin_lat: float, origin_lng: float) -> dict:
        """Parse a Google Places result into our competitor format."""
        loc = place.get("geometry", {}).get("location", {})
        place_lat = loc.get("lat")
        place_lng = loc.get("lng")

        distance_miles = None
        if place_lat and place_lng:
            distance_miles = self._haversine_miles(
                origin_lat, origin_lng, place_lat, place_lng
            )

        return {
            "google_place_id": place.get("place_id"),
            "name": place.get("name"),
            "address": place.get("vicinity"),
            "lat": place_lat,
            "lng": place_lng,
            "distance_miles": round(distance_miles, 2) if distance_miles else None,
            "platform": "unknown",  # detected during scrape
        }

    @staticmethod
    def _haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two coordinates in miles."""
        import math
        R = 3958.8  # Earth radius in miles
        d_lat = math.radians(lat2 - lat1)
        d_lng = math.radians(lng2 - lng1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(d_lng / 2) ** 2
        )
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def get_place_details(self, place_id: str) -> dict:
        """Get detailed info for a specific place including website."""
        result = self.client.place(
            place_id,
            fields=["name", "formatted_address", "website", "formatted_phone_number"]
        )
        return result.get("result", {})

    def resolve_slug(self, name: str, website_url: Optional[str] = None) -> Optional[str]:
        """
        Attempt to resolve a dispensary's listing slug.

        Strategy:
        1. If website_url contains a known listing platform path pattern, extract slug directly.
        2. Normalize the business name into a likely slug and probe the primary API endpoint.
        3. Return the slug if the API responds 200, None otherwise.

        Never hardcodes the platform domain — reads from CANNASPY_PRIMARY_API_HOST env var.
        """
        api_host = os.environ.get("CANNASPY_PRIMARY_API_HOST", "").strip()
        if not api_host:
            logger.warning("CANNASPY_PRIMARY_API_HOST not set — cannot resolve slugs")
            return None

        # Strategy 1: extract slug from website URL if it contains the listing path
        if website_url:
            # Pattern: platform domain followed by /dispensary/<slug> or /store/<slug>
            m = re.search(r"/(?:dispensary|store|d)/([a-z0-9][a-z0-9\-]{1,80})", website_url)
            if m:
                candidate = m.group(1)
                if self._probe_slug(api_host, candidate):
                    logger.info("Resolved slug '%s' from website URL for '%s'", candidate, name)
                    return candidate

        # Strategy 2: normalize name into slug candidates and probe each
        for candidate in self._name_to_slug_candidates(name):
            if self._probe_slug(api_host, candidate):
                logger.info("Resolved slug '%s' via name normalization for '%s'", candidate, name)
                return candidate
            time.sleep(0.3)  # brief pause between probes

        logger.debug("No slug resolved for '%s'", name)
        return None

    @staticmethod
    def _name_to_slug_candidates(name: str) -> list[str]:
        """
        Generate ordered slug candidates from a business name.
        Example: "STIIIZY DTLA" → ["stiiizy-dtla", "stiiizy"]
        """
        # Normalize: lowercase, replace non-alphanumeric with hyphens, collapse
        base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        candidates = [base]
        # Also try without common suffixes: " - los angeles", " dtla", " dispensary"
        stripped = re.sub(r"-(?:dispensary|cannabis|collective|dtla|la|sf|sd|downtown)$", "", base)
        if stripped and stripped != base:
            candidates.append(stripped)
        return candidates

    @staticmethod
    def _probe_slug(api_host: str, slug: str) -> bool:
        """
        Probe the primary API endpoint to verify a slug is valid.
        Returns True if the slug resolves to an active listing (HTTP 200).
        Uses a lightweight page_size=1 request to minimize data transfer.
        """
        url = f"https://{api_host}/discovery/v1/listings/dispensaries/{slug}/menu_items?page=1&page_size=1"
        try:
            resp = requests.get(url, timeout=8, headers={"Accept": "application/json"})
            return resp.status_code == 200
        except requests.RequestException:
            return False


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def _get_conn() -> psycopg2.extensions.connection:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise EnvironmentError("DATABASE_URL is not set")
    return psycopg2.connect(url)


def _upsert_competitor(conn, place: dict, slug: Optional[str]) -> str:
    """
    Insert or update a competitor record. Returns the competitor UUID.
    Matches on google_place_id to avoid duplicates.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO competitors
              (name, address, lat, lng, google_place_id, slug, platform)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (google_place_id) DO UPDATE SET
              name    = EXCLUDED.name,
              address = EXCLUDED.address,
              slug    = COALESCE(EXCLUDED.slug, competitors.slug)
            RETURNING id
            """,
            (
                place["name"],
                place["address"],
                place["lat"],
                place["lng"],
                place["google_place_id"],
                slug,
                "weedmaps" if slug else "unknown",
            ),
        )
        competitor_id = str(cur.fetchone()[0])
    conn.commit()
    return competitor_id


def _link_to_location(conn, competitor_id: str, location_id: str) -> None:
    """Link a discovered competitor to the org location that triggered discovery."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO tracked_competitors (location_id, competitor_id, slot_type, active)
            VALUES (%s, %s, 'track', FALSE)
            ON CONFLICT (location_id, competitor_id) DO NOTHING
            """,
            (location_id, competitor_id),
        )
    conn.commit()


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import argparse

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        stream=sys.stderr,  # logs to stderr; JSON result goes to stdout
    )

    ap = argparse.ArgumentParser(
        description="Discover nearby dispensaries and resolve their listing slugs"
    )
    ap.add_argument("--lat",         type=float, required=True,  help="Center latitude")
    ap.add_argument("--lng",         type=float, required=True,  help="Center longitude")
    ap.add_argument("--radius",      type=float, default=5.0,    help="Search radius in miles (default 5)")
    ap.add_argument("--location-id", type=str,   default=None,   help="CannaSpy location UUID to link results to")
    ap.add_argument("--no-db",       action="store_true",         help="Skip database writes (dry run)")
    ap.add_argument("--max-results", type=int,   default=50,      help="Max dispensaries to return (default 50)")
    args = ap.parse_args()

    client = PlacesClient()
    results = client.find_dispensaries_near(
        lat=args.lat,
        lng=args.lng,
        radius_miles=args.radius,
        max_results=args.max_results,
    )

    output = []
    conn = None if args.no_db else _get_conn()

    for place in results:
        # Get website from place details for better slug resolution
        website_url = None
        if place.get("google_place_id"):
            try:
                details = client.get_place_details(place["google_place_id"])
                website_url = details.get("website")
                place["address"] = details.get("formatted_address") or place["address"]
            except Exception as e:
                logger.debug("Could not get details for %s: %s", place["name"], e)

        slug = client.resolve_slug(place["name"], website_url)
        place["slug"] = slug
        place["website_url"] = website_url
        place["slug_resolved"] = slug is not None

        competitor_id = None
        if conn and place.get("google_place_id"):
            try:
                competitor_id = _upsert_competitor(conn, place, slug)
                if args.location_id:
                    _link_to_location(conn, competitor_id, args.location_id)
                logger.info(
                    "%s: slug=%s competitor_id=%s",
                    place["name"], slug or "unresolved", competitor_id
                )
            except Exception as e:
                logger.error("DB write failed for %s: %s", place["name"], e)

        place["competitor_id"] = competitor_id
        output.append(place)

    if conn:
        conn.close()

    resolved = sum(1 for p in output if p["slug_resolved"])
    logger.info(
        "Discovery complete: %d dispensaries found, %d slugs resolved",
        len(output), resolved,
    )

    # JSON to stdout — matches spawn pattern in scrape.worker.ts
    print(json.dumps(output))
