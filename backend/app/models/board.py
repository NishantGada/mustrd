"""A board owned by a user. Schema supports multiple boards per user (v1 uses one)."""
from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.column import BoardColumn
    from app.models.user import User


class Board(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "boards"

    user_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    owner: Mapped[User] = relationship(back_populates="boards")
    columns: Mapped[list[BoardColumn]] = relationship(
        back_populates="board",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="BoardColumn.position",
    )
