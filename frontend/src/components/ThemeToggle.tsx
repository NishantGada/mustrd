import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { applyMode, resolveInitialMode, type ThemeMode } from '@/lib/theme-mode'

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => resolveInitialMode())

  function toggle(): void {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    applyMode(next)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      title="Toggle theme"
    >
      {mode === 'dark' ? '☀' : '☾'}
    </Button>
  )
}
