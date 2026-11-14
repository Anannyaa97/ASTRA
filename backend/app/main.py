"""ASTRA backend entry point.  Run: uvicorn app.main:app --reload --port 8000"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import experiments, health, missions, nasa
from app.core.config import settings
from app.core.database import Base, engine, ensure_columns
from app.models import tables  # noqa: F401  (registers tables with Base)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # create tables on first start
    ensure_columns()                      # add new columns to an older astra.db
    yield


app = FastAPI(title="ASTRA API", version=settings.app_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(missions.router)
app.include_router(experiments.router)
app.include_router(nasa.router)
