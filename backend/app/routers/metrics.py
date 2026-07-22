"""Profile dashboard metrics endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.metrics import MetricsRead
from app.services.metrics_service import MetricsService

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("", response_model=MetricsRead)
async def my_metrics(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> MetricsRead:
    return await MetricsService(db).for_user(user)
