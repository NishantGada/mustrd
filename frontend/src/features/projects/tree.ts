import type { Project } from '@/types'

export interface ProjectNode {
  project: Project
  depth: number
}

/** Projects in tree order (parents before their subprojects), each with its depth.
 *  Siblings keep the API's order (creation time). */
export function flattenTree(projects: Project[]): ProjectNode[] {
  const ids = new Set(projects.map((p) => p.id))
  const children = new Map<string | null, Project[]>()
  for (const p of projects) {
    // A parent we can't see is treated as top level rather than hiding the project.
    const parent = p.parent_id && ids.has(p.parent_id) ? p.parent_id : null
    children.set(parent, [...(children.get(parent) ?? []), p])
  }
  const out: ProjectNode[] = []
  const walk = (parent: string | null, depth: number) => {
    for (const p of children.get(parent) ?? []) {
      out.push({ project: p, depth })
      walk(p.id, depth + 1)
    }
  }
  walk(null, 0)
  return out
}

/** The given ids plus every project nested under them, at any depth. */
export function withDescendants(projects: Project[], roots: string[]): Set<string> {
  const found = new Set<string>()
  const stack = [...roots]
  while (stack.length) {
    const id = stack.pop()!
    if (found.has(id)) continue
    found.add(id)
    for (const p of projects) if (p.parent_id === id) stack.push(p.id)
  }
  return found
}

/** Ancestors of a project, root first, ending with the project itself. */
export function pathTo(projects: Project[], id: string): Project[] {
  const byId = new Map(projects.map((p) => [p.id, p]))
  const path: Project[] = []
  let current = byId.get(id)
  while (current && !path.includes(current)) {
    path.unshift(current)
    current = current.parent_id ? byId.get(current.parent_id) : undefined
  }
  return path
}
