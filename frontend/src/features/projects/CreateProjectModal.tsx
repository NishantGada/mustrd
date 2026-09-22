import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Modal } from '@/components/ui/Modal'
import { apiErrorMessage } from '@/lib/api'
import type { Project } from '@/types'

import { ProjectForm } from './ProjectForm'
import { useCreateProject } from './hooks'

interface CreateProjectModalProps {
  projects: Project[]
  /** Create inside this project (a subproject). */
  parent?: Project
  onClose: () => void
}

/** Create a project (or subproject), then open its page. */
export function CreateProjectModal({ projects, parent, onClose }: CreateProjectModalProps) {
  const navigate = useNavigate()
  const create = useCreateProject()
  const [error, setError] = useState<string | null>(null)

  return (
    <Modal title={parent ? `New subproject in ${parent.name}` : 'New project'} onClose={onClose} size="lg">
      <ProjectForm
        projects={projects}
        defaultParentId={parent?.id}
        submitLabel={parent ? 'Create subproject' : 'Create project'}
        pending={create.isPending}
        error={error}
        onSubmit={(body) => {
          setError(null)
          create.mutate(body, {
            onSuccess: (project) => {
              onClose()
              navigate(`/projects/${project.id}`)
            },
            onError: (err) => setError(apiErrorMessage(err, 'Could not create the project.')),
          })
        }}
      />
    </Modal>
  )
}
