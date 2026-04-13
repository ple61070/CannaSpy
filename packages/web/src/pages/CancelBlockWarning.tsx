import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthFetch } from '../lib/useAuthFetch'
import CancelWarning from '../components/blocking/CancelWarning'

const API = import.meta.env.VITE_API_URL ?? ''

export default function CancelBlockWarning() {
  const authFetch = useAuthFetch()
  const { blockId } = useParams<{ blockId: string }>()
  const navigate = useNavigate()
  const [competitorName, setCompetitorName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!blockId) return
    authFetch(`${API}/api/v1/blocks`)
      .then((r) => r.json())
      .then((data) => {
        const block = (data.data?.blocks || data.blocks || []).find((b: any) => b.id === blockId)
        if (block) setCompetitorName(block.competitor_name)
      })
  }, [blockId])

  const handleConfirm = async () => {
    if (!blockId) return
    setLoading(true)
    try {
      await authFetch(`${API}/api/v1/blocks/${blockId}`, { method: 'DELETE' })
      navigate('/blocks')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CancelWarning
      competitorName={competitorName || 'this competitor'}
      onConfirm={handleConfirm}
      onKeep={() => navigate('/blocks')}
      isLoading={loading}
    />
  )
}
