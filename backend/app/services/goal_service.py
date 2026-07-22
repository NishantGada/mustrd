"""Goal & note business logic: ownership, drag-drop moves, completion tracking,
event logging, and private-goal masking."""
from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.time import utcnow
from app.models.column import BoardColumn
from app.models.enums import ColumnKind, GoalEventType
from app.models.event import GoalEvent
from app.models.goal import Goal
from app.models.note import GoalNote
from app.models.user import User
from app.repositories.board_repository import BoardRepository
from app.repositories.goal_repository import GoalRepository
from app.schemas.goal import GoalCreate, GoalMove, GoalRead, GoalUpdate

_GOAL_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")
_NOTE_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
_COLUMN_NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found.")
_LOCKED = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="This goal is private. Unlock with your passcode to access it.",
)

MASK_TITLE = "🔒 Private goal"


class GoalService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = GoalRepository(db)
        self.boards = BoardRepository(db)

    # --- Serialization / masking ---
    @staticmethod
    def to_read(goal: Goal, unlocked: bool) -> GoalRead:
        locked = goal.is_secured and not unlocked
        if locked:
            return GoalRead(
                id=goal.id,
                column_id=goal.column_id,
                title=MASK_TITLE,
                description=None,
                score=None,
                position=goal.position,
                due_date=None,
                is_secured=True,
                is_locked=True,
                completed_at=None,
                created_at=goal.created_at,
                updated_at=goal.updated_at,
            )
        return GoalRead(
            id=goal.id,
            column_id=goal.column_id,
            title=goal.title,
            description=goal.description,
            score=goal.score,
            position=goal.position,
            due_date=goal.due_date,
            is_secured=goal.is_secured,
            is_locked=False,
            completed_at=goal.completed_at,
            created_at=goal.created_at,
            updated_at=goal.updated_at,
        )

    # --- Ownership helpers ---
    async def _owned_goal(self, goal_id: UUID, user: User) -> Goal:
        goal = await self.repo.get(goal_id)
        if goal is None or goal.user_id != user.id:
            raise _GOAL_NOT_FOUND
        return goal

    async def _owned_column(self, column_id: UUID, user: User) -> BoardColumn:
        column = await self.boards.get_column(column_id)
        if column is None:
            raise _COLUMN_NOT_FOUND
        board = await self.boards.get(column.board_id)
        if board is None or board.user_id != user.id:
            raise _COLUMN_NOT_FOUND
        return column

    def _require_unlocked(self, goal: Goal, unlocked: bool) -> None:
        if goal.is_secured and not unlocked:
            raise _LOCKED

    # --- Board listing ---
    async def list_board_goals(self, board_id: UUID, user: User) -> list[Goal]:
        board = await self.boards.get(board_id)
        if board is None or board.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found.")
        return await self.repo.list_for_board(board_id)

    # --- CRUD ---
    async def create(self, data: GoalCreate, user: User) -> Goal:
        column = await self._owned_column(data.column_id, user)
        if data.is_secured and user.security_passcode_hash is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Set a security passcode before creating private goals.",
            )
        position = len(await self.repo.list_for_column(column.id))
        goal = Goal(
            user_id=user.id,
            column_id=column.id,
            title=data.title,
            description=data.description,
            score=data.score,
            due_date=data.due_date,
            is_secured=data.is_secured,
            position=position,
        )
        completed = column.kind == ColumnKind.TERMINAL
        if completed:
            goal.completed_at = utcnow()
        goal = await self.repo.add(goal)
        self.repo.add_event(
            GoalEvent(
                goal_id=goal.id,
                user_id=user.id,
                event_type=GoalEventType.COMPLETED if completed else GoalEventType.CREATED,
                from_column_id=None,
                to_column_id=column.id,
            )
        )
        await self.db.flush()
        return goal

    async def update(self, goal_id: UUID, data: GoalUpdate, user: User, unlocked: bool) -> Goal:
        goal = await self._owned_goal(goal_id, user)
        self._require_unlocked(goal, unlocked)
        if data.title is not None:
            goal.title = data.title
        if data.description is not None:
            goal.description = data.description
        if data.score is not None:
            goal.score = data.score
        if data.due_date is not None:
            goal.due_date = data.due_date
        if data.is_secured is not None:
            if data.is_secured and user.security_passcode_hash is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Set a security passcode before marking goals private.",
                )
            goal.is_secured = data.is_secured
        await self.db.flush()
        await self.db.refresh(goal)
        return goal

    async def delete(self, goal_id: UUID, user: User, unlocked: bool) -> None:
        goal = await self._owned_goal(goal_id, user)
        self._require_unlocked(goal, unlocked)
        await self.repo.delete(goal)

    # --- Drag & drop move ---
    async def move(self, goal_id: UUID, data: GoalMove, user: User) -> Goal:
        goal = await self._owned_goal(goal_id, user)
        target = await self._owned_column(data.target_column_id, user)
        source_column_id = goal.column_id
        changed_column = target.id != source_column_id

        # Reindex the target column with the goal inserted at the requested position.
        target_goals = [g for g in await self.repo.list_for_column(target.id) if g.id != goal.id]
        pos = max(0, min(data.position, len(target_goals)))
        new_order = target_goals[:pos] + [goal] + target_goals[pos:]
        goal.column_id = target.id
        for index, g in enumerate(new_order):
            g.position = index

        if changed_column:
            # Renumber the source column now that the goal has left it.
            source_goals = [
                g for g in await self.repo.list_for_column(source_column_id) if g.id != goal.id
            ]
            for index, g in enumerate(source_goals):
                g.position = index

            # Completion transitions driven by the target column's kind.
            if target.kind == ColumnKind.TERMINAL and goal.completed_at is None:
                goal.completed_at = utcnow()
                event_type = GoalEventType.COMPLETED
            elif target.kind != ColumnKind.TERMINAL and goal.completed_at is not None:
                goal.completed_at = None
                event_type = GoalEventType.REOPENED
            else:
                event_type = GoalEventType.MOVED
            self.repo.add_event(
                GoalEvent(
                    goal_id=goal.id,
                    user_id=user.id,
                    event_type=event_type,
                    from_column_id=source_column_id,
                    to_column_id=target.id,
                )
            )

        await self.db.flush()
        await self.db.refresh(goal)
        return goal

    # --- Notes (owner-only, and unlock-gated for private goals) ---
    async def list_notes(self, goal_id: UUID, user: User, unlocked: bool) -> list[GoalNote]:
        goal = await self._owned_goal(goal_id, user)
        self._require_unlocked(goal, unlocked)
        return await self.repo.list_notes(goal_id)

    async def add_note(self, goal_id: UUID, body: str, user: User, unlocked: bool) -> GoalNote:
        goal = await self._owned_goal(goal_id, user)
        self._require_unlocked(goal, unlocked)
        return await self.repo.add_note(GoalNote(goal_id=goal.id, body=body))

    async def _owned_note(self, note_id: UUID, user: User) -> tuple[GoalNote, Goal]:
        note = await self.repo.get_note(note_id)
        if note is None:
            raise _NOTE_NOT_FOUND
        goal = await self.repo.get(note.goal_id)
        if goal is None or goal.user_id != user.id:
            raise _NOTE_NOT_FOUND
        return note, goal

    async def update_note(self, note_id: UUID, body: str, user: User, unlocked: bool) -> GoalNote:
        note, goal = await self._owned_note(note_id, user)
        self._require_unlocked(goal, unlocked)
        note.body = body
        await self.db.flush()
        await self.db.refresh(note)
        return note

    async def delete_note(self, note_id: UUID, user: User, unlocked: bool) -> None:
        note, goal = await self._owned_note(note_id, user)
        self._require_unlocked(goal, unlocked)
        await self.repo.delete_note(note)
