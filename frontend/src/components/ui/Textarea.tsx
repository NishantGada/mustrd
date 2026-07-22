import { forwardRef, type TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full resize-none rounded border border-border bg-surface px-3 py-2 text-sm text-content',
          'placeholder:text-faint focus:border-accent focus:outline-none',
          className,
        )}
        {...props}
      />
    )
  },
)
