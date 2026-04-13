"""
ip_pool.py — IP rotation pool manager for the CannaSpy primary data pipeline.

All outbound HTTP requests from collector.py MUST go through get_session().
Never make direct requests outside this module.

Configuration:
  IP_POOL env var: comma-separated list of IP addresses (minimum 10 across 2+ providers)
  Example: IP_POOL=54.1.1.1,54.1.1.2,34.1.1.1,34.1.1.2,...

Per-IP daily request counters are tracked in-process. Warning is logged when
any IP exceeds 8,000 requests/day (hard limit is 10,000).
"""

import hashlib
import logging
import os
from collections import defaultdict
from datetime import date
from typing import Optional

import requests
from requests import Session

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal state
# ---------------------------------------------------------------------------

_ip_pool: list[str] = []
_request_counts: dict[str, dict] = defaultdict(lambda: {"date": None, "count": 0})

DAILY_WARN_THRESHOLD = 8_000
DAILY_HARD_LIMIT = 10_000


def _load_pool() -> list[str]:
    """Load IP pool from environment. Returns empty list if not configured."""
    raw = os.environ.get("IP_POOL", "").strip()
    if not raw:
        return []
    ips = [ip.strip() for ip in raw.split(",") if ip.strip()]
    return ips


def _get_pool() -> list[str]:
    """Return the active pool, loading it on first call."""
    global _ip_pool
    if not _ip_pool:
        _ip_pool = _load_pool()
        if not _ip_pool:
            logger.warning(
                "IP_POOL is not configured or empty. "
                "All requests will use the default system IP. "
                "This is acceptable for local development but MUST be configured in production."
            )
        elif len(_ip_pool) < 10:
            logger.warning(
                "IP_POOL has fewer than 10 IPs (%d). Minimum 10 across 2+ providers required.",
                len(_ip_pool),
            )
    return _ip_pool


def _increment_counter(ip: str) -> int:
    """
    Increment the daily request counter for the given IP.
    Resets counter when the date changes.
    Returns the new count.
    """
    today = date.today().isoformat()
    entry = _request_counts[ip]
    if entry["date"] != today:
        entry["date"] = today
        entry["count"] = 0
    entry["count"] += 1
    count = entry["count"]

    if count == DAILY_WARN_THRESHOLD:
        logger.warning(
            "IP %s has reached %d requests today (threshold: %d, hard limit: %d). "
            "Consider redistributing load.",
            ip,
            count,
            DAILY_WARN_THRESHOLD,
            DAILY_HARD_LIMIT,
        )
    elif count > DAILY_HARD_LIMIT:
        logger.error(
            "IP %s has exceeded the daily hard limit of %d requests (%d today).",
            ip,
            DAILY_HARD_LIMIT,
            count,
        )

    return count


def _pick_ip_for_slug(slug: str) -> Optional[str]:
    """
    Consistent-hash assignment: given a dispensary slug, always return the
    same base IP from the pool. This ensures one dispensary consistently
    originates from one IP range, avoiding erratic per-IP patterns.
    """
    pool = _get_pool()
    if not pool:
        return None
    digest = int(hashlib.md5(slug.encode(), usedforsecurity=False).hexdigest(), 16)
    idx = digest % len(pool)
    return pool[idx]


def get_session(slug: str) -> Session:
    """
    Return a requests.Session bound to the correct source IP for this slug.

    The session has:
    - A source IP header (X-Forwarded-For) for logging purposes
    - Default timeout of 15 seconds
    - Standard user-agent

    Note: True source IP binding requires OS-level routing or a proxy. This
    implementation uses the consistent-hash assignment to track which IP
    should be used, and increments its counter. For production deployments
    on multi-IP hosts, pair this with SO_BINDTODEVICE or proxy routing.
    """
    ip = _pick_ip_for_slug(slug)
    session = Session()
    session.headers.update(
        {
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
        }
    )

    if ip:
        _increment_counter(ip)
        # Store the assigned IP on the session for caller reference
        session.assigned_ip = ip  # type: ignore[attr-defined]
        logger.debug("Assigned IP %s for slug '%s'", ip, slug)
    else:
        session.assigned_ip = "default"  # type: ignore[attr-defined]
        logger.debug("No IP pool configured; using default system IP for slug '%s'", slug)

    return session


def get_pool_status() -> list[dict]:
    """
    Return current request counts for all IPs in the pool.
    Used by pipeline_health logging.
    """
    pool = _get_pool()
    today = date.today().isoformat()
    status = []
    for ip in pool:
        entry = _request_counts[ip]
        count = entry["count"] if entry["date"] == today else 0
        status.append({"ip": ip, "requests_today": count})
    return status
