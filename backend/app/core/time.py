"""Time helpers. Whole app works in UTC; localization happens only on the frontend."""
from datetime import datetime, timezone


def utcnow() -> datetime:
    """Timezone-aware current time in UTC. Never use naive datetimes anywhere."""
    return datetime.now(timezone.utc)
