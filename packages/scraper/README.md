# CannaSpy Scraper

Python scraper package for CannaSpy competitive intelligence pipeline.

## Role

This package collects price and promotion data from competitor dispensary websites. It is the data collection layer of the CannaSpy B2B SaaS platform serving California cannabis MSOs.

## Dispatch Pattern

The scraper is invoked by the Node.js `ScrapeWorker` (BullMQ) via `child_process.spawn()`:

```
python dispensary_scraper.py --competitor-id <uuid> --output json
```

The process writes a single JSON object to **stdout** and exits. All diagnostic output goes to **stderr**. Exit code `0` = success, `1` = failure.

The Node.js worker reads stdout, parses the JSON, and writes price observations to the database.

## Command-Line Interface

### dispensary_scraper.py (main entry point)

```
python packages/scraper/dispensary_scraper.py \
  --competitor-id <uuid>   # required: competitor UUID from DB
  --output json|pretty     # default: json (pretty for human inspection)
  --daemon                 # unused flag (reserved)
```

**Output schema:**
```json
{
  "competitor_id": "uuid",
  "platform_detected": "dutchie|custom",
  "prices": [
    { "raw_name": "...", "price": 12.00, "in_stock": true, "on_promo": false, "category": "flower" }
  ],
  "promotions": [
    { "promo_text": "...", "promo_type": "daily_special", "category": "...", "source_url": "..." }
  ],
  "scraped_at": "2024-01-01T00:00:00",
  "error": "optional error string"
}
```

## Package Structure

```
packages/scraper/
  dispensary_scraper.py     # Main entry point (spawned by Node.js)
  requirements.txt          # Python dependencies
  compliance/
    robots_checker.py       # robots.txt compliance (checked before every scrape)
  discovery/
    places_client.py        # Google Places API for competitor discovery
  parsers/
    dutchie_parser.py       # Dutchie GraphQL API parser
    html_parser.py          # Generic HTML fallback (Playwright + BeautifulSoup)
    normalizer.py           # Claude API product name normalization
```

## Compliance

- **robots.txt is checked before every scrape.** If disallowed, the scraper returns `robots_blocked: true` and writes no data.
- Only scrapes dispensaries' own public websites — never Weedmaps, Leafly, or aggregator platforms.
- Respects `Crawl-delay` directives.
- User-Agent: `CannaSpy-Intel/1.0 (+https://cannaspy.com/bot)`

## Setup

```bash
pip install -r packages/scraper/requirements.txt
playwright install chromium
```

Required environment variables (see `.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `ANTHROPIC_API_KEY` — for product name normalization
- `REDIS_URL` — for normalization cache
- `GOOGLE_PLACES_API_KEY` — for competitor discovery
