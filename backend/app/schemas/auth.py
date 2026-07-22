"""Auth request/response schemas. Pydantic v2 serializes datetimes to ISO 8601 (UTC)."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

if TYPE_CHECKING:
    from app.models.user import User


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_]+$")
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    username: str
    has_security_passcode: bool = Field(
        description="Whether the user has set a passcode for private goals."
    )
    created_at: datetime

    @classmethod
    def from_model(cls, user: User) -> UserRead:
        return cls(
            id=user.id,
            email=user.email,
            username=user.username,
            has_security_passcode=user.security_passcode_hash is not None,
            created_at=user.created_at,
        )


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
