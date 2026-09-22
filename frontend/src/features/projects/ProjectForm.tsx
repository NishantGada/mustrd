import { useState } from 'react'

import { Check } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/cn'
import type { Project } from '@/types'

import type { ProjectBody } from './api'
import { PRESET_COLORS, suggestKey, validateKey } from './keys'

interface ProjectFormProps {
  /** Existing project to edit; omit to create. */
  project?: Project
  submitLabel: string
  pending: boolean
  error: string | null
  onSubmit: (body: ProjectBody) => void
}

export function ProjectForm({ project, submitLabel, pending, error, onSubmit }: ProjectFormProps) {
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [key, setKey] = useState(project?.key ?? '')
  // New projects suggest a key from the name until the user types their own.
  const [keyTouched, setKeyTouched] = useState(Boolean(project))
  const [color, setColor] = useState(project?.color ?? PRESET_COLORS[0])

  const keyError = key ? validateKey(key) : null
  const isDirty =
    !project ||
    name !== project.name ||
    description !== (project.description ?? '') ||
    key !== project.key ||
    color !== project.color
  const canSubmit = Boolean(name.trim()) && Boolean(key) && !keyError && isDirty && !pending

  function changeName(next: string): void {
    setName(next)
    if (!keyTouched) setKey(suggestKey(next))
  }

  function submit(e: React.FormEvent): void {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      description: description.trim() ? description : null,
      key,
      color,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Title" htmlFor="project-name">
        <Input
          id="project-name"
          autoFocus={!project}
          value={name}
          maxLength={80}
          onChange={(e) => changeName(e.target.value)}
          placeholder="e.g. Work"
        />
      </Field>

      <Field
        label="Key prefix"
        htmlFor="project-key"
        error={keyError ?? undefined}
      >
        <Input
          id="project-key"
          value={key}
          maxLength={10}
          onChange={(e) => {
            setKeyTouched(true)
            setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
          }}
          placeholder="WORK"
          className="font-mono uppercase"
        />
        <p className="text-xs text-faint">
          Goals are keyed like <span className="font-mono">{key || 'KEY'}-12</span>.
          {project && ' Changing it re-keys every goal in this project, including done ones.'}
        </p>
      </Field>

      <Field label="Description" htmlFor="project-desc">
        <Textarea
          id="project-desc"
          rows={3}
          value={description}
          maxLength={2000}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional — what belongs in this project?"
        />
      </Field>

      <Field label="Color" htmlFor="project-color">
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColor(preset)}
              aria-label={`Use color ${preset}`}
              className={cn(
                'grid h-7 w-7 place-items-center rounded-full text-white transition-transform hover:scale-110',
                color === preset && 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
              )}
              style={{ background: preset }}
            >
              {color === preset && <Check width={14} height={14} />}
            </button>
          ))}
          <label className="ml-2 flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-content">
            <input
              id="project-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-10 cursor-pointer rounded border border-border bg-surface"
            />
            <span className="font-mono text-xs">{color}</span>
          </label>
        </div>
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={!canSubmit}>
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
