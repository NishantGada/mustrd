import { useState } from 'react'

import { useConfirm } from '@/components/ConfirmProvider'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { formatDateTime } from '@/lib/dates'
import type { Note } from '@/types'

import { useAddNote, useDeleteNote, useNotes, useUpdateNote } from './hooks'

interface NotesSectionProps {
  goalId: string
  unlockToken?: string
}

export function NotesSection({ goalId, unlockToken }: NotesSectionProps) {
  const notesQuery = useNotes(goalId, true, unlockToken)
  const addNote = useAddNote(goalId, unlockToken)
  const [draft, setDraft] = useState('')

  function submit(e: React.FormEvent): void {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return
    addNote.mutate(trimmed, { onSuccess: () => setDraft('') })
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-content">Notes</h3>
      <form onSubmit={submit} className="mb-4 space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Leave a note for future-you…"
          rows={3}
        />
        <Button type="submit" size="sm" variant="outline" disabled={addNote.isPending}>
          Add note
        </Button>
      </form>

      {notesQuery.isLoading && <p className="text-xs text-muted">Loading notes…</p>}

      <ul className="space-y-2.5">
        {notesQuery.data
          ?.slice()
          // Latest first — ISO 8601 UTC strings sort chronologically.
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map((note) => (
            <NoteItem key={note.id} goalId={goalId} note={note} unlockToken={unlockToken} />
          ))}
      </ul>
      {notesQuery.data?.length === 0 && <p className="text-xs text-faint">No notes yet.</p>}
    </div>
  )
}

function NoteItem({
  goalId,
  note,
  unlockToken,
}: {
  goalId: string
  note: Note
  unlockToken?: string
}) {
  const confirm = useConfirm()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(note.body)
  const updateNote = useUpdateNote(goalId, unlockToken)
  const deleteNote = useDeleteNote(goalId, unlockToken)

  async function remove(): Promise<void> {
    const ok = await confirm({
      title: 'Delete note?',
      message: 'This note will be permanently removed.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (ok) deleteNote.mutate(note.id)
  }

  if (editing) {
    return (
      <li className="rounded-[var(--radius-sm)] border border-border bg-surface p-3">
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} />
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              const trimmed = value.trim()
              if (!trimmed) return
              updateNote.mutate(
                { noteId: note.id, body: trimmed },
                { onSuccess: () => setEditing(false) },
              )
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
    <li className="group rounded-[var(--radius-sm)] border border-border bg-surface p-3">
      <p className="whitespace-pre-wrap text-sm text-content">{note.body}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-faint">{formatDateTime(note.created_at)}</span>
        <div className="hidden gap-3 group-hover:flex">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] text-muted hover:text-content"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            className="text-[11px] text-muted hover:text-danger"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  )
}
