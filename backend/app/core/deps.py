"""Shared FastAPI dependencies — auth guard that resolves the current user from a JWT."""
from __future__ import annotations

from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository

_bearer = HTTPBearer(auto_error=True)

_CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise _CREDENTIALS_ERROR

    subject = payload.get("sub")
    if not subject:
        raise _CREDENTIALS_ERROR
    try:
        user_id = UUID(subject)
    except ValueError:
        raise _CREDENTIALS_ERROR

    user = await UserRepository(db).get_by_id(user_id)
    if user is None:
        raise _CREDENTIALS_ERROR
    return user


# Marker claim distinguishing an unlock grant from a normal login token.
UNLOCK_SCOPE = "private-goals-unlock"


async def get_unlock_state(
    current_user: User = Depends(get_current_user),
    x_unlock_token: str | None = Header(default=None),
) -> bool:
    """True if the request carries a valid, unexpired unlock grant for THIS user.

    Private goals stay masked unless this is True. Absence of the header is not an
    error — it simply means 'still locked'.
    """
    if not x_unlock_token:
        return False
    payload = decode_access_token(x_unlock_token)
    if payload is None:
        return False
    return payload.get("scope") == UNLOCK_SCOPE and payload.get("sub") == str(current_user.id)
