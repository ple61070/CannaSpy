"""
promo_parser.py — Promotional HTML description parser.

Parses the `description` field from a dispensary's listing record into a
structured weekly deal schedule. The description is free-text HTML containing
happy hour specials, daily brand deals, and recurring weekly discounts.

Output schema:
{
  "happy_hour": {
    "time_range": "4:20pm-7:10pm",
    "deals": ["Buy 2 Get 2 for a Penny"]
  },
  "weekly": {
    "monday": [
      {"brand": "CAM", "discount": "25% off", "discount_type": "pct_off"},
      ...
    ],
    "tuesday": [...],
    ...
  },
  "everyday": [
    {"brand": "Heavy Hitters", "discount": "33% off", "discount_type": "pct_off"}
  ],
  "raw_text": "..."
}

Malformed or empty HTML returns an empty structure — never raises.
"""

import json
import logging
import os
import re
from typing import Optional

import psycopg2
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DAYS_OF_WEEK = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
]

# Pattern for discount amounts: "25% off", "33% off", "BOGO", "Buy 2 Get 1", etc.
PCT_OFF_RE = re.compile(r"(\d+(?:\.\d+)?)\s*%\s*off", re.IGNORECASE)
DOLLAR_OFF_RE = re.compile(r"\$(\d+(?:\.\d+)?)\s*off", re.IGNORECASE)
BOGO_RE = re.compile(r"buy\s*(\d+)\s*get\s*(\d+)(?:\s*(?:for\s*a?\s*penny|free))?", re.IGNORECASE)

# Time range pattern: "4:20pm–7:10pm", "4pm-7pm", "12:00pm - 2:00pm"
TIME_RANGE_RE = re.compile(
    r"(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*[–\-—]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))",
    re.IGNORECASE,
)

HAPPY_HOUR_RE = re.compile(r"happy\s*hour", re.IGNORECASE)
EVERYDAY_RE = re.compile(r"every\s*day|daily|everyday", re.IGNORECASE)


# ---------------------------------------------------------------------------
# Discount extraction
# ---------------------------------------------------------------------------


def _classify_discount(text: str) -> dict:
    """
    Extract discount amount and type from a text fragment.
    Returns {"discount": str, "discount_type": str}.
    """
    m = PCT_OFF_RE.search(text)
    if m:
        return {
            "discount": f"{m.group(1)}% off",
            "discount_type": "pct_off",
        }
    m = DOLLAR_OFF_RE.search(text)
    if m:
        return {
            "discount": f"${m.group(1)} off",
            "discount_type": "dollar_off",
        }
    m = BOGO_RE.search(text)
    if m:
        return {
            "discount": text.strip(),
            "discount_type": "bogo",
        }
    # Unknown structure — store raw text
    return {
        "discount": text.strip(),
        "discount_type": "other",
    }


