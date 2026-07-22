"""Data-access for goals, notes, and goal events. Pure DB operations."""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.column import BoardColumn
from app.models.event import GoalEvent
from app.models.goal import Goal
from app.models.note import GoalNote


class GoalRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # --- Goals ---
    async def get(self, goal_id: UUID) -> Goal | None:
        return await self.db.get(Goal, goal_id)

    async def list_for_column(self, column_id: UUID) -> list[Goal]:
        result = await self.db.execute(
            select(Goal).where(Goal.column_id == column_id).order_by(Goal.position)
        )
        return list(result.scalars().all())

    async def list_for_board(self, board_id: UUID) -> list[Goal]:
        """All goals on a board, ordered by column position then in-column position."""
        result = await self.db.execute(
            select(Goal)
            .join(BoardColumn, Goal.column_id == BoardColumn.id)
            .where(BoardColumn.board_id == board_id)
            .order_by(BoardColumn.position, Goal.position)
        )
        return list(result.scalars().all())

    async def add(self, goal: Goal) -> Goal:
        self.db.add(goal)
        await self.db.flush()
        await self.db.refresh(goal)
        return goal

    async def delete(self, goal: Goal) -> None:
        await self.db.delete(goal)

    # --- Events ---
    def add_event(self, event: GoalEvent) -> None:
        self.db.add(event)

    # --- Notes ---
    async def get_note(self, note_id: UUID) -> GoalNote | None:
        return await self.db.get(GoalNote, note_id)

    async def list_notes(self, goal_id: UUID) -> list[GoalNote]:
        result = await self.db.execute(
            select(GoalNote).where(GoalNote.goal_id == goal_id).order_by(GoalNote.created_at)
        )
        return list(result.scalars().all())

    async def add_note(self, note: GoalNote) -> GoalNote:
        self.db.add(note)
        await self.db.flush()
        await self.db.refresh(note)
        return note

    async def delete_note(self, note: GoalNote) -> None:
        await self.db.delete(note)
