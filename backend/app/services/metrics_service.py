"""Computes the profile dashboard metrics from aggregate queries."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.metrics_repository import MetricsRepository
from app.schemas.metrics import BestMonth, MetricsRead


class MetricsService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = MetricsRepository(db)

    async def for_user(self, user: User) -> MetricsRead:
        totals = await self.repo.goal_totals(user.id)
        best = await self.repo.best_month(user.id)

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
