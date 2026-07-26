"""Password-reset endpoints: public request submission + superuser review."""
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_superuser
from app.models.password_reset import PasswordResetRequest
from app.models.user import User
from app.schemas.password_reset import (
    MessageResponse,
    ResetRequestCreate,
    ResetRequestRead,
    ResolveResetRequest,
)
from app.services.password_reset_service import PasswordResetService

router = APIRouter(prefix="/password-reset", tags=["password-reset"])

_GENERIC = "If an account with that email exists, an administrator will review your request."


def _to_read(request: PasswordResetRequest) -> ResetRequestRead:
    return ResetRequestRead(
        id=request.id,
        user_email=request.user.email,
        user_username=request.user.username,
        status=request.status,
        created_at=request.created_at,
    )


# --- Public ---
@router.post("/requests", response_model=MessageResponse, status_code=status.HTTP_202_ACCEPTED)
async def request_reset(
    data: ResetRequestCreate, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    await PasswordResetService(db).request_reset(data.email)
    return MessageResponse(message=_GENERIC)


# --- Superuser only ---
@router.get("/requests", response_model=list[ResetRequestRead])
async def list_requests(
    admin: User = Depends(get_current_superuser), db: AsyncSession = Depends(get_db)
) -> list[ResetRequestRead]:
    requests = await PasswordResetService(db).list_pending()
    return [_to_read(r) for r in requests]


@router.post("/requests/{request_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_request(
    request_id: UUID,
    admin: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> None:
    await PasswordResetService(db).reject(request_id, admin)


@router.post("/requests/{request_id}/resolve", status_code=status.HTTP_204_NO_CONTENT)
async def resolve_request(
    request_id: UUID,
    data: ResolveResetRequest,
    admin: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> None:
    await PasswordResetService(db).resolve(request_id, data.new_password, admin)
