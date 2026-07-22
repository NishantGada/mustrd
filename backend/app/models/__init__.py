"""Import every model here so Alembic autogenerate sees the full metadata."""
from app.models.base import Base
from app.models.board import Board
from app.models.column import BoardColumn
from app.models.event import GoalEvent
from app.models.goal import Goal
from app.models.note import GoalNote
from app.models.user import User

__all__ = ["Base", "User", "Board", "BoardColumn", "Goal", "GoalNote", "GoalEvent"]
