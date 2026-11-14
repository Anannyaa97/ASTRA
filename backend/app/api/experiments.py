"""What If? Lab endpoints (spec section 16). Experiments never change a real mission or write to the database."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.experiments import ExperimentRequest
from app.services import experiments as lab
from app.services import mission_service as svc
from app.services.simulation_engine import Simulation

router = APIRouter(prefix="/api/experiments", tags=["experiments"])


@router.get("/options")
def options():
    """The sliders the lab offers, with their limits."""
    return {"params": lab.PARAM_INFO, "max_days": 10}


@router.post("/run")
def run(body: ExperimentRequest, db: Session = Depends(get_db)):
    if body.mission_id is None:
        base = Simulation(schedule={})          # a fresh outpost on day 1
        start = "A fresh outpost"
    else:
        try:
            mission, base = svc.load(db, body.mission_id)   # load only reads; it never writes
        except svc.MissionNotFound as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from None
        if base.state.status != "active":
            raise HTTPException(status_code=409, detail="That mission has ended. Try a fresh outpost instead.")
        start = f"Your mission, starting from day {base.state.day}"
    result = lab.run_experiment(base, body.params.model_dump(), body.days, body.storm)
    result["start"] = start
    return result
