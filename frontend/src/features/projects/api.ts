import { api } from '@/lib/api'
import type { Project } from '@/types'

export interface ProjectBody {
  name: string
  description: string | null
  key: string
  color: string
}

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>('/projects')
  return data
}

export async function fetchProject(projectId: string): Promise<Project> {
  const { data } = await api.get<Project>(`/projects/${projectId}`)
  return data
}

export async function createProject(body: ProjectBody): Promise<Project> {
  const { data } = await api.post<Project>('/projects', body)
  return data
}

export async function updateProject(projectId: string, body: Partial<ProjectBody>): Promise<Project> {
  const { data } = await api.patch<Project>(`/projects/${projectId}`, body)
  return data
}

/** Deletes the project only; its goals move to "No project". */
export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${projectId}`)
}
