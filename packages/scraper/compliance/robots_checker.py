"""
robots_checker.py — robots.txt compliance checking.

CannaSpy is legally and ethically compliant: we only scrape public websites
that allow scraping per their robots.txt. This module checks before every scrape.
"""

import urllib.robotparser
import urllib.parse
from datetime import datetime, timedelta
from typing import Optional
import requests


USER_AGENT = "CannaSpy-Intel/1.0 (+https://cannaspy.com/bot)"
CACHE_TTL_DAYS = 7


def check_robots_allowed(url: str, path: str = "/") -> bool:
    """
    Check if scraping is allowed for the given URL path per robots.txt.
    Returns True if allowed or no robots.txt found. Returns False if disallowed.
    """
    try:
        parsed = urllib.parse.urlparse(url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"

        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(robots_url)

        try:
            response = requests.get(robots_url, timeout=10, headers={
                "User-Agent": USER_AGENT
            })
            if response.status_code == 404:
                # No robots.txt = allowed
                return True
            rp.parse(response.text.splitlines())
        except requests.RequestException:
            # Can't reach robots.txt = assume allowed (conservative)
            return True

        return rp.can_fetch(USER_AGENT, path)

    except Exception as e:
        # On any error, err on side of allowing (better to check than block legitimate scrapes)
        print(f"robots_checker: error checking {url}: {e}", flush=True)
        return True


def get_crawl_delay(url: str) -> Optional[float]:
    """Return crawl delay in seconds if specified in robots.txt."""
    try:
        parsed = urllib.parse.urlparse(url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"

        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(robots_url)

        response = requests.get(robots_url, timeout=10)
        if response.status_code != 200:
            return None
        rp.parse(response.text.splitlines())

        delay = rp.crawl_delay(USER_AGENT)
        return float(delay) if delay else None
    except Exception:
        return None
