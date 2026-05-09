"""
diff_engine.py — Price and product change detection between menu snapshots.

Compares two snapshots and generates change events for each detected delta.
Change events are written to the change_events table and returned as a list.

Supported event types:
  price_change    — same product, price changed
  new_product     — product in current snapshot, not in previous
  removed_product — product in previous snapshot, not in current
  sale_started    — on_sale changed FALSE → TRUE
  sale_ended      — on_sale changed TRUE → FALSE

Product matching priority:
  1. platform_item_id (exact match)
  2. normalized name + brand + category (fuzzy fallback)

Usage:
  from diff_engine import diff_snapshots
  events = diff_snapshots(prev_snapshot, curr_snapshot, dispensary_id)
"""

import json
import logging
import os
import re
from typing import Optional

import psycopg2

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Event types
# ---------------------------------------------------------------------------

EVENT_PRICE_CHANGE = "price_change"
EVENT_NEW_PRODUCT = "new_product"
EVENT_REMOVED_PRODUCT = "removed_product"
EVENT_SALE_STARTED = "sale_started"
EVENT_SALE_ENDED = "sale_ended"


# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------


def _normalize_name(name: Optional[str]) -> str:
    """Lowercase, strip punctuation, collapse whitespace for fuzzy matching."""
    if not name:
        return ""
    name = name.lower()
    name = re.sub(r"[^\w\s]", "", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def _item_key(item: dict) -> Optional[str]:
    """Primary match key: platform_item_id if available."""
    pid = item.get("platform_item_id")
    return str(pid) if pid else None


def _fuzzy_key(item: dict) -> str:
    """Fallback match key: normalized name + brand + category."""
    parts = [
        _normalize_name(item.get("name")),
        _normalize_name(item.get("brand")),
        _normalize_name(item.get("category")),
    ]
    return "|".join(parts)


def _build_index(items: list[dict]) -> tuple[dict, dict]:
    """
    Build two lookup dicts for a snapshot's item list:
      primary_idx: platform_item_id → item
      fuzzy_idx:   normalized-name|brand|category → item
    """
    primary_idx: dict[str, dict] = {}
    fuzzy_idx: dict[str, dict] = {}
    for item in items:
        key = _item_key(item)
        if key:
            primary_idx[key] = item
        fk = _fuzzy_key(item)
        if fk and fk != "||":
            fuzzy_idx[fk] = item
    return primary_idx, fuzzy_idx


def _find_item(
    target: dict,
    primary_idx: dict,
    fuzzy_idx: dict,
) -> Optional[dict]:
    """Locate target item in an index using primary key, then fuzzy fallback."""
    key = _item_key(target)
    if key and key in primary_idx:
        return primary_idx[key]
    fk = _fuzzy_key(target)
    return fuzzy_idx.get(fk)


# ---------------------------------------------------------------------------
# Event builders
# ---------------------------------------------------------------------------


def _price_change_event(dispensary_id: str, curr: dict, prev: dict) -> dict:
    return {
        "competitor_id": dispensary_id,
        "event_type": EVENT_PRICE_CHANGE,
        "platform_item_id": curr.get("platform_item_id"),
        "item_name": curr.get("name"),
        "brand": curr.get("brand"),
        "category": curr.get("category"),
        "old_value": {"price": prev.get("price"), "original_price": prev.get("original_price")},
        "new_value": {"price": curr.get("price"), "original_price": curr.get("original_price")},
    }


def _sale_started_event(dispensary_id: str, curr: dict) -> dict:
    return {
        "competitor_id": dispensary_id,
        "event_type": EVENT_SALE_STARTED,
        "platform_item_id": curr.get("platform_item_id"),
        "item_name": curr.get("name"),
        "brand": curr.get("brand"),
        "category": curr.get("category"),
        "old_value": {"on_sale": False},
        "new_value": {
            "on_sale": True,
            "discount_label": curr.get("discount_label"),
            "current_deal_title": curr.get("current_deal_title"),
        },
    }


def _sale_ended_event(dispensary_id: str, curr: dict) -> dict:
    return {
        "competitor_id": dispensary_id,
        "event_type": EVENT_SALE_ENDED,
        "platform_item_id": curr.get("platform_item_id"),
        "item_name": curr.get("name"),
        "brand": curr.get("brand"),
        "category": curr.get("category"),
        "old_value": {"on_sale": True},
        "new_value": {"on_sale": False},
    }


def _new_product_event(dispensary_id: str, item: dict) -> dict:
    return {
        "competitor_id": dispensary_id,
        "event_type": EVENT_NEW_PRODUCT,
        "platform_item_id": item.get("platform_item_id"),
        "item_name": item.get("name"),
        "brand": item.get("brand"),
        "category": item.get("category"),
        "old_value": None,
        "new_value": {
            "price": item.get("price"),
            "on_sale": item.get("on_sale"),
            "discount_label": item.get("discount_label"),
        },
    }


def _removed_product_event(dispensary_id: str, item: dict) -> dict:
    return {
        "competitor_id": dispensary_id,
        "event_type": EVENT_REMOVED_PRODUCT,
        "platform_item_id": item.get("platform_item_id"),
        "item_name": item.get("name"),
        "brand": item.get("brand"),
        "category": item.get("category"),
        "old_value": {
            "price": item.get("price"),
            "on_sale": item.get("on_sale"),
        },
        "new_value": None,
    }


# ---------------------------------------------------------------------------
# Database persistence
# ---------------------------------------------------------------------------


def _get_conn() -> psycopg2.extensions.connection:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise EnvironmentError("DATABASE_URL is not set.")
    # Strip params unsupported by psycopg2 (e.g. Supabase pooler adds uselibpqcompat)
    url = re.sub(r"[?&]uselibpqcompat=[^&]*", "", url).rstrip("?")
    return psycopg2.connect(url)


def _write_events(conn, events: list[dict]) -> None:
    """Bulk insert change events."""
    if not events:
        return
    with conn.cursor() as cur:
        cur.executemany(
            """
            INSERT INTO change_events (
                competitor_id, event_type, platform_item_id, item_name,
                brand, category, old_value, new_value
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            [
                (
                    e["competitor_id"],
                    e["event_type"],
                    e.get("platform_item_id"),
                    e.get("item_name"),
                    e.get("brand"),
                    e.get("category"),
                    json.dumps(e["old_value"]) if e.get("old_value") is not None else None,
                    json.dumps(e["new_value"]) if e.get("new_value") is not None else None,
                )
                for e in events
            ],
        )
    conn.commit()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def diff_snapshots(
    prev_items: list[dict],
    curr_items: list[dict],
    dispensary_id: str,
    persist: bool = True,
) -> list[dict]:
    """
    Compare two lists of normalized menu items and generate change events.

    Args:
        prev_items:     Previous snapshot's normalized item list.
        curr_items:     Current snapshot's normalized item list.
        dispensary_id:  CannaSpy UUID of the competitor.
        persist:        Write events to change_events table (default True).
                        Set False for testing with synthetic data.

    Returns:
        List of change event dicts.
    """
    if not prev_items and not curr_items:
        return []

    prev_primary, prev_fuzzy = _build_index(prev_items)
    curr_primary, curr_fuzzy = _build_index(curr_items)

    events: list[dict] = []

    # --- Detect changes in current items vs previous ---
    for curr_item in curr_items:
        prev_item = _find_item(curr_item, prev_primary, prev_fuzzy)

        if prev_item is None:
            # Product is new
            events.append(_new_product_event(dispensary_id, curr_item))
            continue

        curr_price = curr_item.get("price")
        prev_price = prev_item.get("price")
        curr_on_sale = bool(curr_item.get("on_sale"))
        prev_on_sale = bool(prev_item.get("on_sale"))

        # Price change (only when price is meaningful and actually changed)
        if (
            curr_price is not None
            and prev_price is not None
            and curr_price != prev_price
        ):
            events.append(_price_change_event(dispensary_id, curr_item, prev_item))

        # Sale status change
        if not prev_on_sale and curr_on_sale:
            events.append(_sale_started_event(dispensary_id, curr_item))
        elif prev_on_sale and not curr_on_sale:
            events.append(_sale_ended_event(dispensary_id, curr_item))

    # --- Detect removals: items in previous not found in current ---
    for prev_item in prev_items:
        curr_match = _find_item(prev_item, curr_primary, curr_fuzzy)
        if curr_match is None:
            events.append(_removed_product_event(dispensary_id, prev_item))

    logger.info(
        "diff_snapshots: dispensary=%s prev=%d curr=%d events=%d",
        dispensary_id, len(prev_items), len(curr_items), len(events),
    )

    if persist and events:
        try:
            conn = _get_conn()
            _write_events(conn, events)
            conn.close()
            logger.info("Wrote %d change events for dispensary=%s", len(events), dispensary_id)
        except Exception as exc:
            logger.error(
                "Failed to persist change events for dispensary=%s: %s",
                dispensary_id, exc, exc_info=True,
            )

    return events
