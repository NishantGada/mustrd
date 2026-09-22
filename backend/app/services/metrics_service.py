"""Computes the profile dashboard metrics from aggregate queries."""
from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.metrics_repository import MetricsRepository, ProjectScope
from app.repositories.project_repository import ProjectRepository
from app.schemas.metrics import BestMonth, MetricsRead
from app.services.project_service import descendant_ids


class MetricsService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = MetricsRepository(db)
        self.projects = ProjectRepository(db)

    async def for_user(
        self, user: User, project_ids: list[UUID], include_unassigned: bool
    ) -> MetricsRead:
        """Metrics over all goals, or only those in the given projects (and/or with
        no project). A project rolls up all of its subprojects. Unknown or foreign
        project ids are a 404."""
        owned = await self.projects.list_for_user(user.id)
        owned_ids = {p.id for p in owned}
        if any(pid not in owned_ids for pid in project_ids):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
        scope = ProjectScope(
            project_ids=sorted(descendant_ids(owned, project_ids)),
            include_unassigned=include_unassigned,
        )

        totals = await self.repo.goal_totals(user.id, scope)
        best = await self.repo.best_month(user.id, scope)

        score_all = totals["score_all"]
        efficiency = (totals["score_completed"] / score_all) if score_all else 0.0

        return MetricsRead(
            total_goals=totals["total"],
            active_goals=totals["total"] - totals["completed"],
            completed_goals=totals["completed"],
            efficiency=round(efficiency, 4),
            average_score=round(totals["avg_score"], 2) if totals["avg_score"] is not None else None,
            best_month=BestMonth(month=best[0], completed=best[1]) if best else None,
        )
