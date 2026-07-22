"""Private-goal security endpoints: set/change passcode, and unlock."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.security import PasscodeSet, UnlockRequest, UnlockResponse
from app.services.security_service import SecurityService

router = APIRouter(prefix="/security", tags=["security"])


@router.put("/passcode", status_code=status.HTTP_204_NO_CONTENT)
async def set_passcode(
    data: PasscodeSet,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await SecurityService(db).set_passcode(user, data)


@router.post("/unlock", response_model=UnlockResponse)
async def unlock(
    data: UnlockRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UnlockResponse:
    return SecurityService(db).unlock(user, data.passcode)
