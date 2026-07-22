"""Application configuration — single source of truth, loaded from environment / .env."""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Postgres (asyncpg driver).
    database_url: str = Field(alias="DATABASE_URL")

    # JWT.
    secret_key: str = Field(alias="SECRET_KEY")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=1440, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    # How long a private-goal "unlock" grant stays valid after entering the passcode.
    unlock_token_expire_minutes: int = Field(default=30, alias="UNLOCK_TOKEN_EXPIRE_MINUTES")

    # CORS — comma-separated string in env, exposed as a list.
    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
