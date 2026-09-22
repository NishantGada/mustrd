"""Test setup. Tests run the real app in-process against a dedicated database.

The database comes from TEST_DATABASE_URL (default: mustrd_test on the local
Postgres 16, port 5433). Its name must end in "_test" — the suite wipes and
rebuilds the schema through the Alembic migrations on every run, so it refuses
to touch anything else.
"""
from __future__ import annotations

import os
import uuid
from collections.abc import Iterator
from typing import Any

import pytest

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+asyncpg://mustrd@localhost:5433/mustrd_test"
)
if not TEST_DATABASE_URL.rsplit("/", 1)[-1].split("?")[0].endswith("_test"):
    raise RuntimeError(f"Refusing to run tests against a non-test database: {TEST_DATABASE_URL}")

# Must be set before anything imports app settings (they're cached on first use).
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASSWORD = "test-password-123"


@pytest.fixture(scope="session", autouse=True)
def _schema() -> None:
    """Fresh schema per run, built by the real migrations (downgrade exercises them too)."""
    cfg = Config(os.path.join(BACKEND_DIR, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(BACKEND_DIR, "alembic"))
    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")


@pytest.fixture(scope="session")
def client(_schema: None) -> Iterator[TestClient]:
    # One client (and so one event loop / connection pool) for the whole session.
    with TestClient(app) as c:
        yield c


class ApiUser:
    """A registered user plus helpers that send requests with their token."""

    def __init__(self, client: TestClient, email: str, user_id: str, token: str) -> None:
        self.client = client
        self.email = email
        self.id = user_id
        self.token = token

    def request(self, method: str, path: str, headers: dict[str, str] | None = None, **kw: Any):
        return self.client.request(
            method, path, headers={"Authorization": f"Bearer {self.token}", **(headers or {})}, **kw
        )

    def get(self, path: str, **kw: Any):
        return self.request("GET", path, **kw)

    def post(self, path: str, **kw: Any):
        return self.request("POST", path, **kw)

    def patch(self, path: str, **kw: Any):
        return self.request("PATCH", path, **kw)

    def put(self, path: str, **kw: Any):
        return self.request("PUT", path, **kw)

    def delete(self, path: str, **kw: Any):
        return self.request("DELETE", path, **kw)

    # --- Shortcuts for common setup ---
    def columns(self) -> dict[str, str]:
        """Column name -> id on this user's board."""
        return {c["name"]: c["id"] for c in self.get("/board").json()["columns"]}

    def project(self, name: str, key: str, parent_id: str | None = None, **kw: Any) -> dict:
        r = self.post(
            "/projects",
            json={"name": name, "key": key, "color": "#3b82f6", "parent_id": parent_id, **kw},
        )
        assert r.status_code == 201, r.text
        return r.json()

    def goal(self, title: str = "goal", column: str = "To Do", **kw: Any) -> dict:
        body = {"column_id": self.columns()[column], "title": title, "score": 3, **kw}
        r = self.post("/goals", json=body)
        assert r.status_code == 201, r.text
        return r.json()

    def goals(self) -> dict[str, dict]:
        """Board goals by title."""
        return {g["title"]: g for g in self.get("/board/goals").json()}


@pytest.fixture
def make_user(client: TestClient):
    def _make() -> ApiUser:
        tag = uuid.uuid4().hex[:10]
        email = f"user-{tag}@mustrd.com"
        r = client.post(
            "/auth/register", json={"email": email, "username": f"u_{tag}", "password": PASSWORD}
        )
        assert r.status_code == 201, r.text
        token = client.post("/auth/login", json={"email": email, "password": PASSWORD}).json()[
            "access_token"
        ]
        return ApiUser(client, email, r.json()["id"], token)

    return _make


@pytest.fixture
def user(make_user) -> ApiUser:
    return make_user()
