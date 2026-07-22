import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded border border-border bg-surface px-3 text-sm text-content',
          'placeholder:text-faint focus:border-accent focus:outline-none',
          className,
        )}
        {...props}
      />
    )
  },
)
