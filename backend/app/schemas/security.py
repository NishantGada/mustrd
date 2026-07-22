"""Schemas for the private-goal passcode + unlock flow."""
from pydantic import BaseModel, Field


class PasscodeSet(BaseModel):
    passcode: str = Field(min_length=4, max_length=128)
    # Required only when changing an already-set passcode.
    current_passcode: str | None = None


class UnlockRequest(BaseModel):
    passcode: str


class UnlockResponse(BaseModel):
    unlock_token: str
    expires_in_seconds: int
