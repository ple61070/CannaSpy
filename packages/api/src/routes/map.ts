import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getAuth } from '@clerk/fastify'
import { query } from '../db/client'

interface MapQuerystring {
  bbox?: string
  tier?: string
  type?: string
  enriched?: string
  q?: string
  limit?: string
}

interface SuggestQuerystring {
  q?: string
  limit?: string
}

export async function mapRoutes(fastify: FastifyInstance) {
  // GET /api/v1/map/suggest — dispensary name autocomplete for location setup
  fastify.get(
    '/suggest',
    async (
      req: FastifyRequest<{ Querystring: SuggestQuerystring }>,
      reply: FastifyReply
    ) => {
      const { q, limit = '8' } = req.query
      if (!q || q.trim().length < 2) {
        return { success: true, data: [] }
      }

      const maxLimit = Math.min(parseInt(limit, 10) || 8, 20)
      const term = q.trim()

      const { rows, rowCount } = await query<{
        id: string; name: string; legal_name: string | null
        address: string; city: string; county: string
        business_type: string; dcc_license: string; lat: number | null; lng: number | null
      }>(
        `SELECT id, name, legal_name, address, city, county, business_type, dcc_license, lat, lng
         FROM dispensaries
         WHERE name ILIKE $1 OR legal_name ILIKE $1
         ORDER BY name ASC
         LIMIT $2`,
        [`%${term}%`, maxLimit]
      )

      reply.header('Cache-Control', 'public, max-age=30')
      return { success: true, data: rows }
    }
  )

  // GET /api/v1/map/dispensaries
  // Optional auth — if JWT present, include per-org track_state; if not, all 'untracked'
  fastify.get(
    '/dispensaries',
    async (
      req: FastifyRequest<{ Querystring: MapQuerystring }>,
      reply: FastifyReply
    ) => {
      const { bbox, tier, type, enriched, q, limit = '2000' } = req.query

      if (!bbox) {
        return reply
          .code(400)
          .send({ success: false, error: 'bbox required', code: 'VALIDATION_ERROR' })
      }

      const parts = bbox.split(',').map(Number)
      if (parts.length !== 4 || parts.some(isNaN)) {
        return reply.code(400).send({
          success: false,
          error: 'invalid bbox — expected "west,south,east,north"',
          code: 'VALIDATION_ERROR',
        })
      }

      const [west, south, east, north] = parts
      const maxLimit = Math.min(parseInt(limit, 10) || 2000, 5000)

      // Resolve org ID from Clerk JWT if present — optional auth, never hard-fail
      let orgDbId: string | null = null
      try {
        const auth = getAuth(req as any)
        if (auth?.userId && (req as any).auth?.orgDbId) {
          orgDbId = (req as any).auth.orgDbId
        }
      } catch {
        // No token or invalid token — continue as anonymous
      }

      try {
        // Build WHERE clause dynamically against Railway Postgres
        const conditions: string[] = [
          'lat IS NOT NULL', 'lng IS NOT NULL',
          'lng >= $1', 'lng <= $2', 'lat >= $3', 'lat <= $4',
        ]
        const params: (string | number | string[])[] = [west, east, south, north]
        let p = 5

        if (tier) {
          conditions.push(`market_tier = $${p++}`)
          params.push(tier)
        }
        if (type && type !== 'both') {
          // 'both' = microbusiness — can operate storefront + delivery; include in either filter
          const types = type === 'storefront'
            ? ['storefront', 'both']
            : type === 'delivery'
            ? ['delivery', 'both']
            : [type]
          conditions.push(`business_type = ANY($${p++}::text[])`)
          params.push(types)
        }
        if (enriched === 'true') {
          conditions.push('enriched = TRUE')
        } else if (enriched === 'false') {
          conditions.push('enriched = FALSE')
        }
        if (q) {
          conditions.push(`name ILIKE $${p++}`)
          params.push(`%${q}%`)
        }
        params.push(maxLimit)

        const { rows: dispensaries } = await query<{
          id: string; dcc_license: string; name: string; city: string; county: string
          license_type: string; business_type: string | null; market_tier: string | null
          enriched: boolean; threat_score: number | null; price_observations_count: number
          last_scraped_at: string | null; lat: number; lng: number
        }>(
          `SELECT id, dcc_license, name, city, county, license_type, business_type,
                  market_tier, enriched, threat_score, price_observations_count,
                  last_scraped_at, lat, lng
           FROM dispensaries
           WHERE ${conditions.join(' AND ')}
           ORDER BY threat_score DESC NULLS LAST
           LIMIT $${p}`,
          params
        )

        // Fetch org track states if authenticated
        let trackStateMap: Record<string, string> = {}
        if (orgDbId && dispensaries.length > 0) {
          const dispensaryIds = dispensaries.map((d) => d.id)
          const { rows: trackStates } = await query<{ dispensary_id: string; track_state: string }>(
            'SELECT dispensary_id, track_state FROM org_dispensary_state WHERE org_id = $1 AND dispensary_id = ANY($2::uuid[])',
            [orgDbId, dispensaryIds]
          )
          for (const ts of trackStates) {
            trackStateMap[ts.dispensary_id] = ts.track_state
          }
        }

        const geojson = {
          type: 'FeatureCollection' as const,
          features: dispensaries.map((r) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [Number(r.lng), Number(r.lat)],
            },
            properties: {
              id: r.id,
              dcc_license: r.dcc_license,
              name: r.name,
              city: r.city,
              county: r.county,
              license_type: r.license_type,
              business_type: r.business_type,
              market_tier: r.market_tier,
              enriched: r.enriched,
              threat_score: r.threat_score,
              price_observations_count: r.price_observations_count,
              last_scraped_at: r.last_scraped_at,
              track_state: trackStateMap[r.id] || 'untracked',
            },
          })),
        }

        reply.header('Cache-Control', 'public, max-age=60')
        return { success: true, data: geojson, count: dispensaries.length }
      } catch (err: any) {
        const msg: string = err?.message || String(err)
        req.log.error({ err: msg }, '[map] unexpected error')
        return reply
          .code(500)
          .send({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' })
      }
    }
  )
}
