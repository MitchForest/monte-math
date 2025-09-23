import { useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { apiClient } from '@/lib/orpc-client'
import { useSessionStore } from '@/stores/session-store'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { SettingsSheet } from './SettingsSheet'

function initials(name?: string | null) {
  if (!name) return 'MM'
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'MM'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  const user = useSessionStore((state) => state.user)
  const clearSession = useSessionStore((state) => state.clear)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: xpData } = useQuery({
    queryKey: ['xp', 'progress', user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => apiClient.xp.getProgress({ userId: user!.id }),
    staleTime: 1000 * 60,
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.auth.logout()
    },
    onSuccess: () => {
      clearSession()
      queryClient.clear()
      navigate({ to: '/login' })
    },
  })

  const xpGoal = xpData?.goal ?? 100
  const xpToday = xpData?.todayXP ?? 0
  const xpPercent = xpGoal === 0 ? 0 : Math.min(100, Math.round((xpToday / xpGoal) * 100))
  const streak = xpData?.streak ?? 0

  const avatarAlt = useMemo(() => `${user?.displayName ?? 'Explorer'} avatar`, [user?.displayName])

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#fef1f5] via-[#f5f8ff] to-[#e9f7ff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,163,132,0.25)_0%,_rgba(255,207,68,0.18)_45%,_transparent_75%)]" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
            <div className="flex items-center gap-4 rounded-[calc(var(--radius)/1.4)] bg-white/60 px-5 py-3 shadow-[var(--shadow-soft)]">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  XP
                </span>
                <span className="text-2xl font-black text-foreground">{xpToday}</span>
              </div>
              <div className="w-40">
                <Progress value={xpPercent} />
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  Goal {xpGoal} · {xpPercent}% there
                </p>
              </div>
              <Badge className="rounded-full bg-accent text-xs uppercase tracking-wide text-accent-foreground">
                {streak} day streak
              </Badge>
            </div>

            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.5em] text-muted-foreground">
                Today
              </p>
              <h1 className="mt-1 text-4xl font-black uppercase tracking-[0.12em] text-foreground drop-shadow-sm">
                Monte Math
              </h1>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'group flex items-center gap-3 rounded-full border-2 border-transparent bg-white/70 px-3 py-2 text-left shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  )}
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={user?.avatarUrl ?? undefined} alt={avatarAlt} />
                    <AvatarFallback>{initials(user?.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col sm:flex">
                    <span className="text-sm font-semibold text-foreground">
                      {user?.displayName ?? 'Explorer'}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Tap for menu
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={12} className="w-64">
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    setSettingsOpen(true)
                  }}
                >
                  User Settings
                </DropdownMenuItem>
                <DropdownMenuItem disabled>Metrics (coming soon)</DropdownMenuItem>
                <DropdownMenuItem disabled>Knowledge Graph (coming soon)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    logoutMutation.mutate()
                  }}
                  className="text-destructive"
                >
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10">{children}</main>
      </div>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
