"""Declarative base + reusable mixins for every model.

Conventions enforced here so no model has to repeat them:
  - Primary key: UUIDv7, stored as native Postgres `uuid`.
  - Timestamps: `TIMESTAMPTZ`, always UTC, auto-managed.
"""
from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.ids import new_id


class Base(DeclarativeBase):
    pass


class UUIDMixin:
    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True),
        primary_key=True,
        default=new_id,
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
