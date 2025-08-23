import { cn, getPlatformModifiers } from '@/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

export const SHORTCUTS_VALUES = {
  CMD: getPlatformModifiers().CMD,
  ESC: 'Esc',
  ENTER: '↩',
}

const kbdVariants = cva(
  'font-normal inline-flex h-5 min-w-5 px-1 select-none items-center justify-center rounded-md text-xs',
  {
    variants: {
      variant: {
        default:
          'bg-primary border border-primary-border shadow-primary text-primary-foreground',
        destructive:
          'bg-destructive text-white border border-destructive-border shadow-destructive-border dark:bg-destructive/60',
        outline:
          'border bg-card text-card-foreground shadow-xs dark:bg-input/30 dark:border-input',
        secondary: 'bg-secondary text-secondary-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export function Kbd({
  variant,
  children,
  className,
  ...props
}: React.PropsWithChildren<VariantProps<typeof kbdVariants>> &
  React.HTMLAttributes<HTMLDivElement>) {
  const childrenString = children?.toString().toLowerCase() ?? ''

  return (
    <kbd
      {...props}
      className={cn(kbdVariants({ variant, className }), {
        uppercase: childrenString.length === 1,
      })}
    >
      {children}
    </kbd>
  )
}
