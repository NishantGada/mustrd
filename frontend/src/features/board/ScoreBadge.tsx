import { cn } from '@/lib/cn'

const scoreColor: Record<number, string> = {
  1: 'bg-score-1',
  2: 'bg-score-2',
  3: 'bg-score-3',
  4: 'bg-score-4',
  5: 'bg-score-5',
}

const scoreLabel: Record<number, string> = {
  1: 'Irrelevant',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Urgent',
}

export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5',
        'text-xs font-semibold text-white',
        scoreColor[score] ?? 'bg-muted',
        className,
      )}
      title={`Score ${score} · ${scoreLabel[score] ?? ''}`}
    >
      {score}
    </span>
  )
}
