import { useQuery } from '@tanstack/react-query'

import { fetchMetrics } from './api'

export function useMetrics() {
  return useQuery({ queryKey: ['metrics'], queryFn: fetchMetrics })
}
