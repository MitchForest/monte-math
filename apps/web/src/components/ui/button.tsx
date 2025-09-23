import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[var(--shadow-soft)] hover:bg-destructive/90',
        outline:
          'border-2 border-border bg-background text-foreground shadow-[var(--shadow-press)] hover:border-primary/60 hover:bg-primary/5',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[var(--shadow-soft)] hover:bg-secondary/85',
        ghost: 'bg-transparent text-foreground hover:bg-accent/30 hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-14 px-8',
        sm: 'h-12 px-6 text-sm',
        lg: 'h-16 px-10 text-lg',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
