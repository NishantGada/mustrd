"""Profile dashboard metrics endpoint."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.metrics import MetricsRead
from app.services.metrics_service import MetricsService

router = APIRouter(prefix="/metrics", tags=["metrics"])

# Value of ?project= that selects goals with no project.
UNASSIGNED_PARAM = "none"


@router.get("", response_model=MetricsRead)
async def my_metrics(
    project: list[str] = Query(default=[]),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db, scope="function"),
) -> MetricsRead:
    """Metrics across every goal, or scoped via repeated ?project=<id> params.
    ?project=none selects goals without a project."""
    include_unassigned = UNASSIGNED_PARAM in project
    try:
        project_ids = [UUID(p) for p in project if p != UNASSIGNED_PARAM]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="project must be a project id or 'none'.",
        )
    return await MetricsService(db).for_user(user, project_ids, include_unassigned)
