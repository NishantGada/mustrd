"""Project business logic: ownership, unique key prefixes, and safe deletion."""
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

    async def list(self, user: User) -> list[Project]:
        return await self.repo.list_for_user(user.id)

    async def get(self, project_id: UUID, user: User) -> Project:
        return await self._owned(project_id, user)

    async def create(self, data: ProjectCreate, user: User) -> Project:
        await self._ensure_key_free(data.key, user)
        project = Project(
            user_id=user.id,
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
        """Delete a project; its goals move to "No project" and get fresh TBD numbers."""
        project = await self._owned(project_id, user)
        goals = GoalService(self.db)
        for goal in await self.repo.list_goals(project.id):
            await goals.assign_project(goal, None, user)
        await self.db.flush()
        await self.repo.delete(project)
