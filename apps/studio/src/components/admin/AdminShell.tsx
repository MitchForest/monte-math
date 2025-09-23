import { ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSessionStore } from '@/stores/session-store'
import { Button } from '@/components/ui/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/orpc-client'

interface AdminShellProps {
  title: string
  description?: string
  children: ReactNode
}

const navItems = [
  { to: '/', label: 'Knowledge Graph' },
  { to: '/lessons', label: 'Lessons' },
]

function initials(name?: string | null) {
  if (!name) return 'MM'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'MM'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function AdminShell({ title, description, children }: AdminShellProps) {
  const user = useSessionStore((state) => state.user)
  const clearSession = useSessionStore((state) => state.clear)
  const queryClient = useQueryClient()
  const routerState = useRouterState()

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.auth.logout()
    },
    onSuccess: () => {
      clearSession()
      queryClient.clear()
    },
  })

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r border-border/70 bg-sidebar p-6 text-sidebar-foreground md:flex">
        <div className="mb-10 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Monte Math
          </p>
          <h1 className="text-2xl font-semibold">Studio</h1>
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const isActive = routerState.location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to as '/' | '/lessons'}
                className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-lg bg-muted/70 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.displayName ?? 'Admin'} />
            <AvatarFallback>{initials(user?.displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{user?.displayName ?? 'Admin'}</p>
            <p className="text-xs text-muted-foreground">{user?.email ?? 'No email'}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <header className="border-b border-border/60 bg-card/70 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                {description}
              </p>
              <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
