"""Board & column business logic: the user's single board, default seeding, column
rules (at least one column, at least one Done column), and safe column deletion."""
from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.time import utcnow
from app.models.board import Board
from app.models.column import BoardColumn
from app.models.enums import ColumnKind, GoalEventType
from app.models.event import GoalEvent
from app.models.user import User
from app.repositories.board_repository import BoardRepository
from app.repositories.goal_repository import GoalRepository
from app.schemas.board import ColumnCreate, ColumnUpdate
from app.services.goal_service import GoalService

# The board every new user starts with.
DEFAULT_BOARD_NAME = "My Board"
DEFAULT_COLUMNS: list[tuple[str, ColumnKind]] = [
    ("To Do", ColumnKind.NORMAL),
    ("Ready", ColumnKind.NORMAL),
    ("In Progress", ColumnKind.NORMAL),
    ("Blocked", ColumnKind.NORMAL),
    ("Done", ColumnKind.TERMINAL),
]

_COLUMN_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found.")
_NEED_TERMINAL = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="At least one column must be marked as Done.",
)


class BoardService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = BoardRepository(db)
        self.goals = GoalRepository(db)

    # --- Board ---
    async def bootstrap_default(self, user: User) -> Board:
        """Create a new user's board with the standard five columns."""
        board = await self.repo.add(Board(user_id=user.id, name=DEFAULT_BOARD_NAME))
        for index, (name, kind) in enumerate(DEFAULT_COLUMNS):
            await self.repo.add_column(
                BoardColumn(board_id=board.id, name=name, kind=kind, position=index)
            )
        return await self.get_board(user)

    async def get_board(self, user: User) -> Board:
        """The user's board with columns, seeding it if the account predates it."""
        board = await self.repo.get_for_user(user.id)
        if board is None:
            return await self.bootstrap_default(user)
        # Re-query so columns reflect changes made earlier in this session.
        await self.db.refresh(board, attribute_names=["columns"])
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

    # --- Columns ---
    async def add_column(self, data: ColumnCreate, user: User) -> BoardColumn:
        board = await self.get_board(user)
        position = await self.repo.next_column_position(board.id)
        column = BoardColumn(board_id=board.id, name=data.name, kind=data.kind, position=position)
        return await self.repo.add_column(column)

    async def _is_last_terminal(self, column: BoardColumn) -> bool:
        if column.kind != ColumnKind.TERMINAL:
            return False
        columns = await self.repo.list_columns(column.board_id)
        return sum(1 for c in columns if c.kind == ColumnKind.TERMINAL) == 1

    async def update_column(
        self, column_id: UUID, data: ColumnUpdate, user: User
    ) -> BoardColumn:
        column = await self._owned_column(column_id, user)
        if data.name is not None:
            column.name = data.name
        if data.kind is not None and data.kind != column.kind:
            if await self._is_last_terminal(column):
                raise _NEED_TERMINAL
            await self._apply_kind_change(column, data.kind, user)
            column.kind = data.kind
        await self.db.flush()
        await self.db.refresh(column)
        return column

    async def _apply_kind_change(
        self, column: BoardColumn, new_kind: ColumnKind, user: User
    ) -> None:
        """Keep completion state consistent when a column's Done-status flips, so
        goals already sitting in it get (or lose) completed_at + a logged event."""
        goals = await self.goals.list_for_column(column.id)
        now = utcnow()
        if new_kind == ColumnKind.TERMINAL:
            for goal in goals:
                if goal.completed_at is None:
                    goal.completed_at = now
                    self.db.add(
                        GoalEvent(
                            goal_id=goal.id,
                            user_id=user.id,
                            event_type=GoalEventType.COMPLETED,
                            to_column_id=column.id,
                        )
                    )
        else:  # terminal -> normal: reopen everything in it
            for goal in goals:
                if goal.completed_at is not None:
                    goal.completed_at = None
                    self.db.add(
                        GoalEvent(
                            goal_id=goal.id,
                            user_id=user.id,
                            event_type=GoalEventType.REOPENED,
                            from_column_id=column.id,
                        )
                    )

    async def delete_column(self, column_id: UUID, move_to: UUID | None, user: User) -> None:
        """Delete a column. Its goals are never deleted with it: if it has any, the
        caller must name a `move_to` column and they're appended to the end of it."""
        column = await self._owned_column(column_id, user)
        columns = await self.repo.list_columns(column.board_id)
        if len(columns) == 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The board needs at least one column.",
            )
        if await self._is_last_terminal(column):
            raise _NEED_TERMINAL

        goals = await self.goals.list_for_column(column.id)
        if goals:
            if move_to is None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"This column has {len(goals)} goal(s); choose a column to move them to.",
                )
            if move_to == column.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Can't move goals into the column being deleted.",
                )
            target = await self._owned_column(move_to, user)
            offset = len(await self.goals.list_for_column(target.id))
            mover = GoalService(self.db)
            for index, goal in enumerate(goals):
                goal.position = offset + index
                mover.transfer_to_column(goal, target, column.id, user)
            # Persist the moves before the DB cascade on the column runs.
            await self.db.flush()

        await self.repo.delete_column(column)
        await self.db.flush()
        # Close the gap left in column positions.
        remaining = [c for c in columns if c.id != column.id]
        for index, c in enumerate(remaining):
            c.position = index
        await self.db.flush()

    async def reorder_columns(self, ordered_ids: list[UUID], user: User) -> list[BoardColumn]:
        board = await self.get_board(user)
        columns = await self.repo.list_columns(board.id)
        existing = {c.id: c for c in columns}
        if set(ordered_ids) != set(existing) or len(ordered_ids) != len(existing):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ordered_ids must contain exactly the board's column ids.",
            )
        for index, cid in enumerate(ordered_ids):
            existing[cid].position = index
        await self.db.flush()
        return await self.repo.list_columns(board.id)
