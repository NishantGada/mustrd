/** Date helpers. The API always sends/accepts ISO 8601 UTC; we localize only here. */

/** "2026-07-22T14:30:00Z" -> "Jul 22, 2026, 2:30 PM" (localized). */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

/** Due dates are calendar-day granularity — treat as UTC midnight so the
 *  displayed day never shifts with the viewer's timezone. */
export function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ''
}

export function dateInputToISO(value: string): string | null {
  return value ? `${value}T00:00:00.000Z` : null
}

export function formatDueDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(iso),
  )
}

/** "2026-07" -> "July 2026". */
export function formatMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  )
}
