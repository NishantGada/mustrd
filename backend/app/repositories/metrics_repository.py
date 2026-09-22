"""Read-only aggregate queries for the profile dashboard.

Design choices (documented so they're easy to revisit — see FUTURE.md):
  * A goal counts as "completed" when it currently sits in a terminal column,
    i.e. `completed_at IS NOT NULL`. Reopening a goal makes it active again.
  * "Active" = everything not currently completed (To Do / In Progress / Blocked).
  * "Best month" is derived from the COMPLETED event log, bucketed by UTC month,
    so it reflects history even if a goal was later reopened or moved.
"""
from __future__ import annotations

from uuid import UUID

from dataclasses import dataclass, field

from sqlalchemy import ColumnElement, case, false, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import GoalEventType
from app.models.event import GoalEvent
from app.models.goal import Goal


@dataclass
class ProjectScope:
    """Which goals to count. Empty scope (no ids, no unassigned) means every goal."""
    project_ids: list[UUID] = field(default_factory=list)
    include_unassigned: bool = False

    @property
    def is_all(self) -> bool:
        return not self.project_ids and not self.include_unassigned

    def condition(self) -> ColumnElement[bool]:
        clauses: list[ColumnElement[bool]] = []
        if self.project_ids:
            clauses.append(Goal.project_id.in_(self.project_ids))
        if self.include_unassigned:
            clauses.append(Goal.project_id.is_(None))
        return or_(*clauses) if clauses else false()


class MetricsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def goal_totals(self, user_id: UUID, scope: ProjectScope) -> dict[str, float]:
        completed = Goal.completed_at.is_not(None)
        stmt = select(
            func.count().label("total"),
            func.count().filter(completed).label("completed"),
            func.coalesce(func.sum(Goal.score), 0).label("score_all"),
            func.coalesce(
                func.sum(case((completed, Goal.score), else_=0)), 0
            ).label("score_completed"),
            func.avg(Goal.score).label("avg_score"),
        ).where(Goal.user_id == user_id)
        if not scope.is_all:
            stmt = stmt.where(scope.condition())
        result = await self.db.execute(stmt)
        row = result.one()
        return {
            "total": int(row.total),
            "completed": int(row.completed),
            "score_all": int(row.score_all),
            "score_completed": int(row.score_completed),
            "avg_score": float(row.avg_score) if row.avg_score is not None else None,
        }

    async def best_month(
        self, user_id: UUID, scope: ProjectScope
    ) -> tuple[str, int] | None:
        """(YYYY-MM, count) of the calendar month with the most completions, or None."""
        month = func.to_char(
            func.date_trunc("month", func.timezone("UTC", GoalEvent.created_at)), "YYYY-MM"
        ).label("month")
        stmt = select(month, func.count().label("cnt")).where(
            GoalEvent.user_id == user_id,
            GoalEvent.event_type == GoalEventType.COMPLETED,
        )
        if not scope.is_all:
            # Scoped by the goal's *current* project.
            stmt = stmt.join(Goal, GoalEvent.goal_id == Goal.id).where(scope.condition())
        result = await self.db.execute(
            stmt.group_by(month).order_by(func.count().desc(), month.desc()).limit(1)
        )
        row = result.first()
        return (row.month, int(row.cnt)) if row else None
