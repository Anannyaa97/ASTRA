from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    """Used by the frontend to show the 'Mission Control link' status."""
    db.execute(text("SELECT 1"))  # proves the database connection works
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "database": "connected",
        "time": datetime.now(timezone.utc).isoformat(),
    }
