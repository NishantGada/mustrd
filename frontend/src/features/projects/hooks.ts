import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { boardKeys } from '@/features/board/hooks'

import {
  createProject,
  deleteProject,
  fetchProject,
  fetchProjects,
  updateProject,
  type ProjectBody,
} from './api'

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
}

/** Project changes can re-key or un-assign goals, so refresh those too. */
function invalidateProjects(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: projectKeys.all })
  qc.invalidateQueries({ queryKey: boardKeys.goals })
  qc.invalidateQueries({ queryKey: ['metrics'] })
}

export function useProjects() {
  return useQuery({ queryKey: projectKeys.all, queryFn: fetchProjects })
}

export function useProject(projectId: string) {
  return useQuery({ queryKey: projectKeys.detail(projectId), queryFn: () => fetchProject(projectId) })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ProjectBody) => createProject(body),
    onSuccess: () => invalidateProjects(qc),
  })
}

export function useUpdateProject(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<ProjectBody>) => updateProject(projectId, body),
    onSuccess: () => invalidateProjects(qc),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: () => invalidateProjects(qc),
  })
}
