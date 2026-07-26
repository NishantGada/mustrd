"""Create (or promote) the admin who reviews password-reset requests.

Run once, from the backend directory:

    cd backend
    source .venv/bin/activate
    python scripts/create_superuser.py <email> <username> <password>

If a user with that email already exists, they are promoted to superuser
(their password is left unchanged). Otherwise a new superuser account is created.
Reads DATABASE_URL from backend/.env.
"""
import asyncio
import sys

from app.core.database import SessionLocal
from app.core.security import hash_secret
from app.models.user import User
from app.repositories.user_repository import UserRepository

MIN_PASSWORD_LENGTH = 8


async def create_superuser(email: str, username: str, password: str) -> int:
    if len(password) < MIN_PASSWORD_LENGTH:
        print(f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")
        return 2

    async with SessionLocal() as db:
        users = UserRepository(db)
        existing = await users.get_by_email(email)
        if existing is not None:
            existing.is_superuser = True
            await db.commit()
            print(f"Promoted existing account {email!r} to superuser.")
            return 0

        if await users.get_by_username(username):
            print(f"Username {username!r} is already taken.")
            return 1

        user = User(
            email=email,
            username=username,
            password_hash=hash_secret(password),
            is_superuser=True,
        )
        await users.add(user)
        await db.commit()
        print(f"Created superuser {email!r} (username {username!r}).")
        return 0


def main() -> int:
    if len(sys.argv) != 4:
        print("Usage: python scripts/create_superuser.py <email> <username> <password>")
        return 2
    return asyncio.run(create_superuser(*sys.argv[1:4]))


if __name__ == "__main__":
    raise SystemExit(main())
