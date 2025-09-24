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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/10 px-8 py-12 text-center backdrop-blur">
        <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
          Monte Math Preview
        </span>
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          Concrete math lessons, ready for the web.
        </h1>
        <p className="max-w-xl text-base text-white/80 sm:text-lg">
          Sign in to explore the student experience or create an account to start testing the latest
          Montessori-inspired flows.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {isAuthenticated ? (
            <Button asChild size="lg" variant="secondary">
              <Link to="/app">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
        {isAuthenticated ? (
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="text-sm font-semibold text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
