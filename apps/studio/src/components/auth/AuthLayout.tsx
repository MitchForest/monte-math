import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

interface AuthLayoutProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#eff3ff] via-[#f3f6fc] to-[#eef8ff] px-4">
      <Card className="w-full max-w-md border border-border/70 bg-card/95 p-8 shadow-[var(--shadow-soft)]">
        <div className="mb-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
            Monte Math Studio
          </p>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="space-y-6">{children}</div>
        {footer ? (
          <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </Card>
    </div>
  )
}
