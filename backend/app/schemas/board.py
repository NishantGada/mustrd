"""Board & column schemas."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ColumnKind


# --- Columns ---
class ColumnCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    kind: ColumnKind = ColumnKind.NORMAL


class ColumnUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    kind: ColumnKind | None = None


class ColumnRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    board_id: UUID
    name: str
    position: int
    kind: ColumnKind
    created_at: datetime
    updated_at: datetime


# --- Boards ---
class BoardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class BoardUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)


class BoardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    position: int
    created_at: datetime
    updated_at: datetime


class BoardWithColumns(BoardRead):
    columns: list[ColumnRead]


# --- Reordering ---
class ReorderRequest(BaseModel):
    """Ordered list of ids; index in the list becomes the new position."""
    ordered_ids: list[UUID] = Field(min_length=1)
