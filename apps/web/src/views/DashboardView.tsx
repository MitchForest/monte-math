import { NextLessonCard } from '@/components/student/NextLessonCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function DashboardView() {
  return (
    <div className="flex flex-col gap-10">
      <NextLessonCard />

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="border-dashed border-primary/40 bg-white/70">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">My Progress Metrics</CardTitle>
            <CardDescription>Coming soon: charts that celebrate your wins and streaks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">
              We&apos;re cooking up a playful dashboard to show XP trends, time on task, and your proudest badges.
            </p>
            <Button variant="outline" disabled>
              Stay tuned
            </Button>
          </CardContent>
        </Card>
        <Card className="border-dashed border-secondary/50 bg-white/70">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">My Knowledge Map</CardTitle>
            <CardDescription>Coming soon: trace the constellation of skills you&apos;ve mastered.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ll soon reveal your personal learning galaxy so you can explore what&apos;s next at a glance.
            </p>
            <Button variant="outline" disabled>
              In build mode
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
