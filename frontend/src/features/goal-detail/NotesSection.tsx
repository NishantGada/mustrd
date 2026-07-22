import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { formatDateTime } from '@/lib/dates'

import { useAddNote, useDeleteNote, useNotes, useUpdateNote } from './hooks'

export function NotesSection({ goalId }: { goalId: string }) {
  const notesQuery = useNotes(goalId, true)
  const addNote = useAddNote(goalId)
  const [draft, setDraft] = useState('')

  function submit(e: React.FormEvent): void {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return
    addNote.mutate(trimmed, { onSuccess: () => setDraft('') })
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-content">Notes</h3>
      <form onSubmit={submit} className="mb-3 space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Leave a note for future-you…"
          rows={2}
        />
        <Button type="submit" size="sm" variant="outline" disabled={addNote.isPending}>
          Add note
        </Button>
      </form>

      {notesQuery.isLoading && <p className="text-xs text-muted">Loading notes…</p>}

      <ul className="space-y-2">
        {notesQuery.data?.map((note) => (
          <NoteItem key={note.id} goalId={goalId} note={note} />
        ))}
      </ul>
      {notesQuery.data?.length === 0 && (
        <p className="text-xs text-faint">No notes yet.</p>
      )}
    </div>
  )
}

function NoteItem({
  goalId,
  note,
}: {
  goalId: string
  note: { id: string; body: string; created_at: string; updated_at: string }
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(note.body)
  const updateNote = useUpdateNote(goalId)
  const deleteNote = useDeleteNote(goalId)

  if (editing) {
    return (
      <li className="rounded-sm border border-border bg-surface p-2">
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={2} />
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              const trimmed = value.trim()
              if (!trimmed) return
              updateNote.mutate({ noteId: note.id, body: trimmed }, { onSuccess: () => setEditing(false) })
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </li>
    )
  }

  return (
    <li className="group rounded-sm border border-border bg-surface p-2">
      <p className="whitespace-pre-wrap text-sm text-content">{note.body}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[11px] text-faint">{formatDateTime(note.created_at)}</span>
        <div className="hidden gap-2 group-hover:flex">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] text-muted hover:text-content"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => confirm('Delete this note?') && deleteNote.mutate(note.id)}
            className="text-[11px] text-muted hover:text-danger"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  )
}
