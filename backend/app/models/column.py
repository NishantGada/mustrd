"""A configurable column on a board (To Do / In Progress / Blocked / Done, etc.).

Columns are data, not hardcoded: users can rename, add, remove, reorder them.
`kind` marks which column(s) mean 'completed' so metrics stay correct after renames.
"""
from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import ColumnKind

if TYPE_CHECKING:
    from app.models.board import Board
    from app.models.goal import Goal


class BoardColumn(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "columns"

    board_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("boards.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    kind: Mapped[ColumnKind] = mapped_column(
        SQLEnum(ColumnKind, name="column_kind"),
        nullable=False,
        default=ColumnKind.NORMAL,
    )

    board: Mapped[Board] = relationship(back_populates="columns")
    goals: Mapped[list[Goal]] = relationship(
        back_populates="column",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Goal.position",
    )
