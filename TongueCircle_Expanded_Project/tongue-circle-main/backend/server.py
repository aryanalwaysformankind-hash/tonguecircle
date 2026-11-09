import asyncio
import logging
import os
from contextlib import asynccontextmanager, suppress
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")

from clerk_auth import clerk_router  # noqa: E402
from lib.db import client, db, ensure_indexes  # noqa: E402
from routers.social import router as social_router  # noqa: E402
from routers.translation import router as translation_router  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())
    try:
        yield
    finally:
        app.state.index_task.cancel()
        with suppress(asyncio.CancelledError):
            await app.state.index_task
        client.close()


app = FastAPI(
    title="Tongue Circle API",
    version="1.0.0",
    lifespan=lifespan,
)
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Tongue Circle API"}


@api_router.get("/health/live")
async def liveness_check():
    return {"status": "alive"}


@api_router.get("/health")
async def health_check():
    try:
        await db.command("ping")
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        logger.warning("Health check database ping failed: %s", exc)
        raise HTTPException(status_code=503, detail="Database is unavailable") from exc


origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

api_router.include_router(clerk_router)
api_router.include_router(social_router)
api_router.include_router(translation_router)
app.include_router(api_router)
