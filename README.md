# Mustrd

A personal, private Kanban-style productivity app — a "personal Jira" for tracking **goals**.
Goals live in configurable columns (To Do / In Progress / Blocked / Done), carry a **1–5
importance score**, and each user gets a dashboard of personal productivity metrics.

## Stack
- **Frontend:** React + TypeScript + Vite, Tailwind (token-based single-source theme), dnd-kit, TanStack Query
- **Backend:** Python 3.12 · FastAPI · SQLAlchemy 2.0 (async) · Alembic · Pydantic v2 · JWT auth
- **Database:** PostgreSQL 16 (local)

## Conventions (project-wide)
- **IDs:** UUID (v7, time-ordered) everywhere. No auto-increment integers.
- **Dates:** ISO 8601, **UTC**, stored as `TIMESTAMPTZ`. Transmit UTC; localize only at display.
- **Architecture:** layered backend (routers → services → repositories → models); loosely coupled.

## Local setup

### 1. Database (you run these — see `backend/scripts/init_db.sql`)
Mustrd uses the **Homebrew PostgreSQL 16** server on **port 5433** (trust auth, no password),
kept separate from any other local Postgres on 5432.
```
brew services start postgresql@16          # runs on 5433 (see postgresql.conf)
psql -p 5433 -d postgres -f backend/scripts/init_db.sql
```

### 2. Backend
```
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then fill in DB password + SECRET_KEY
uvicorn app.main:app --reload
```

### 3. Frontend
```
cd frontend
npm install
npm run dev
```
