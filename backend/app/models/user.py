"""User account. One person per account; auth via email + password (JWT)."""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.board import Board
    from app.models.goal import Goal


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Global passcode for the "private goals" feature. Nullable = not set yet.
    # Stored hashed, exactly like a password — never plaintext.
    security_passcode_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    boards: Mapped[list[Board]] = relationship(
        back_populates="owner", cascade="all, delete-orphan", passive_deletes=True
    )
    goals: Mapped[list[Goal]] = relationship(
        back_populates="owner", cascade="all, delete-orphan", passive_deletes=True
    )
