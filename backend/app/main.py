"""Mustrd API entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import auth, boards, goals, metrics, security

settings = get_settings()

app = FastAPI(title="Mustrd API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(boards.router)
app.include_router(boards.columns_router)
app.include_router(goals.router)
app.include_router(security.router)
app.include_router(metrics.router)