def _extract_brand(text: str) -> Optional[str]:
    """
    Attempt to extract a brand name from a deal line.
    Brand names typically appear at the start before "up to", "—", or a discount amount.
    """
    # Strip common suffixes first
    cleaned = re.sub(r"\s+up\s+to\s+.*$", "", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+[\d.]+\s*%.*$", "", cleaned)
    cleaned = re.sub(r"\s*\$\d+.*$", "", cleaned)
    cleaned = cleaned.strip()

    # Reject lines that are pure discount text
    if re.match(r"^(buy|bogo|get|free|off|\d)", cleaned, re.IGNORECASE):
        return None

    # Brand name is typically 1–5 words, no lowercase "the", "a", etc.
    if 1 <= len(cleaned.split()) <= 6 and len(cleaned) >= 2:
        return cleaned

    return None


def _parse_deal_line(line: str) -> Optional[dict]:
    """
    Parse a single deal line into a structured deal dict.
    Returns None if the line doesn't contain a recognizable deal.
    """
    line = line.strip()
    if not line or len(line) < 4:
        return None

    # Skip lines that are just day names or headers
    if line.lower() in DAYS_OF_WEEK:
        return None

    discount_info = _classify_discount(line)
    if discount_info["discount_type"] == "other" and not any(
        kw in line.lower() for kw in ["off", "free", "bogo", "buy", "deal", "special", "%", "$"]
    ):
        return None

    brand = _extract_brand(line)
    result: dict = {}
    if brand:
        result["brand"] = brand
    result.update(discount_info)
    return result


# ---------------------------------------------------------------------------
# Section parsing
# ---------------------------------------------------------------------------


def _parse_sections(lines: list[str]) -> dict:
    """
    Walk the text lines and bucket them into day sections, happy hour, and everyday.
    Returns the structured promo dict (without raw_text).
    """
    weekly: dict[str, list] = {day: [] for day in DAYS_OF_WEEK}
    everyday: list[dict] = []
    happy_hour = {"time_range": None, "deals": []}

    current_day: Optional[str] = None
    in_happy_hour = False

    for line in lines:
        line_lower = line.lower().strip()
        if not line_lower:
            continue

        # Detect day-of-week header
        matched_day = None
        for day in DAYS_OF_WEEK:
            if re.match(rf"^{day}s?\b", line_lower):
                matched_day = day
                break
        if matched_day:
            current_day = matched_day
            in_happy_hour = False
            continue

        # Detect happy hour header
        if HAPPY_HOUR_RE.search(line):
            in_happy_hour = True
            current_day = None
            # Extract time range from the same line if present
            m = TIME_RANGE_RE.search(line)
            if m:
                happy_hour["time_range"] = f"{m.group(1).strip()}-{m.group(2).strip()}"
            continue

        # Check for time range on its own line
        m = TIME_RANGE_RE.search(line)
        if m and in_happy_hour and not happy_hour["time_range"]:
            happy_hour["time_range"] = f"{m.group(1).strip()}-{m.group(2).strip()}"
            # The line may also contain deal text after the time range
            remaining = line[m.end():].strip(" –-—")
            if remaining:
                deal = _parse_deal_line(remaining)
                if deal:
                    happy_hour["deals"].append(deal.get("discount", remaining))
            continue

        # Detect "everyday" deals
        if EVERYDAY_RE.search(line):
            in_happy_hour = False
            current_day = None
            deal = _parse_deal_line(re.sub(EVERYDAY_RE, "", line).strip())
            if deal:
                everyday.append(deal)
            continue

        # Route deal line to current section
        deal = _parse_deal_line(line)
        if not deal:
            continue

        if in_happy_hour:
            happy_hour["deals"].append(deal.get("discount", line.strip()))
        elif current_day:
            weekly[current_day].append(deal)
        else:
            everyday.append(deal)

    # Remove empty day entries
    weekly_clean = {day: deals for day, deals in weekly.items() if deals}

    return {
        "happy_hour": happy_hour if (happy_hour["time_range"] or happy_hour["deals"]) else {},
        "weekly": weekly_clean,
        "everyday": everyday,
    }


# ---------------------------------------------------------------------------
# HTML parsing
# ---------------------------------------------------------------------------


def parse_description(html: Optional[str]) -> dict:
    """
    Parse a dispensary listing's HTML description field into a structured
    promotional schedule.

    Args:
        html: Raw HTML string from the description field. May be None or empty.

    Returns:
        Structured promo dict with keys: happy_hour, weekly, everyday, raw_text.
        Returns empty structure on malformed or missing input — never raises.
    """
    empty = {"happy_hour": {}, "weekly": {}, "everyday": [], "raw_text": ""}

    if not html:
        return empty

    try:
        soup = BeautifulSoup(html, "html.parser")
        raw_text = soup.get_text(separator="\n")
        lines = [line.strip() for line in raw_text.splitlines()]
        lines = [line for line in lines if line]

        result = _parse_sections(lines)
        result["raw_text"] = raw_text.strip()
        return result

    except Exception as exc:
        logger.warning("promo_parser: failed to parse description HTML: %s", exc)
        return empty


# ---------------------------------------------------------------------------
# Database persistence
# ---------------------------------------------------------------------------


def _get_conn() -> psycopg2.extensions.connection:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise EnvironmentError("DATABASE_URL is not set.")
    return psycopg2.connect(url)


def _table_exists(conn, table_name: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = %s
            )
            """,
            (table_name,),
        )
        return bool(cur.fetchone()[0])


def store_promo_schedule(
    competitor_id: str,
    html_description: Optional[str],
    source_url: Optional[str] = None,
) -> Optional[dict]:
    """
    Parse a dispensary's HTML description and persist the result.

    Stores to `promo_schedules` table if it exists, otherwise falls back
    to the `promotions` table using a flat record per parsed section.

    Args:
        competitor_id:    CannaSpy UUID for the competitor.
        html_description: Raw HTML from the listing's description field.
        source_url:       URL of the listing (for provenance).

    Returns:
        The parsed promo dict, or None if nothing was stored.
    """
    parsed = parse_description(html_description)

    if not parsed["weekly"] and not parsed["everyday"] and not parsed["happy_hour"]:
        logger.debug("No promo data extracted for competitor=%s", competitor_id)
        return None

    try:
        conn = _get_conn()

        if _table_exists(conn, "promo_schedules"):
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO promo_schedules (competitor_id, schedule_json, source_url)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (competitor_id)
                    DO UPDATE SET schedule_json = EXCLUDED.schedule_json,
                                  source_url = EXCLUDED.source_url,
                                  updated_at = NOW()
                    """,
                    (competitor_id, json.dumps(parsed), source_url),
                )
            conn.commit()
            logger.info("Stored promo schedule for competitor=%s", competitor_id)

        else:
            # Fallback: write to promotions table as a single promo record
            promo_text = json.dumps({
                "happy_hour": parsed["happy_hour"],
                "weekly": parsed["weekly"],
                "everyday": parsed["everyday"],
            })
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO promotions (
                        competitor_id, promo_text, promo_type, source_url, active
                    ) VALUES (%s, %s, 'weekly_schedule', %s, TRUE)
                    """,
                    (competitor_id, promo_text, source_url),
                )
            conn.commit()
            logger.info(
                "Stored promo schedule in promotions table for competitor=%s",
                competitor_id,
            )

        conn.close()

    except Exception as exc:
        logger.error(
            "Failed to store promo schedule for competitor=%s: %s",
            competitor_id, exc, exc_info=True,
        )

    return parsed
