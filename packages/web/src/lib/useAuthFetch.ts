import { useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'

/**
 * Returns a fetch wrapper that automatically injects the Clerk Bearer token.
 * Waits for Clerk to finish loading before resolving the token.
 * Call at component/hook top level; use the returned function anywhere.
 */
export function useAuthFetch() {
  const { getToken, isLoaded } = useAuth()

  return useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      // Wait up to 3s for Clerk to finish loading before making the request
      if (!isLoaded) {
        await new Promise<void>((resolve) => {
          const start = Date.now()
          const interval = setInterval(() => {
            if (isLoaded || Date.now() - start > 3000) {
              clearInterval(interval)
              resolve()
            }
          }, 50)
        })
      }
      const token = await getToken()
      const existing = (options.headers || {}) as Record<string, string>
      const headers: Record<string, string> = { ...existing }
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json'
      if (token) headers['Authorization'] = `Bearer ${token}`
      return fetch(url, { ...options, headers })
    },
    [getToken, isLoaded]
  )
}
