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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fff3f7] via-[#f5f8ff] to-[#e8fff5] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(43,182,199,0.12),_transparent_55%)]" />
      <Card className="relative z-10 w-full max-w-lg border-0 bg-white/90 p-10 shadow-[var(--shadow-soft)]">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-muted-foreground">
            Monte Math
          </p>
          <h1 className="mt-3 text-3xl font-bold text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="space-y-6">{children}</div>
        {footer ? (
          <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </Card>
    </div>
  )
}
