"""Password-reset request schemas."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import ResetRequestStatus


class ResetRequestCreate(BaseModel):
    """Public: a locked-out user asks the admin to reset their password."""
    email: EmailStr


class ResetRequestRead(BaseModel):
    """Admin view of a pending request. Carries the requester's email (prepopulated
    into the set-password form) and username for context."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_email: EmailStr
    user_username: str
    status: ResetRequestStatus
    created_at: datetime


class ResolveResetRequest(BaseModel):
    """Admin approves and sets the new password in one step."""
    new_password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str
