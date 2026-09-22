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


# --- Board (one per user) ---
class BoardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    columns: list[ColumnRead]
    created_at: datetime
    updated_at: datetime


# --- Reordering ---
class ReorderRequest(BaseModel):
    """Ordered list of ids; index in the list becomes the new position."""
    ordered_ids: list[UUID] = Field(min_length=1)
