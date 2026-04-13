import { useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'

/**
 * Returns a fetch wrapper that automatically injects the Clerk Bearer token.
 * Call at component/hook top level; use the returned function anywhere.
 */
export function useAuthFetch() {
  const { getToken } = useAuth()

  return useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const token = await getToken()
      console.debug('[useAuthFetch] token:', token ? `${token.slice(0, 20)}…` : 'NULL')
      const existing = (options.headers || {}) as Record<string, string>
      const headers: Record<string, string> = { ...existing }
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json'
      if (token) headers['Authorization'] = `Bearer ${token}`
      return fetch(url, { ...options, headers })
    },
    [getToken]
  )
}
