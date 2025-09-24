import { Link } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/orpc-client'
import { useSessionStore } from '@/stores/session-store'

export function HomeView() {
  const status = useSessionStore((state) => state.status)
  const clearSession = useSessionStore((state) => state.clear)
  const queryClient = useQueryClient()

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.auth.logout()
    },
    onSuccess: () => {
      clearSession()
      queryClient.clear()
    },
  })

  const isAuthenticated = status === 'authenticated'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
          Monte Math
        </h1>
        <p className="mt-4 text-xl text-muted-foreground sm:text-2xl">Learning Management System</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/signup">Sign up</Link>
          </Button>
        </div>
        {isAuthenticated ? (
          <div className="mt-6 text-sm text-muted-foreground">
            Already signed in?{' '}
            <Button
              variant="link"
              size="sm"
              className="px-1 py-0"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
