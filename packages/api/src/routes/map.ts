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

export async function mapRoutes(fastify: FastifyInstance) {
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

      // Build WHERE clause
      const params: unknown[] = [west, south, east, north, maxLimit]
      let paramIdx = 6
      let where = `WHERE d.lat IS NOT NULL AND d.lng IS NOT NULL
        AND d.lng BETWEEN $1 AND $3
        AND d.lat BETWEEN $2 AND $4`

      if (tier) {
        where += ` AND d.market_tier = $${paramIdx++}`
        params.push(tier)
      }
      if (type) {
        where += ` AND d.license_type = $${paramIdx++}`
        params.push(type)
      }
      if (enriched === 'true') {
        where += ` AND d.enriched = true`
      } else if (enriched === 'false') {
        where += ` AND d.enriched = false`
      }
      if (q) {
        where += ` AND d.name ILIKE $${paramIdx++}`
        params.push(`%${q}%`)
      }

      const orgParam = `$${paramIdx}`
      params.push(orgDbId)

      const sql = `
        SELECT
          d.id,
          d.dcc_license,
          d.name,
          d.city,
          d.county,
          d.license_type,
          d.market_tier,
          d.enriched,
          d.threat_score,
          d.price_observations_count,
          d.last_scraped_at,
          d.lat,
          d.lng,
          COALESCE(ods.track_state, 'untracked') AS track_state
        FROM dispensaries d
        LEFT JOIN org_dispensary_state ods
          ON ods.dispensary_id = d.id
          AND ods.org_id = ${orgParam}
        ${where}
        ORDER BY d.threat_score DESC NULLS LAST
        LIMIT $5
      `

      try {
        const result = await query(sql, params)

        const geojson = {
          type: 'FeatureCollection' as const,
          features: result.rows.map((r: any) => ({
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
              market_tier: r.market_tier,
              enriched: r.enriched,
              threat_score: r.threat_score,
              price_observations_count: r.price_observations_count,
              last_scraped_at: r.last_scraped_at,
              track_state: r.track_state,
            },
          })),
        }

        reply.header('Cache-Control', 'public, max-age=60')
        return { success: true, data: geojson, count: result.rows.length }
      } catch (err: any) {
        // Gracefully handle missing dispensaries / org_dispensary_state tables
        const msg: string = err?.message || String(err)
        if (
          msg.includes('relation "dispensaries" does not exist') ||
          msg.includes('relation "org_dispensary_state" does not exist')
        ) {
          reply.header('Cache-Control', 'public, max-age=60')
          return {
            success: true,
            data: { type: 'FeatureCollection', features: [] },
            count: 0,
          }
        }
        req.log.error({ err: msg }, '[map] dispensaries query error')
        return reply
          .code(500)
          .send({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' })
      }
    }
  )
}
