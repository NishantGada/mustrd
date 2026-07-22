"""Goal & note endpoints. Thin — logic + ownership + masking live in GoalService."""
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_unlock_state
from app.models.user import User
from app.schemas.goal import (
    GoalCreate,
    GoalMove,
    GoalRead,
    GoalUpdate,
    NoteCreate,
    NoteRead,
    NoteUpdate,
)
from app.services.goal_service import GoalService

router = APIRouter(tags=["goals"])


@router.get("/boards/{board_id}/goals", response_model=list[GoalRead])
async def list_board_goals(
    board_id: UUID,
    user: User = Depends(get_current_user),
    unlocked: bool = Depends(get_unlock_state),
    db: AsyncSession = Depends(get_db),
) -> list[GoalRead]:
    goals = await GoalService(db).list_board_goals(board_id, user)
    return [GoalService.to_read(g, unlocked) for g in goals]


@router.post("/goals", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
async def create_goal(
    data: GoalCreate,
    user: User = Depends(get_current_user),
    unlocked: bool = Depends(get_unlock_state),
    db: AsyncSession = Depends(get_db),
) -> GoalRead:
    goal = await GoalService(db).create(data, user)
    return GoalService.to_read(goal, unlocked=True)  # creator just made it; show it


@router.patch("/goals/{goal_id}", response_model=GoalRead)
async def update_goal(
    goal_id: UUID,
    data: GoalUpdate,
    user: User = Depends(get_current_user),
    unlocked: bool = Depends(get_unlock_state),
    db: AsyncSession = Depends(get_db),
) -> GoalRead:
    goal = await GoalService(db).update(goal_id, data, user, unlocked)
    return GoalService.to_read(goal, unlocked=True)


@router.post("/goals/{goal_id}/move", response_model=GoalRead)
async def move_goal(
    goal_id: UUID,
    data: GoalMove,
    user: User = Depends(get_current_user),
    unlocked: bool = Depends(get_unlock_state),
    db: AsyncSession = Depends(get_db),
) -> GoalRead:
    goal = await GoalService(db).move(goal_id, data, user)
    return GoalService.to_read(goal, unlocked)


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: UUID,
    user: User = Depends(get_current_user),
    unlocked: bool = Depends(get_unlock_state),
    db: AsyncSession = Depends(get_db),
) -> None:
    await GoalService(db).delete(goal_id, user, unlocked)


# --- Notes ---
@router.get("/goals/{goal_id}/notes", response_model=list[NoteRead])
async def list_notes(
    goal_id: UUID,
    user: User = Depends(get_current_user),
    unlocked: bool = Depends(get_unlock_state),
    db: AsyncSession = Depends(get_db),
) -> list[NoteRead]:
    notes = await GoalService(db).list_notes(goal_id, user, unlocked)
    return [NoteRead.model_validate(n) for n in notes]


@router.post("/goals/{goal_id}/notes", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def add_note(
    goal_id: UUID,
    data: NoteCreate,
    user: User = Depends(get_current_user),
    unlocked: bool = Depends(get_unlock_state),
    db: AsyncSession = Depends(get_db),
) -> NoteRead:
    note = await GoalService(db).add_note(goal_id, data.body, user, unlocked)
    return NoteRead.model_validate(note)


@router.patch("/notes/{note_id}", response_model=NoteRead)
async def update_note(
    note_id: UUID,
    data: NoteUpdate,
    user: User = Depends(get_current_user),
    unlocked: bool = Depends(get_unlock_state),
    db: AsyncSession = Depends(get_db),
) -> NoteRead:
    note = await GoalService(db).update_note(note_id, data.body, user, unlocked)
    return NoteRead.model_validate(note)


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    user: User = Depends(get_current_user),
    unlocked: bool = Depends(get_unlock_state),
    db: AsyncSession = Depends(get_db),
) -> None:
    await GoalService(db).delete_note(note_id, user, unlocked)
