"""A project groups goals on the user's single board (Work, Personal, Cooking…).

Projects nest without a depth limit via `parent_id` (Personal Projects → Build an
iOS App → …). Each project, subprojects included, owns a key prefix (e.g. WORK) and
hands out ticket numbers from its own counter, so goals read as WORK-12. Goals don't store the prefix — the key is always
derived from the project's current prefix, so renaming it re-keys every goal.
"""
from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.goal import Goal


class Project(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "projects"
    __table_args__ = (UniqueConstraint("user_id", "key", name="uq_projects_user_key"),)

    user_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    # Parent project; NULL = top level. Cycles are prevented in ProjectService.
    parent_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Uppercase ticket prefix, unique per user. "TBD" is reserved for unassigned goals.
    key: Mapped[str] = mapped_column(String(10), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=False)  # "#rrggbb"
    # Next ticket number to hand out. Only ever increments, so numbers are never reused.
    next_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    goals: Mapped[list[Goal]] = relationship(back_populates="project")
