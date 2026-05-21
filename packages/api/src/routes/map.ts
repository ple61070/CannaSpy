import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getAuth } from '@clerk/fastify'
import { getAdminDb } from '../db/client'

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
      const supabase = getAdminDb()

      const { data, error } = await supabase
        .from('dispensaries')
        .select('id, name, address, city, county, business_type, dcc_license, lat, lng')
        .ilike('name', `%${q.trim()}%`)
        .order('name', { ascending: true })
        .limit(maxLimit)

      if (error) {
        req.log.error({ err: error.message }, '[map/suggest] query error')
        return reply.code(500).send({ success: false, error: 'Internal server error' })
      }

      reply.header('Cache-Control', 'public, max-age=30')
      return { success: true, data: data ?? [] }
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
        const supabase = getAdminDb()

        // Build dispensaries query via PostgREST (bypasses pg Pool / pooler)
        let dispensaryQuery = supabase
          .from('dispensaries')
          .select(
            'id, dcc_license, name, city, county, license_type, business_type, market_tier, enriched, threat_score, price_observations_count, last_scraped_at, lat, lng'
          )
          .not('lat', 'is', null)
          .not('lng', 'is', null)
          .gte('lng', west)
          .lte('lng', east)
          .gte('lat', south)
          .lte('lat', north)
          .order('threat_score', { ascending: false, nullsFirst: false })
          .limit(maxLimit)

        if (tier) {
          dispensaryQuery = dispensaryQuery.eq('market_tier', tier)
        }
        if (type && type !== 'both') {
          dispensaryQuery = dispensaryQuery.eq('business_type', type)
        }
        if (enriched === 'true') {
          dispensaryQuery = dispensaryQuery.eq('enriched', true)
        } else if (enriched === 'false') {
          dispensaryQuery = dispensaryQuery.eq('enriched', false)
        }
        if (q) {
          dispensaryQuery = dispensaryQuery.ilike('name', `%${q}%`)
        }

        const { data: dispensaries, error: dispError } = await dispensaryQuery

        if (dispError) {
          req.log.error({ err: dispError.message }, '[map] dispensaries query error')
          return reply
            .code(500)
            .send({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' })
        }

        // Fetch org track states if authenticated
        let trackStateMap: Record<string, string> = {}
        if (orgDbId && dispensaries && dispensaries.length > 0) {
          const dispensaryIds = dispensaries.map((d: any) => d.id)
          const { data: trackStates } = await supabase
            .from('org_dispensary_state')
            .select('dispensary_id, track_state')
            .eq('org_id', orgDbId)
            .in('dispensary_id', dispensaryIds)

          if (trackStates) {
            for (const ts of trackStates as { dispensary_id: string; track_state: string }[]) {
              trackStateMap[ts.dispensary_id] = ts.track_state
            }
          }
        }

        const geojson = {
          type: 'FeatureCollection' as const,
          features: (dispensaries || []).map((r: any) => ({
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
        return { success: true, data: geojson, count: (dispensaries || []).length }
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
