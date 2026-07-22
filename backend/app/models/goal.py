"""A goal (the 'ticket'). Lives in a column, carries a 1-5 importance score."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.column import BoardColumn
    from app.models.event import GoalEvent
    from app.models.note import GoalNote
    from app.models.user import User


class Goal(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "goals"
    __table_args__ = (
        CheckConstraint("score >= 1 AND score <= 5", name="ck_goal_score_range"),
    )

    # Denormalized owner FK so ownership checks and per-user metrics avoid deep joins.
    user_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    column_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("columns.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Private-goal flag (Level 1: content withheld by the API until passcode unlock).
    is_secured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Set when the goal enters a terminal column; cleared if it leaves. Drives metrics.
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner: Mapped[User] = relationship(back_populates="goals")
    column: Mapped[BoardColumn] = relationship(back_populates="goals")
    notes: Mapped[list[GoalNote]] = relationship(
        back_populates="goal",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="GoalNote.created_at",
    )
    events: Mapped[list[GoalEvent]] = relationship(
        back_populates="goal",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="GoalEvent.created_at",
    )
