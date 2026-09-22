"""Board & column endpoints. Each user has exactly one board, addressed as /board.
Thin — all logic + ownership checks live in BoardService."""
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.board import (
    BoardRead,
    ColumnCreate,
    ColumnRead,
    ColumnUpdate,
    ReorderRequest,
)
from app.services.board_service import BoardService

router = APIRouter(prefix="/board", tags=["board"])
# Column-scoped routes addressed by column id.
columns_router = APIRouter(prefix="/columns", tags=["columns"])


@router.get("", response_model=BoardRead)
async def get_board(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db, scope="function")
) -> BoardRead:
    board = await BoardService(db).get_board(user)
    return BoardRead.model_validate(board)


@router.post("/columns", response_model=ColumnRead, status_code=status.HTTP_201_CREATED)
async def add_column(
    data: ColumnCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db, scope="function"),
) -> ColumnRead:
    column = await BoardService(db).add_column(data, user)
    return ColumnRead.model_validate(column)


@router.put("/columns/order", response_model=list[ColumnRead])
async def reorder_columns(
    data: ReorderRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db, scope="function"),
) -> list[ColumnRead]:
    columns = await BoardService(db).reorder_columns(data.ordered_ids, user)
    return [ColumnRead.model_validate(c) for c in columns]


@columns_router.patch("/{column_id}", response_model=ColumnRead)
async def update_column(
    column_id: UUID,
    data: ColumnUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db, scope="function"),
) -> ColumnRead:
    column = await BoardService(db).update_column(column_id, data, user)
    return ColumnRead.model_validate(column)


@columns_router.delete("/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_column(
    column_id: UUID,
    move_to: UUID | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db, scope="function"),
) -> None:
    """Delete a column. If it holds goals, ?move_to=<column_id> says where they go."""
    await BoardService(db).delete_column(column_id, move_to, user)
