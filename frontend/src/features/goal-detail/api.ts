import { api, unlockConfig } from '@/lib/api'
import type { Note } from '@/types'

export async function fetchNotes(goalId: string, unlockToken?: string): Promise<Note[]> {
  const { data } = await api.get<Note[]>(`/goals/${goalId}/notes`, unlockConfig(unlockToken))
  return data
}

export async function addNoteRequest(
  goalId: string,
  body: string,
  unlockToken?: string,
): Promise<Note> {
  const { data } = await api.post<Note>(`/goals/${goalId}/notes`, { body }, unlockConfig(unlockToken))
  return data
}

export async function updateNoteRequest(
  noteId: string,
  body: string,
  unlockToken?: string,
): Promise<Note> {
  const { data } = await api.patch<Note>(`/notes/${noteId}`, { body }, unlockConfig(unlockToken))
  return data
}

export async function deleteNoteRequest(noteId: string, unlockToken?: string): Promise<void> {
  await api.delete(`/notes/${noteId}`, unlockConfig(unlockToken))
}
