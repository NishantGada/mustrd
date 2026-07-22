"""Private-goal security: setting/changing the global passcode and issuing unlock grants."""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import UNLOCK_SCOPE
from app.core.security import create_access_token, hash_secret, verify_secret
from app.models.user import User
from app.schemas.security import PasscodeSet, UnlockResponse

_settings = get_settings()


class SecurityService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def set_passcode(self, user: User, data: PasscodeSet) -> None:
        # Changing an existing passcode requires proving you know the current one.
        if user.security_passcode_hash is not None:
            if not data.current_passcode or not verify_secret(
                data.current_passcode, user.security_passcode_hash
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Current passcode is incorrect.",
                )
        user.security_passcode_hash = hash_secret(data.passcode)
        await self.db.flush()

    def unlock(self, user: User, passcode: str) -> UnlockResponse:
        if user.security_passcode_hash is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No passcode is set for this account.",
            )
        if not verify_secret(passcode, user.security_passcode_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect passcode."
            )
        minutes = _settings.unlock_token_expire_minutes
        token = create_access_token(
            subject=str(user.id),
            extra_claims={"scope": UNLOCK_SCOPE},
            expires_minutes=minutes,
        )
        return UnlockResponse(unlock_token=token, expires_in_seconds=minutes * 60)
