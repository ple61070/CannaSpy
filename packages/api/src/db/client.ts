import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
