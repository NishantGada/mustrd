"""Computes the profile dashboard metrics from aggregate queries."""
from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.board_repository import BoardRepository
from app.repositories.metrics_repository import MetricsRepository
from app.schemas.metrics import BestMonth, MetricsRead


class MetricsService:
    def __init__(self, db: AsyncSession) -> None:
        self.repo = MetricsRepository(db)
        self.boards = BoardRepository(db)

    async def for_user(self, user: User, board_id: UUID | None = None) -> MetricsRead:
        if board_id is not None:
            board = await self.boards.get(board_id)
            if board is None or board.user_id != user.id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found.")

        totals = await self.repo.goal_totals(user.id, board_id)
        best = await self.repo.best_month(user.id, board_id)

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
