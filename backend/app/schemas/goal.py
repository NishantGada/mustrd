"""Goal & note schemas, plus the masked representation for locked private goals."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# --- Goals ---
class GoalCreate(BaseModel):
    column_id: UUID
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    score: int = Field(ge=1, le=5)
    due_date: datetime | None = None
    is_secured: bool = False


class GoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    score: int | None = Field(default=None, ge=1, le=5)
    due_date: datetime | None = None
    is_secured: bool | None = None


class GoalMove(BaseModel):
    target_column_id: UUID
    position: int = Field(ge=0, description="Zero-based index within the target column.")


class GoalRead(BaseModel):
    """A goal as returned to the client. When the goal is secured and the request
    is not unlocked, content fields are masked and `is_locked` is True."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    column_id: UUID
    title: str
    description: str | None
    score: int | None
    position: int
    due_date: datetime | None
    is_secured: bool
    is_locked: bool
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


# --- Notes ---
class NoteCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class NoteUpdate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    goal_id: UUID
    body: str
    created_at: datetime
    updated_at: datetime
