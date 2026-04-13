"""
normalizer.py — Claude API product name normalization.

Normalizes raw product names across dispensary menus to canonical SKUs
so cross-dispensary price comparisons are valid.

Called by NormalizeWorker (Node.js) which passes raw names and expects
JSON back with canonical matches.
"""

import os
import json
import hashlib
import redis
import anthropic
from typing import Optional


CLAUDE_MODEL = "claude-sonnet-4-6"
CACHE_TTL = 60 * 60 * 24 * 30  # 30 days
BATCH_SIZE = 20

NORMALIZATION_PROMPT = """You are normalizing cannabis product names across dispensary menus.

Given these raw product names from different dispensaries, identify which
refer to the same product and return a canonical name + confidence score.

Rules:
- Same brand + strain + package size = same product (high confidence)
- Same brand + strain, different size = different products
- Abbreviations like "BD" for "Blue Dream" are acceptable matches
- If you cannot determine equivalency with >70% confidence, flag as ambiguous

Return a JSON object where each key is the exact input raw name and value matches this schema:
{
  "canonical_name": string,
  "brand": string | null,
  "category": "flower"|"edible"|"concentrate"|"vape"|"preroll"|"topical",
  "package_size": string | null,
  "confidence": "high" | "medium" | "low",
  "ambiguous": boolean
}

Raw product names:
"""


class Normalizer:
    def __init__(
        self,
        anthropic_api_key: Optional[str] = None,
        redis_url: Optional[str] = None,
    ):
        self.client = anthropic.Anthropic(
            api_key=anthropic_api_key or os.environ.get("ANTHROPIC_API_KEY")
        )
        redis_url = redis_url or os.environ.get("REDIS_URL", "redis://localhost:6379")
        self.redis = redis.from_url(redis_url, decode_responses=True)

    def normalize_batch(self, raw_names: list[str]) -> dict:
        """
        Normalize a batch of raw product names.
        Returns dict mapping raw_name -> normalized product data.
        """
        cache_key = self._cache_key(raw_names)
        cached = self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Split into batches
        results = {}
        for i in range(0, len(raw_names), BATCH_SIZE):
            batch = raw_names[i:i + BATCH_SIZE]
            batch_results = self._call_claude(batch)
            results.update(batch_results)

        self.redis.setex(cache_key, CACHE_TTL, json.dumps(results))
        return results

    def _call_claude(self, raw_names: list[str]) -> dict:
        """Call Claude API for a batch of raw names."""
        prompt = NORMALIZATION_PROMPT + "\n".join(
            f"{i + 1}. {name}" for i, name in enumerate(raw_names)
        )

        response = self.client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text if response.content else ""

        # Extract JSON from response
        import re
        json_match = re.search(r"\{[\s\S]*\}", text)
        if not json_match:
            # Return low-confidence fallbacks
            return {
                name: {
                    "canonical_name": name,
                    "brand": None,
                    "category": "unknown",
                    "package_size": None,
                    "confidence": "low",
                    "ambiguous": True,
                }
                for name in raw_names
            }

        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            return {
                name: {
                    "canonical_name": name,
                    "brand": None,
                    "category": "unknown",
                    "package_size": None,
                    "confidence": "low",
                    "ambiguous": True,
                }
                for name in raw_names
            }

    def normalize_single(self, raw_name: str) -> dict:
        """Normalize a single product name."""
        return self.normalize_batch([raw_name]).get(raw_name, {
            "canonical_name": raw_name,
            "brand": None,
            "category": "unknown",
            "package_size": None,
            "confidence": "low",
            "ambiguous": True,
        })

    def _cache_key(self, raw_names: list[str]) -> str:
        """Generate a cache key from sorted raw names."""
        content = "|".join(sorted(raw_names))
        return f"normalize:{hashlib.sha256(content.encode()).hexdigest()}"
