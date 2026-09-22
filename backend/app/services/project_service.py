"""Project business logic: ownership, unique key prefixes, nesting (no cycles),
roll-up scopes, and safe deletion."""
from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.user import User
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.goal_service import GoalService

_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")


class ProjectService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = ProjectRepository(db)

    async def _owned(self, project_id: UUID, user: User) -> Project:
        project = await self.repo.get(project_id)
        if project is None or project.user_id != user.id:
            raise _NOT_FOUND
        return project

    async def _ensure_key_free(self, key: str, user: User, exclude: UUID | None = None) -> None:
        clash = await self.repo.get_by_key(user.id, key)
        if clash is not None and clash.id != exclude:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Another project already uses the key {key}.",
            )

    async def _owned_parent(
        self, parent_id: UUID | None, user: User, moving: Project | None = None
    ) -> Project | None:
        """Resolve a would-be parent, rejecting the project itself or any of its
        descendants (which would create a cycle)."""
        if parent_id is None:
            return None
        parent = await self.repo.get(parent_id)
        if parent is None or parent.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Parent project not found."
            )
        if moving is not None:
            projects = await self.repo.list_for_user(user.id)
            if parent.id in descendant_ids(projects, [moving.id]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A project can't be moved inside itself or one of its subprojects.",
                )
        return parent

    async def list(self, user: User) -> list[Project]:
        return await self.repo.list_for_user(user.id)

    async def get(self, project_id: UUID, user: User) -> Project:
        return await self._owned(project_id, user)

    async def create(self, data: ProjectCreate, user: User) -> Project:
        await self._ensure_key_free(data.key, user)
        await self._owned_parent(data.parent_id, user)
        project = Project(
            user_id=user.id,
            parent_id=data.parent_id,
            name=data.name,
            description=data.description,
            key=data.key,
            color=data.color,
        )
        return await self.repo.add(project)

    async def update(self, project_id: UUID, data: ProjectUpdate, user: User) -> Project:
        """Renaming the key re-keys every goal in the project (Done included), since
        goals store only their number and the key is derived from the prefix."""
        project = await self._owned(project_id, user)
        if "parent_id" in data.model_fields_set and data.parent_id != project.parent_id:
            await self._owned_parent(data.parent_id, user, moving=project)
            project.parent_id = data.parent_id
        if data.name is not None:
            project.name = data.name
        if "description" in data.model_fields_set:
            project.description = data.description
        if data.key is not None and data.key != project.key:
            await self._ensure_key_free(data.key, user, exclude=project.id)
            project.key = data.key
        if data.color is not None:
            project.color = data.color
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def delete(self, project_id: UUID, user: User) -> None:
        """Delete a project. Nothing else is lost: its subprojects move up one level,
        and its goals move to the parent project (fresh keys there) or, for a
        top-level project, to "No project" with fresh TBD numbers."""
        project = await self._owned(project_id, user)
        parent = await self.repo.get(project.parent_id) if project.parent_id else None
        for child in await self.repo.list_children(project.id):
            child.parent_id = project.parent_id
        goals = GoalService(self.db)
        for goal in await self.repo.list_goals(project.id):
            await goals.assign_project(goal, parent, user)
        await self.db.flush()
        await self.repo.delete(project)


def descendant_ids(projects: list[Project], roots: list[UUID]) -> set[UUID]:
    """The given project ids plus every project nested under them, at any depth."""
    children: dict[UUID, list[UUID]] = {}
    for p in projects:
        if p.parent_id is not None:
            children.setdefault(p.parent_id, []).append(p.id)
    found: set[UUID] = set()
    stack = list(roots)
    while stack:
        current = stack.pop()
        if current in found:
            continue
        found.add(current)
        stack.extend(children.get(current, []))
    return found
