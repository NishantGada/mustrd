"""Project endpoints. Thin — logic + ownership live in ProjectService."""
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
async def list_projects(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db, scope="function")
) -> list[ProjectRead]:
    projects = await ProjectService(db).list(user)
    return [ProjectRead.model_validate(p) for p in projects]


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db, scope="function"),
) -> ProjectRead:
    project = await ProjectService(db).create(data, user)
    return ProjectRead.model_validate(project)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db, scope="function"),
) -> ProjectRead:
    project = await ProjectService(db).get(project_id, user)
    return ProjectRead.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db, scope="function"),
) -> ProjectRead:
    project = await ProjectService(db).update(project_id, data, user)
    return ProjectRead.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db, scope="function"),
) -> None:
    """Delete a project. Its goals are kept and move to "No project"."""
    await ProjectService(db).delete(project_id, user)
