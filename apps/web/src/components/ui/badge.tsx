import * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = {
  default: 'bg-secondary text-secondary-foreground shadow-[var(--shadow-press)]',
  outline: 'border border-border bg-transparent text-foreground',
} as const

type BadgeVariant = keyof typeof badgeVariants

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-wide',
          badgeVariants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
