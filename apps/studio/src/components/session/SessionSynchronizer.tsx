import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/orpc-client'
import { useSessionStore, getSessionState } from '@/stores/session-store'

function isUnauthorized(error: unknown) {
  if (!error || typeof error !== 'object') return false
  if ('code' in error && (error as Record<string, unknown>).code === 'UNAUTHORIZED') return true
  if ('status' in error && (error as Record<string, unknown>).status === 401) return true
  return false
}

export function SessionSynchronizer() {
  const hydrate = useSessionStore((state) => state.hydrate)
  const clear = useSessionStore((state) => state.clear)
  const setStatus = useSessionStore((state) => state.setStatus)
  const status = useSessionStore((state) => state.status)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (status === 'idle') {
      setStatus('loading')
    }
  }, [status, setStatus])

  useQuery({
    queryKey: ['auth', 'me'],
    enabled: status === 'loading',
    queryFn: () => apiClient.auth.me(),
    retry: false,
    staleTime: 1000 * 60 * 5,
    onSuccess: (data) => {
      hydrate(data)
      queryClient.setQueryData(['auth', 'me'], data)
    },
    onError: (error) => {
      if (isUnauthorized(error)) {
        clear()
      } else {
        setStatus('unauthenticated')
      }
    },
  })

  useEffect(() => {
    if (status === 'authenticated') {
      const snapshot = getSessionState()
      if (snapshot.user && snapshot.session) {
        queryClient.setQueryData(['auth', 'me'], {
          user: snapshot.user,
          session: snapshot.session,
        })
      }
    }
  }, [status, queryClient])

  return null
}
