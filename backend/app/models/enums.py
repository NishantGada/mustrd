"""Shared enums used across models. String-valued so they're readable in the DB."""
from enum import Enum


class ColumnKind(str, Enum):
    """Distinguishes a normal column from the 'done' column(s). Metrics use this to
    decide what counts as completed — so renaming 'Done' never breaks the math."""
    NORMAL = "normal"
    TERMINAL = "terminal"


class GoalEventType(str, Enum):
    """Audit trail of what happened to a goal. Powers time-based metrics
    (e.g. 'best month') and future analytics without recomputing from scratch."""
    CREATED = "created"
    MOVED = "moved"
    COMPLETED = "completed"
    REOPENED = "reopened"


class ResetRequestStatus(str, Enum):
    """Lifecycle of a password-reset request handled by the superuser."""
    PENDING = "pending"
    REJECTED = "rejected"
    RESOLVED = "resolved"
