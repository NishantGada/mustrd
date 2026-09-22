"""Data-access for projects. Pure DB operations, no business rules."""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import Goal
from app.models.project import Project


class ProjectRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_for_user(self, user_id: UUID) -> list[Project]:
        result = await self.db.execute(
            select(Project).where(Project.user_id == user_id).order_by(Project.created_at)
        )
        return list(result.scalars().all())

    async def get(self, project_id: UUID) -> Project | None:
        return await self.db.get(Project, project_id)

    async def get_by_key(self, user_id: UUID, key: str) -> Project | None:
        result = await self.db.execute(
            select(Project).where(Project.user_id == user_id, Project.key == key)
        )
        return result.scalar_one_or_none()

    async def list_children(self, project_id: UUID) -> list[Project]:
        result = await self.db.execute(select(Project).where(Project.parent_id == project_id))
        return list(result.scalars().all())

    async def claim_number(self, project_id: UUID) -> int:
        """Atomically take the project's next ticket number."""
        result = await self.db.execute(
            update(Project)
            .where(Project.id == project_id)
            .values(next_number=Project.next_number + 1)
            .returning(Project.next_number - 1)
            .execution_options(synchronize_session=False)
        )
        return int(result.scalar_one())

    async def list_goals(self, project_id: UUID) -> list[Goal]:
        result = await self.db.execute(
            select(Goal).where(Goal.project_id == project_id).order_by(Goal.created_at, Goal.id)
        )
        return list(result.scalars().all())

    async def add(self, project: Project) -> Project:
        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def delete(self, project: Project) -> None:
        await self.db.delete(project)
