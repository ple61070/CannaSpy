import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'
import dns from 'dns'

// Railway's network doesn't route IPv6 — force all DNS resolutions to IPv4
// Must be applied before pool is created so pg's socket connections use IPv4
const _lookup = dns.lookup.bind(dns)
;(dns as any).lookup = (hostname: string, opts: any, cb: any) => {
  if (typeof opts === 'function') { cb = opts; opts = {} }
  return _lookup(hostname, { ...opts, family: 4 }, cb)
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export type QueryResult<T> = {
  rows: T[]
  rowCount: number | null
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = await db.connect()
  try {
    const result = await client.query(text, params)
    return { rows: result.rows as T[], rowCount: result.rowCount }
  } finally {
    client.release()
  }
}

// RLS-scoped Supabase client — sets JWT so RLS policies enforce org isolation
export function getDb(clerkToken: string) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${clerkToken}` } } }
  )
}

// INTERNAL ONLY — never export from any API route handler
// Lazy singleton to avoid crashing at startup if SUPABASE_SERVICE_ROLE_KEY is not set
let _adminDb: ReturnType<typeof createClient> | null = null
export function getAdminDb() {
  if (!_adminDb) {
    _adminDb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _adminDb
}
