"""Board & column business logic: ownership enforcement, default seeding, reorder."""
from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.board import Board
from app.models.column import BoardColumn
from app.models.enums import ColumnKind
from app.models.user import User
from app.repositories.board_repository import BoardRepository
from app.schemas.board import BoardCreate, BoardUpdate, ColumnCreate, ColumnUpdate

# The default board every new user starts with.
DEFAULT_BOARD_NAME = "My Board"
DEFAULT_COLUMNS: list[tuple[str, ColumnKind]] = [
    ("To Do", ColumnKind.NORMAL),
    ("In Progress", ColumnKind.NORMAL),
    ("Blocked", ColumnKind.NORMAL),
    ("Done", ColumnKind.TERMINAL),
]

_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found.")
_COLUMN_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found.")


class BoardService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = BoardRepository(db)

    # --- Ownership helpers (404 rather than 403 so we don't leak existence) ---
    async def _owned_board(self, board_id: UUID, user: User) -> Board:
        board = await self.repo.get(board_id)
        if board is None or board.user_id != user.id:
            raise _NOT_FOUND
        return board

    async def _owned_column(self, column_id: UUID, user: User) -> BoardColumn:
        column = await self.repo.get_column(column_id)
        if column is None:
            raise _COLUMN_NOT_FOUND
        # Ownership is via the parent board.
        board = await self.repo.get(column.board_id)
        if board is None or board.user_id != user.id:
            raise _COLUMN_NOT_FOUND
        return column

    # --- Boards ---
    async def _seed_default_columns(self, board: Board) -> None:
        """Give a freshly-created board the standard four columns."""
        for index, (name, kind) in enumerate(DEFAULT_COLUMNS):
            await self.repo.add_column(
                BoardColumn(board_id=board.id, name=name, kind=kind, position=index)
            )

    async def bootstrap_default(self, user: User) -> Board:
        """Seed a new user's first board with the standard four columns."""
        board = await self.repo.add(Board(user_id=user.id, name=DEFAULT_BOARD_NAME, position=0))
        await self._seed_default_columns(board)
        return await self.repo.get_with_columns(board.id)  # type: ignore[return-value]

    async def list_boards(self, user: User) -> list[Board]:
        """Return the user's boards, seeding a default one if they have none."""
        boards = await self.repo.list_for_user(user.id)
        if not boards:
            await self.bootstrap_default(user)
            boards = await self.repo.list_for_user(user.id)
        return boards

    async def get_board(self, board_id: UUID, user: User) -> Board:
        await self._owned_board(board_id, user)
        board = await self.repo.get_with_columns(board_id)
        assert board is not None  # just confirmed ownership
        return board

    async def create_board(self, data: BoardCreate, user: User) -> Board:
        position = await self.repo.count_for_user(user.id)
        board = await self.repo.add(Board(user_id=user.id, name=data.name, position=position))
        await self._seed_default_columns(board)
        return board

    async def update_board(self, board_id: UUID, data: BoardUpdate, user: User) -> Board:
        board = await self._owned_board(board_id, user)
        if data.name is not None:
            board.name = data.name
        await self.db.flush()
        await self.db.refresh(board)
        return board

    async def delete_board(self, board_id: UUID, user: User) -> None:
        board = await self._owned_board(board_id, user)
        await self.repo.delete(board)

    # --- Columns ---
    async def add_column(self, board_id: UUID, data: ColumnCreate, user: User) -> BoardColumn:
        await self._owned_board(board_id, user)
        position = await self.repo.next_column_position(board_id)
        column = BoardColumn(board_id=board_id, name=data.name, kind=data.kind, position=position)
        return await self.repo.add_column(column)

    async def update_column(
        self, column_id: UUID, data: ColumnUpdate, user: User
    ) -> BoardColumn:
        column = await self._owned_column(column_id, user)
        if data.name is not None:
            column.name = data.name
        if data.kind is not None:
            column.kind = data.kind
        await self.db.flush()
        await self.db.refresh(column)
        return column

    async def delete_column(self, column_id: UUID, user: User) -> None:
        column = await self._owned_column(column_id, user)
        await self.repo.delete_column(column)

    async def reorder_columns(
        self, board_id: UUID, ordered_ids: list[UUID], user: User
    ) -> list[BoardColumn]:
        await self._owned_board(board_id, user)
        columns = await self.repo.list_columns(board_id)
        existing = {c.id: c for c in columns}
        if set(ordered_ids) != set(existing):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ordered_ids must contain exactly the board's column ids.",
            )
        for index, cid in enumerate(ordered_ids):
            existing[cid].position = index
        await self.db.flush()
        return await self.repo.list_columns(board_id)
