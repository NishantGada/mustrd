"""A password-reset request submitted by a locked-out user, reviewed by the superuser."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.enums import ResetRequestStatus

if TYPE_CHECKING:
    from app.models.user import User


class PasswordResetRequest(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "password_reset_requests"

    user_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    status: Mapped[ResetRequestStatus] = mapped_column(
        SQLEnum(ResetRequestStatus, name="reset_request_status"),
        nullable=False,
        default=ResetRequestStatus.PENDING,
    )

    # The admin who handled it, and when it left the pending state.
    handled_by_id: Mapped[UUID | None] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # The requesting user (two FKs point at users, so disambiguate explicitly).
    user: Mapped[User] = relationship(foreign_keys=[user_id])
