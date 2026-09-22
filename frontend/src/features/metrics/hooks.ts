import { useQuery } from '@tanstack/react-query'

import { fetchMetrics } from './api'

export function useMetrics(projects: string[] = []) {
  const scope = [...projects].sort()
  return useQuery({
    queryKey: ['metrics', ...scope],
    queryFn: () => fetchMetrics(scope),
  })
}
