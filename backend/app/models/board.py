"""The user's board. Exactly one per user; projects group goals within it."""
from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.column import BoardColumn
    from app.models.user import User


class Board(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "boards"
    __table_args__ = (UniqueConstraint("user_id", name="uq_boards_user_id"),)

    user_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    # Counter for goals without a project (TBD-1, TBD-2…). Only ever increments.
    next_unassigned_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    owner: Mapped[User] = relationship(back_populates="board")
    columns: Mapped[list[BoardColumn]] = relationship(
        back_populates="board",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="BoardColumn.position",
    )
