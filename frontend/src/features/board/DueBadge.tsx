import { cn } from '@/lib/cn'
import { dueStatus, formatDueDate } from '@/lib/dates'

/** Due date on a card: red when overdue, amber when due within a few days.
 *  Completed goals show the date quietly, without urgency. */
export function DueBadge({ dueDate, completed }: { dueDate: string; completed: boolean }) {
  const { status, days } = dueStatus(dueDate)
  const date = formatDueDate(dueDate)
  const label = completed
    ? `Due ${date}`
    : status === 'overdue'
      ? `Overdue · ${date}`
      : status === 'today'
        ? 'Due today'
        : days === 1
          ? 'Due tomorrow'
          : `Due ${date}`

  return (
    <span
      title={`Due ${date}`}
      className={cn(
        'rounded px-1.5 py-0.5 text-[11px] font-medium',
        completed || status === 'later'
          ? 'text-faint'
          : status === 'overdue'
            ? 'bg-danger/12 text-danger'
            : 'bg-warning/15 text-warning',
      )}
    >
      {label}
    </span>
  )
}
