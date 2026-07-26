"""Password-reset business logic: users file requests; the superuser resolves them."""
from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_secret
from app.core.time import utcnow
from app.models.enums import ResetRequestStatus
from app.models.password_reset import PasswordResetRequest
from app.models.user import User
from app.repositories.password_reset_repository import PasswordResetRepository
from app.repositories.user_repository import UserRepository

_NOT_FOUND = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND, detail="Reset request not found."
)


class PasswordResetService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = PasswordResetRepository(db)
        self.users = UserRepository(db)

    async def request_reset(self, email: str) -> None:
        """Create a pending request if the email maps to a user and none is pending.
        Always returns without signalling whether the email exists (no enumeration)."""
        user = await self.users.get_by_email(email)
        if user is None:
            return
        if await self.repo.get_pending_for_user(user.id):
            return  # dedupe: one pending request per user
        await self.repo.add(PasswordResetRequest(user_id=user.id))

    async def list_pending(self) -> list[PasswordResetRequest]:
        return await self.repo.list_pending()

    async def _pending(self, request_id: UUID) -> PasswordResetRequest:
        request = await self.repo.get(request_id)
        if request is None or request.status != ResetRequestStatus.PENDING:
            raise _NOT_FOUND
        return request

    async def reject(self, request_id: UUID, admin: User) -> None:
        request = await self._pending(request_id)
        request.status = ResetRequestStatus.REJECTED
        request.handled_by_id = admin.id
        request.resolved_at = utcnow()
        await self.db.flush()

    async def resolve(self, request_id: UUID, new_password: str, admin: User) -> None:
        request = await self._pending(request_id)
        user = await self.users.get_by_id(request.user_id)
        if user is None:
            raise _NOT_FOUND
        user.password_hash = hash_secret(new_password)
        request.status = ResetRequestStatus.RESOLVED
        request.handled_by_id = admin.id
        request.resolved_at = utcnow()
        await self.db.flush()
