import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addNoteRequest, deleteNoteRequest, fetchNotes, updateNoteRequest } from './api'

const notesKey = (goalId: string) => ['notes', goalId] as const

export function useNotes(goalId: string, enabled: boolean) {
  return useQuery({
    queryKey: notesKey(goalId),
    queryFn: () => fetchNotes(goalId),
    enabled,
  })
}

export function useAddNote(goalId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => addNoteRequest(goalId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKey(goalId) }),
  })
}

export function useUpdateNote(goalId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ noteId, body }: { noteId: string; body: string }) =>
      updateNoteRequest(noteId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKey(goalId) }),
  })
}

export function useDeleteNote(goalId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => deleteNoteRequest(noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKey(goalId) }),
  })
}
