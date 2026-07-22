-- Mustrd database bootstrap (Homebrew PostgreSQL 16, local, trust auth on port 5433).
--
-- Run this yourself, connected to the Homebrew server on port 5433:
--     psql -p 5433 -d postgres -f backend/scripts/init_db.sql
--
-- No password is set: your Homebrew Postgres uses `trust` auth for local
-- connections, so the app connects as the `mustrd` role without a password.
-- (If you ever switch to password auth, add PASSWORD '...' below and update .env.)

-- Create the dedicated application role (idempotent).
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mustrd') THEN
      CREATE ROLE mustrd WITH LOGIN;
   END IF;
END
$$;

-- Create the database owned by that role.
-- (CREATE DATABASE can't run inside the DO block above, so it's separate.)
-- If it already exists this line errors harmlessly — ignore it.
CREATE DATABASE mustrd OWNER mustrd;

GRANT ALL PRIVILEGES ON DATABASE mustrd TO mustrd;
