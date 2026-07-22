"""UUID generation. We use UUIDv7 (time-ordered) so primary keys sort by creation
time — keeping DB indexes compact — while still being opaque, non-sequential UUIDs."""
from uuid import UUID

from uuid6 import uuid7


def new_id() -> UUID:
    return uuid7()
