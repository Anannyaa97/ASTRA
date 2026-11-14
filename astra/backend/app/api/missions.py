"""Mission endpoints (spec section 16). The engine is the only authority for game state."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.missions import DecisionRequest, PreviewRequest, StartMissionRequest
from app.services import achievements, advisor, profile, sun_service
from app.services import mission_service as svc
from app.services.simulation_engine import (
    DecisionError, DecisionRequired, DuplicateDecision, InvalidDecision, MissionOver,
)

router = APIRouter(prefix="/api/missions", tags=["missions"])


def _load(db: Session, mission_id: int):
    try:
        return svc.load(db, mission_id)
    except svc.MissionNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from None


def _http_error(exc: DecisionError) -> HTTPException:
    code = 409 if isinstance(exc, (DuplicateDecision, DecisionRequired, MissionOver)) else 400
    return HTTPException(status_code=code, detail=str(exc))


@router.get("")
def list_missions(limit: int = 10, db: Session = Depends(get_db)):
    return svc.recent_missions(db, max(1, min(limit, 50)))


@router.post("/start")
def start(body: StartMissionRequest, db: Session = Depends(get_db)):
    mission = svc.start_mission(db, body.nickname, body.difficulty, body.seed, sun=sun_service.current_sun(db))
    mission, sim = _load(db, mission.id)
    return svc.mission_view(db, mission, sim)


@router.get("/{mission_id}")
def get_mission(mission_id: int, db: Session = Depends(get_db)):
    mission, sim = _load(db, mission_id)
    return svc.mission_view(db, mission, sim)


@router.get("/{mission_id}/events")
def get_events(mission_id: int, db: Session = Depends(get_db)):
    mission, sim = _load(db, mission_id)
    return {"current": svc.event_view(sim), "day": sim.state.day, "status": sim.state.status}


@router.get("/{mission_id}/advice")
def get_advice(mission_id: int, db: Session = Depends(get_db)):
    """Hints from the four advisors. Read only: this never changes the mission."""
    mission, sim = _load(db, mission_id)
    return advisor.advise(sim)


@router.post("/{mission_id}/preview")
def preview(mission_id: int, body: PreviewRequest, db: Session = Depends(get_db)):
    mission, sim = _load(db, mission_id)
    event = sim.current_event()
    if event is None:
        raise HTTPException(status_code=400, detail="There is no event to preview today.")
    try:
        return sim.preview(event.id, body.option_id, body.horizon_days)
    except DecisionError as exc:
        raise _http_error(exc) from None


@router.post("/{mission_id}/decision")
def decide(mission_id: int, body: DecisionRequest, db: Session = Depends(get_db)):
    mission, sim = _load(db, mission_id)
    try:
        result = svc.make_decision(db, mission, sim, body.event_id, body.option_id)
    except DecisionError as exc:
        raise _http_error(exc) from None
    return {"decision": result["record"], "learning": result["learning"],
            "mission": svc.mission_view(db, mission, sim)}


@router.post("/{mission_id}/advance-day")
def advance_day(mission_id: int, db: Session = Depends(get_db)):
    mission, sim = _load(db, mission_id)
    try:
        report = svc.advance(db, mission, sim)
    except DecisionError as exc:
        raise _http_error(exc) from None
    return {"report": report, "mission": svc.mission_view(db, mission, sim)}


@router.get("/{mission_id}/report")
def get_report(mission_id: int, db: Session = Depends(get_db)):
    mission, sim = _load(db, mission_id)
    return svc.report_view(mission, sim)


@router.post("/{mission_id}/restart")
def restart(mission_id: int, db: Session = Depends(get_db)):
    mission, _ = _load(db, mission_id)
    new_mission = svc.restart(db, mission)
    new_mission, sim = _load(db, new_mission.id)
    return {"previous_mission_id": mission_id, "mission": svc.mission_view(db, new_mission, sim)}


@router.get("/{mission_id}/achievements")
def get_achievements(mission_id: int, db: Session = Depends(get_db)):
    """Badges earned in this mission, computed from the real history."""
    try:
        _, sim = svc.load(db, mission_id)
    except svc.MissionNotFound:
        raise HTTPException(status_code=404, detail="Mission not found.") from None
    badges = achievements.achievements(sim)
    return {"badges": badges, "earned": sum(b["earned"] for b in badges), "total": len(badges)}


@router.get("/{mission_id}/profile")
def get_profile(mission_id: int, db: Session = Depends(get_db)):
    """The player's Engineering Decision Profile, worked out from their real decisions."""
    try:
        _, sim = svc.load(db, mission_id)
    except svc.MissionNotFound:
        raise HTTPException(status_code=404, detail="Mission not found.") from None
    return profile.profile(sim)
