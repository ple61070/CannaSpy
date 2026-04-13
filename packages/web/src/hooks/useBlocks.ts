import { useState, useEffect } from 'react'
import { useAuthFetch } from '../lib/useAuthFetch'

const API = import.meta.env.VITE_API_URL ?? ''

export interface Block {
  id: string
  competitor_id: string
  competitor_name: string
  competitor_address: string
  blocked_at: string
  notify_on_unblock: boolean
}

export function useBlocks() {
  const authFetch = useAuthFetch()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBlocks = async () => {
    setLoading(true)
    try {
      const res = await authFetch(`${API}/api/v1/blocks`)
      if (!res.ok) throw new Error('Failed to fetch blocks')
      const data = await res.json()
      setBlocks(data.data?.blocks || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelBlock = async (blockId: string): Promise<void> => {
    const res = await authFetch(`${API}/api/v1/blocks/${blockId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to cancel block')
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
  }

  useEffect(() => { fetchBlocks() }, [])

  return { blocks, loading, error, cancelBlock, refetch: fetchBlocks }
}
