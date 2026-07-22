"""Immutable audit log of goal lifecycle events — the source of truth for
time-based metrics (e.g. most goals completed in a calendar month)."""
from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import GoalEventType

if TYPE_CHECKING:
    from app.models.goal import Goal


class GoalEvent(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "goal_events"

    goal_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("goals.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    event_type: Mapped[GoalEventType] = mapped_column(
        SQLEnum(GoalEventType, name="goal_event_type"),
        nullable=False,
    )
    from_column_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("columns.id", ondelete="SET NULL"),
        nullable=True,
    )
    to_column_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("columns.id", ondelete="SET NULL"),
        nullable=True,
    )

    goal: Mapped[Goal] = relationship(back_populates="events")
