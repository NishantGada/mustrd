"""Data-access for boards and columns. Pure DB operations, no business rules."""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.board import Board
from app.models.column import BoardColumn


class BoardRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # --- Board (one per user) ---
    async def get_for_user(self, user_id: UUID) -> Board | None:
        result = await self.db.execute(
            select(Board).where(Board.user_id == user_id).options(selectinload(Board.columns))
        )
        return result.scalar_one_or_none()

    async def get(self, board_id: UUID) -> Board | None:
        return await self.db.get(Board, board_id)

    async def add(self, board: Board) -> Board:
        self.db.add(board)
        await self.db.flush()
        await self.db.refresh(board)
        return board

    async def claim_unassigned_number(self, user_id: UUID) -> int:
        """Atomically take the user's next TBD-n ticket number."""
        result = await self.db.execute(
            update(Board)
            .where(Board.user_id == user_id)
            .values(next_unassigned_number=Board.next_unassigned_number + 1)
            .returning(Board.next_unassigned_number - 1)
            .execution_options(synchronize_session=False)
        )
        return int(result.scalar_one())

    # --- Columns ---
    async def get_column(self, column_id: UUID) -> BoardColumn | None:
        return await self.db.get(BoardColumn, column_id)

    async def list_columns(self, board_id: UUID) -> list[BoardColumn]:
        result = await self.db.execute(
            select(BoardColumn)
            .where(BoardColumn.board_id == board_id)
            .order_by(BoardColumn.position)
        )
        return list(result.scalars().all())

    async def next_column_position(self, board_id: UUID) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.max(BoardColumn.position), -1)).where(
                BoardColumn.board_id == board_id
            )
        )
        return int(result.scalar_one()) + 1

    async def add_column(self, column: BoardColumn) -> BoardColumn:
        self.db.add(column)
        await self.db.flush()
        await self.db.refresh(column)
        return column

    async def delete_column(self, column: BoardColumn) -> None:
        await self.db.delete(column)
