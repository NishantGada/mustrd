import { api } from '@/lib/api'
import type { Metrics } from '@/types'

/** Metrics over every goal, or only the given project ids / NO_PROJECT. */
export async function fetchMetrics(projects: string[] = []): Promise<Metrics> {
  const { data } = await api.get<Metrics>('/metrics', {
    params: projects.length ? { project: projects } : undefined,
    // Repeat the param (?project=a&project=b) the way FastAPI expects lists.
    paramsSerializer: { indexes: null },
  })
  return data
}
