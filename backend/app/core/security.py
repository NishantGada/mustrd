"""Password/passcode hashing and JWT creation/verification. No business logic here."""
from datetime import timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.core.time import utcnow

_settings = get_settings()
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- Hashing (used for both login passwords and the private-goal passcode) ---
def hash_secret(raw: str) -> str:
    return _pwd_context.hash(raw)


def verify_secret(raw: str, hashed: str) -> bool:
    return _pwd_context.verify(raw, hashed)


# --- JWT ---
def create_access_token(
    subject: str,
    extra_claims: dict[str, Any] | None = None,
    expires_minutes: int | None = None,
) -> str:
    now = utcnow()
    minutes = expires_minutes if expires_minutes is not None else _settings.access_token_expire_minutes
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": now + timedelta(minutes=minutes),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, _settings.secret_key, algorithm=_settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, _settings.secret_key, algorithms=[_settings.jwt_algorithm])
    except JWTError:
        return None
