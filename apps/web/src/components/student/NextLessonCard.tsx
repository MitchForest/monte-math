import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSessionStore } from '@/stores/session-store'
import { apiClient } from '@/lib/orpc-client'

const pulsing = {
  animate: {
    y: [0, -4, 0],
    transition: {
      repeat: Infinity,
      duration: 4,
      ease: 'easeInOut',
    },
  },
}

export function NextLessonCard() {
  const userId = useSessionStore((state) => state.user?.id)

  const { data, isLoading } = useQuery({
    queryKey: ['engine', 'next-task', userId],
    enabled: Boolean(userId),
    queryFn: () => apiClient.engine.getNextTask({ userId: userId! }),
    staleTime: 1000 * 60,
  })

  const today = useMemo(() => format(new Date(), 'EEE, MMM d'), [])

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-card to-primary/10">
        <CardHeader>
          <CardTitle>Loading your next adventure…</CardTitle>
          <CardDescription>We are building the next quest just for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse rounded-[calc(var(--radius)/1.1)] bg-white/60" />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-card to-secondary/15">
        <CardHeader>
          <CardTitle>Ready for launch?</CardTitle>
          <CardDescription>Start your learning streak with a brand new mission.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg">Explore lessons</Button>
        </CardContent>
      </Card>
    )
  }

  const subtitle =
    data.kind === 'lesson'
      ? 'Next lesson in your path'
      : data.kind === 'checkpoint'
        ? 'Checkpoint challenge'
        : 'Review mission'

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#fff7f0] via-[#f5f8ff] to-[#e3fff8]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <CardHeader className="relative z-10 gap-3">
        <Badge className="self-start bg-primary/20 text-primary">{subtitle}</Badge>
        <CardTitle className="text-4xl font-black text-foreground">
          {data.lessonId ? data.lessonId.replace(/[-]/g, ' ') : 'Keep exploring'}
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          {`Estimated XP ${data.estimatedXP} · ${today}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-4 text-muted-foreground">
          <p className="text-lg font-medium text-foreground">
            Jump back in where you left off or explore a fresh challenge curated by Monte Math.
          </p>
          <p>
            Keep tapping through activities to build your streak. Each mission is tuned to your pace
            so you stay in the sweet spot of learning.
          </p>
        </div>
        <motion.div
          className="flex flex-col items-center gap-4"
          variants={pulsing}
          animate="animate"
        >
          <Button size="lg" className="min-w-[220px]">
            {data.kind === 'lesson' ? 'Resume lesson' : 'Start mission'}
          </Button>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tap to continue
          </p>
        </motion.div>
      </CardContent>
    </Card>
  )
}
