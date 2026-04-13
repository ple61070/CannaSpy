import { query } from '../db/client'

export interface PriceMatrix {
  competitor_id: string
  competitor_name: string
  product_id: string
  canonical_name: string
  category: string
  price: number
  in_stock: boolean
  on_promo: boolean
  detected_at: string
}

export async function getPriceMatrix(locationId: string, orgId: string, category?: string): Promise<PriceMatrix[]> {
  const categoryFilter = category ? 'AND p.category = $3' : ''
  const params: unknown[] = [locationId, orgId]
  if (category) params.push(category)

  const result = await query<PriceMatrix>(
    `SELECT DISTINCT ON (po.competitor_id, po.product_id)
       po.competitor_id,
       c.name as competitor_name,
       po.product_id,
       p.canonical_name,
       p.category,
       po.price::float as price,
       po.in_stock,
       po.on_promo,
       po.detected_at
     FROM price_observations po
     JOIN products p ON p.id = po.product_id
     JOIN competitors c ON c.id = po.competitor_id
     JOIN tracked_competitors tc ON tc.competitor_id = po.competitor_id
       AND tc.location_id = $1 AND tc.active = TRUE
     JOIN locations l ON l.id = tc.location_id AND l.org_id = $2
     ${categoryFilter}
     ORDER BY po.competitor_id, po.product_id, po.detected_at DESC`,
    params
  )

  return result.rows
}
