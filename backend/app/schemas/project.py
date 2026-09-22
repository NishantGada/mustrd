"""Project schemas. Keys are normalized to uppercase; colors are #rrggbb."""
from __future__ import annotations

import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Prefix for goals that have no project. Reserved so no project can claim it.
UNASSIGNED_KEY = "TBD"

_KEY_RE = re.compile(r"^[A-Z][A-Z0-9]{1,9}$")
_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def _normalize_key(value: str) -> str:
    key = value.strip().upper()
    if not _KEY_RE.fullmatch(key):
        raise ValueError(
            "Key must be 2-10 letters or digits and start with a letter (e.g. WORK)."
        )
    if key == UNASSIGNED_KEY:
        raise ValueError(f"{UNASSIGNED_KEY} is reserved for goals without a project.")
    return key


def _normalize_color(value: str) -> str:
    if not _COLOR_RE.fullmatch(value):
        raise ValueError("Color must be a hex value like #3b82f6.")
    return value.lower()


class ProjectCreate(BaseModel):
    parent_id: UUID | None = None
    name: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=2000)
    key: str
    color: str

    @field_validator("key")
    @classmethod
    def _key(cls, v: str) -> str:
        return _normalize_key(v)

    @field_validator("color")
    @classmethod
    def _color(cls, v: str) -> str:
        return _normalize_color(v)


class ProjectUpdate(BaseModel):
    """Partial update. Send `description: null` to clear it, `parent_id: null` to
    make the project top-level."""
    parent_id: UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=2000)
    key: str | None = None
    color: str | None = None

    @field_validator("key")
    @classmethod
    def _key(cls, v: str | None) -> str | None:
        return None if v is None else _normalize_key(v)

    @field_validator("color")
    @classmethod
    def _color(cls, v: str | None) -> str | None:
        return None if v is None else _normalize_color(v)


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    parent_id: UUID | None
    name: str
    description: str | None
    key: str
    color: str
    created_at: datetime
    updated_at: datetime
