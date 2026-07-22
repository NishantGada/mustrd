import { api } from '@/lib/api'
import type { Note } from '@/types'

export async function fetchNotes(goalId: string): Promise<Note[]> {
  const { data } = await api.get<Note[]>(`/goals/${goalId}/notes`)
  return data
}

export async function addNoteRequest(goalId: string, body: string): Promise<Note> {
  const { data } = await api.post<Note>(`/goals/${goalId}/notes`, { body })
  return data
}

export async function updateNoteRequest(noteId: string, body: string): Promise<Note> {
  const { data } = await api.patch<Note>(`/notes/${noteId}`, { body })
  return data
}

export async function deleteNoteRequest(noteId: string): Promise<void> {
  await api.delete(`/notes/${noteId}`)
}
