import { api } from '@/lib/api'
import type { Metrics } from '@/types'

export async function fetchMetrics(boardId?: string): Promise<Metrics> {
  const { data } = await api.get<Metrics>('/metrics', {
    params: boardId ? { board_id: boardId } : undefined,
  })
  return data
}
