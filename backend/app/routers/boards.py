"""Board & column endpoints. Thin — all logic + ownership checks live in BoardService."""
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.board import (
    BoardCreate,
    BoardRead,
    BoardUpdate,
    BoardWithColumns,
    ColumnCreate,
    ColumnRead,
    ColumnUpdate,
    ReorderRequest,
)
from app.services.board_service import BoardService

router = APIRouter(prefix="/boards", tags=["boards"])
# Column-scoped routes that don't nest under a board id.
columns_router = APIRouter(prefix="/columns", tags=["columns"])


@router.get("", response_model=list[BoardRead])
async def list_boards(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[BoardRead]:
    boards = await BoardService(db).list_boards(user)
    return [BoardRead.model_validate(b) for b in boards]


@router.post("", response_model=BoardRead, status_code=status.HTTP_201_CREATED)
async def create_board(
    data: BoardCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BoardRead:
    board = await BoardService(db).create_board(data, user)
    return BoardRead.model_validate(board)


@router.get("/{board_id}", response_model=BoardWithColumns)
async def get_board(
    board_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BoardWithColumns:
    board = await BoardService(db).get_board(board_id, user)
    return BoardWithColumns.model_validate(board)


@router.patch("/{board_id}", response_model=BoardRead)
async def update_board(
    board_id: UUID,
    data: BoardUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BoardRead:
    board = await BoardService(db).update_board(board_id, data, user)
    return BoardRead.model_validate(board)


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_board(
    board_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await BoardService(db).delete_board(board_id, user)


# --- Columns nested under a board ---
@router.post("/{board_id}/columns", response_model=ColumnRead, status_code=status.HTTP_201_CREATED)
async def add_column(
    board_id: UUID,
    data: ColumnCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ColumnRead:
    column = await BoardService(db).add_column(board_id, data, user)
    return ColumnRead.model_validate(column)


@router.put("/{board_id}/columns/order", response_model=list[ColumnRead])
async def reorder_columns(
    board_id: UUID,
    data: ReorderRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ColumnRead]:
    columns = await BoardService(db).reorder_columns(board_id, data.ordered_ids, user)
    return [ColumnRead.model_validate(c) for c in columns]


# --- Column-scoped mutations ---
@columns_router.patch("/{column_id}", response_model=ColumnRead)
async def update_column(
    column_id: UUID,
    data: ColumnUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ColumnRead:
    column = await BoardService(db).update_column(column_id, data, user)
    return ColumnRead.model_validate(column)


@columns_router.delete("/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_column(
    column_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await BoardService(db).delete_column(column_id, user)
