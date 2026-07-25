import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addNoteRequest, deleteNoteRequest, fetchNotes, updateNoteRequest } from './api'

const notesKey = (goalId: string) => ['notes', goalId] as const

export function useNotes(goalId: string, enabled: boolean, unlockToken?: string) {
  return useQuery({
    queryKey: notesKey(goalId),
    queryFn: () => fetchNotes(goalId, unlockToken),
    enabled,
  })
}

export function useAddNote(goalId: string, unlockToken?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => addNoteRequest(goalId, body, unlockToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKey(goalId) }),
  })
}

export function useUpdateNote(goalId: string, unlockToken?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ noteId, body }: { noteId: string; body: string }) =>
      updateNoteRequest(noteId, body, unlockToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKey(goalId) }),
  })
}

export function useDeleteNote(goalId: string, unlockToken?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => deleteNoteRequest(noteId, unlockToken),
    onSuccess: () => qc.invalidateQueries({ queryKey: notesKey(goalId) }),
  })
}
