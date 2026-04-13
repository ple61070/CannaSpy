# CannaSpy API

Fastify-based REST API for the CannaSpy competitive intelligence platform.

## Stack

- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Fastify 4
- **Auth**: Clerk (`@clerk/fastify`)
- **Database**: PostgreSQL via Supabase (`pg` pool)
- **Queue**: BullMQ + Redis (IORedis)
- **AI**: Anthropic Claude (product name normalization)
- **Billing**: Stripe
- **Email**: Resend

## Development

```bash
# From repo root
pnpm dev:api

# Or directly
cd packages/api
pnpm dev
```

## Environment

Copy `../../.env.example` to `../../.env` and fill in all values before starting.

## Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (no auth) |
| GET | `/api/v1/organizations/me` | Get current org |
| POST | `/api/v1/organizations` | Create org |
| GET | `/api/v1/locations` | List locations |
| GET | `/api/v1/locations/:id` | Get location |
| POST | `/api/v1/locations` | Create location |
| PATCH | `/api/v1/locations/:id` | Update location |
| GET | `/api/v1/locations/:id/competitors` | List tracked competitors |
| POST | `/api/v1/locations/:id/competitors` | Add tracked competitor |
| GET | `/api/v1/competitors/:id` | Get competitor |
| POST | `/api/v1/competitors` | Create competitor |
| GET | `/api/v1/competitors/:id/prices` | Get price history |
| GET | `/api/v1/competitors/:id/promotions` | Get active promotions |
| GET | `/api/v1/blocks` | List active blocks |
| POST | `/api/v1/blocks` | Create block |
| DELETE | `/api/v1/blocks/:id` | Cancel block |
| GET | `/api/v1/prices/matrix` | Price comparison matrix |
| GET | `/api/v1/prices/history` | Price history for a competitor |
| GET | `/api/v1/alerts` | List alerts (filterable) |
| PATCH | `/api/v1/alerts/:id/reviewed` | Mark alert reviewed |
| GET | `/api/v1/billing/usage` | Slot usage + cost summary |
| POST | `/api/v1/billing/checkout` | Create Stripe checkout session |

## Workers

BullMQ workers run in-process and process four queues:

- **scrape-queue** — spawns Python scraper, writes `price_observations` + `promotions`
- **normalize-queue** — calls Claude to canonicalize raw product names, writes `products`
- **diff-queue** — compares current vs. previous observations, generates `alerts`
- **alert-queue** — dispatches notifications via Resend based on `notification_preferences`

## Build

```bash
pnpm build   # outputs to dist/
pnpm start   # runs dist/index.js
```
