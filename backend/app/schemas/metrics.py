"""Profile dashboard metrics schema."""
from __future__ import annotations

from pydantic import BaseModel


class BestMonth(BaseModel):
    month: str  # "YYYY-MM" (UTC)
    completed: int


class MetricsRead(BaseModel):
    total_goals: int
    active_goals: int
    completed_goals: int
    # Priority-weighted completion rate in [0, 1]: Σ score(completed) / Σ score(all).
    efficiency: float
    average_score: float | None
    best_month: BestMonth | None
