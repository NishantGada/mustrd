"""Data-access for password-reset requests."""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import ResetRequestStatus
from app.models.password_reset import PasswordResetRequest


class PasswordResetRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get(self, request_id: UUID) -> PasswordResetRequest | None:
        return await self.db.get(PasswordResetRequest, request_id)

    async def get_pending_for_user(self, user_id: UUID) -> PasswordResetRequest | None:
        result = await self.db.execute(
            select(PasswordResetRequest).where(
                PasswordResetRequest.user_id == user_id,
                PasswordResetRequest.status == ResetRequestStatus.PENDING,
            )
        )
        return result.scalar_one_or_none()

    async def list_pending(self) -> list[PasswordResetRequest]:
        result = await self.db.execute(
            select(PasswordResetRequest)
            .where(PasswordResetRequest.status == ResetRequestStatus.PENDING)
            .options(selectinload(PasswordResetRequest.user))
            .order_by(PasswordResetRequest.created_at)
        )
        return list(result.scalars().all())

    async def add(self, request: PasswordResetRequest) -> PasswordResetRequest:
        self.db.add(request)
        await self.db.flush()
        await self.db.refresh(request)
        return request
