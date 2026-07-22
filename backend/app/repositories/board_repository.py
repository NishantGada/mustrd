"""Data-access for boards and columns. Pure DB operations, no business rules."""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.board import Board
from app.models.column import BoardColumn


class BoardRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # --- Boards ---
    async def list_for_user(self, user_id: UUID) -> list[Board]:
        result = await self.db.execute(
            select(Board).where(Board.user_id == user_id).order_by(Board.position, Board.created_at)
        )
        return list(result.scalars().all())

    async def get(self, board_id: UUID) -> Board | None:
        return await self.db.get(Board, board_id)

    async def get_with_columns(self, board_id: UUID) -> Board | None:
        result = await self.db.execute(
            select(Board).where(Board.id == board_id).options(selectinload(Board.columns))
        )
        return result.scalar_one_or_none()

    async def count_for_user(self, user_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Board).where(Board.user_id == user_id)
        )
        return int(result.scalar_one())

    async def add(self, board: Board) -> Board:
        self.db.add(board)
        await self.db.flush()
        await self.db.refresh(board)
        return board

    async def delete(self, board: Board) -> None:
        await self.db.delete(board)

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
