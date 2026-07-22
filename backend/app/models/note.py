"""A personal, private note on a goal. Only the owner ever reads or writes these."""
from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.goal import Goal


class GoalNote(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "goal_notes"

    goal_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("goals.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)

    goal: Mapped[Goal] = relationship(back_populates="notes")
