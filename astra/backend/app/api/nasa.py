from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import nasa_service, radlab_service

router = APIRouter(prefix="/api/nasa", tags=["nasa"])


@router.get("/space-weather")
def space_weather(days: int = Query(30, ge=1, le=90), db: Session = Depends(get_db)):
    """Recent solar flares, CMEs, SEP events and geomagnetic storms, with a LIVE / CACHED / ARCHIVED label."""
    return nasa_service.get_space_weather(db, days=days)


@router.get("/radiation")
def iss_radiation(db: Session = Depends(get_db)):
    """Real radiation dose-rate readings measured on the International Space Station (NASA RadLab)."""
    return radlab_service.get_iss_radiation(db)
