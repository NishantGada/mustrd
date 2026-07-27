import { useQuery } from '@tanstack/react-query'

import { fetchMetrics } from './api'

export function useMetrics(boardId?: string) {
  return useQuery({
    queryKey: ['metrics', boardId ?? 'all'],
    queryFn: () => fetchMetrics(boardId),
  })
}
