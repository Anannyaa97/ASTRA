"""Connects the pure simulation engine to the database.

Saving strategy: the database stores the seed and every decision. To get a mission back we
REPLAY them through the deterministic engine. That means the engine is the only authority
for resource values (the frontend never calculates them) and a saved mission can never drift.
Daily resource snapshots are also stored in `resource_states` for history and comparison.
"""
import random
import secrets
from dataclasses import replace

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tables import Mission, MissionReport, Player, PlayerDecision, ResourceState
from app.services.event_manager import STAGES, stage_for_day
from app.services.sim_config import SimConfig
from app.services.sun_service import LEVEL_SCALE
from app.services.simulation_engine import Simulation

DIFFICULTIES = {
    "cadet": SimConfig(),
    # Storm Season: a normal power budget, but solar storms hit harder and shielding matters more.
    "storm_season": replace(SimConfig(), storm_scale=1.6, bonus_event_days=(6, 14)),
    # The Long Night: a tighter power budget and smaller starting reserves, no extra storms.
    "the_long_night": replace(SimConfig(), g_max=18.0, start_power=48.0, start_water=45.0, start_food=50.0),
    # Commander: less sunlight power, smaller starting supplies and two extra problems (days 5 and 13).
    "commander": replace(SimConfig(), g_max=20.0, start_power=50.0, start_water=42.0, start_food=52.0,
                         bonus_event_days=(5, 13)),
}


class MissionNotFound(LookupError):
    pass


def _research_line(sim) -> str:
    got, goal = sim.values()["research"], sim.config.research_goal
    return (f"Research goal reached: {got:g} points (goal {goal:g})" if got >= goal
            else f"Research: {got:g} of {goal:g} points")


def _research_sentence(sim) -> str:
    got, goal = sim.values()["research"], sim.config.research_goal
    return (f"You beat the research goal of {goal:g} points with {got:g}." if got >= goal
            else f"Research reached {got:g} of {goal:g} points.")


def config_for(difficulty: str, sun_level: str = "normal") -> SimConfig:
    base = DIFFICULTIES.get(difficulty, DIFFICULTIES["cadet"])
    scale = LEVEL_SCALE.get(sun_level or "normal", 1.0)
    return replace(base, storm_scale=scale) if scale != base.storm_scale else base


# ---------- creating and loading ----------
def start_mission(db: Session, nickname: str, difficulty: str, seed=None, sun: dict | None = None) -> Mission:
    player = db.scalar(select(Player).where(Player.nickname == nickname))
    if player is None:
        player = Player(nickname=nickname)
        db.add(player)
        db.flush()
    mission = Mission(
        player_id=player.id, difficulty=difficulty, status="active", current_day=1,
        seed=seed if seed is not None else secrets.randbelow(1_000_000),
        sun_level=(sun or {}).get("level", "normal"), sun_info=sun,
    )
    db.add(mission)
    db.flush()
    _save_snapshot(db, mission, Simulation(config=config_for(difficulty, mission.sun_level), seed=mission.seed).history[0])
    db.commit()
    return mission


def load(db: Session, mission_id: int):
    mission = db.get(Mission, mission_id)
    if mission is None:
        raise MissionNotFound(f"Mission {mission_id} not found.")
    decisions = db.scalars(
        select(PlayerDecision).where(PlayerDecision.mission_id == mission_id).order_by(PlayerDecision.day)
    ).all()
    return mission, rebuild(mission, decisions)


def rebuild(mission: Mission, decisions: list) -> Simulation:
    sim = Simulation(config=config_for(mission.difficulty, mission.sun_level), seed=mission.seed)
    by_day = {d.day: d for d in decisions}
    finished = mission.status != "active"
    while sim.state.status == "active" and (finished or sim.state.day < mission.current_day):
        event = sim.current_event()
        if event is not None:
            saved = by_day[sim.state.day]
            sim.decide(saved.event_id, saved.selected_option)
        sim.advance_day()
    if sim.state.status == "active":
        event = sim.current_event()
        if event is not None and sim.state.day in by_day:
            saved = by_day[sim.state.day]
            sim.decide(saved.event_id, saved.selected_option)
    return sim


# ---------- acting ----------
def make_decision(db: Session, mission: Mission, sim: Simulation, event_id: str, option_id: str) -> dict:
    """Run the decision through the engine. Raises DecisionError subclasses; nothing is saved on error."""
    event = sim.current_event()
    record = sim.decide(event_id, option_id)
    db.add(PlayerDecision(
        mission_id=mission.id, event_id=event_id, day=record["day"],
        selected_option=option_id, effects=record["effects"],
    ))
    db.commit()
    return {"record": record, "learning": event.learning}


def advance(db: Session, mission: Mission, sim: Simulation) -> dict:
    report = sim.advance_day()
    mission.current_day = sim.state.day
    mission.status = sim.state.status
    _save_snapshot(db, mission, sim.history[-1])
    if sim.state.status != "active":
        _save_report(db, mission, sim)
    db.commit()
    return report


def restart(db: Session, mission: Mission) -> Mission:
    """New mission with the SAME seed and difficulty: same scenario, fresh chance to try a new strategy."""
    player = db.get(Player, mission.player_id)
    return start_mission(db, player.nickname, mission.difficulty, mission.seed, sun=mission.sun_info)


def recent_missions(db: Session, limit: int = 10) -> list:
    rows = db.scalars(select(Mission).order_by(Mission.id.desc()).limit(limit)).all()
    return [{"id": m.id, "difficulty": m.difficulty, "status": m.status,
             "current_day": m.current_day, "seed": m.seed,
             "created_at": m.created_at.isoformat() if m.created_at else None} for m in rows]


# ---------- views sent to the frontend ----------
def event_view(sim: Simulation):
    event = sim.current_event()
    if event is None:
        return None
    s = sim.state
    options = []
    # Presentation only: shuffle the order shown (same seed + event = same order, so replays match).
    # The engine never uses this order, so no calculation changes. It stops "A is always safest".
    shown = list(event.options)
    random.Random(f"{sim.seed}:{event.id}").shuffle(shown)
    for opt in shown:
        missing = [(k, v) for k, v in opt.requires.items() if getattr(s, k) < v]
        options.append({
            "id": opt.id, "label": opt.label, "description": opt.description,
            "touches": list(opt.touches),
            "available": not missing,
            "unavailable_reason": (
                f"Needs {missing[0][0]} of at least {missing[0][1]:g}" if missing else None),
        })
    return {
        "id": event.id, "title": event.title, "description": event.description,
        "category": event.category, "source": event.source, "difficulty": event.difficulty,
        "stage": event.stage, "options": options, "decided": sim._decided_today,
    }


def warnings_for(sim: Simulation) -> list:
    cfg, s = sim.config, sim.state
    items = []

    def add(level, system, text):
        items.append({"level": level, "system": system, "text": text})

    if s.power < 15:
        add("danger", "power", "Power is almost gone. Some systems may switch off.")
    elif s.power < 35:
        add("warning", "power", "Power is getting low.")
    if s.oxygen < cfg.oxygen_low:
        add("danger", "oxygen", "Oxygen is low. The crew needs it to breathe.")
    if s.water < cfg.water_low:
        add("danger", "water", "Water is low.")
    elif s.water < 40:
        add("warning", "water", "Water is shrinking.")
    if s.food < cfg.food_low:
        add("danger", "food", "Food is low.")
    elif s.food < 35:
        add("warning", "food", "Food is getting low.")
    if s.crew_health < 60:
        add("danger", "crew", "The crew is not feeling well.")
    if s.comms < 70:
        add("warning", "comms", "The link to Earth is weak, so research is slower.")
    if s.sunlight_mods:
        add("warning", "power", "Low sunlight. Solar panels make less power.")
    if s.hazards:
        add("danger" if s.shelter_days_left == 0 else "warning", "protection",
            "Simulated radiation risk is high. Protect the crew!" if s.shelter_days_left == 0
            else "The crew is sheltering from simulated radiation risk.")
    if s.shielding < 30:
        add("warning", "protection", "Protection is low.")
    return items


def mission_view(db: Session, mission: Mission, sim: Simulation) -> dict:
    stage_number = stage_for_day(sim.state.day)
    event_titles = {e_id: e.title for e_id, e in sim.events.items()}
    player = db.get(Player, mission.player_id)
    decisions = []
    for d in sim.decisions:
        decisions.append({
            "day": d["day"], "event_id": d["event_id"], "event_title": event_titles[d["event_id"]],
            "option_id": d["option_id"], "label": d["label"],
        })
    return {
        "id": mission.id,
        "player": player.nickname,
        "difficulty": mission.difficulty,
        "seed": mission.seed,
        "sun": mission.sun_info,
        "label": f"Lunar Outpost ASTRA-{mission.id:03d}",
        "status": sim.state.status,
        "state": sim.public_state(),
        "stage": {"number": stage_number, **STAGES[stage_number]},
        "event": event_view(sim),
        "warnings": warnings_for(sim),
        "objectives": [
            STAGES[stage_number]["goal"],
            _research_line(sim),
            f"Keep the crew safe until day {sim.config.mission_days}",
        ],
        "history": [{"day": h["day"], "values": h["values"]} for h in sim.history],
        "decisions": decisions,
        "disclaimer": "All numbers are simulated game units, not NASA measurements.",
    }


def report_view(mission: Mission, sim: Simulation) -> dict:
    s = sim.state
    final = s.status != "active"
    seen = []
    for d in sim.decisions:
        learning = sim.events[d["event_id"]].learning
        if learning not in seen:
            seen.append(learning)
    evaluation = sim.evaluate()
    investigation = sim.investigate()
    if s.status == "success":
        summary = (f"Your crew survived all {sim.config.mission_days} days. "
                   + _research_sentence(sim))
    elif s.status == "failed":
        summary = f"Mission ended on day {s.failure['day']}: {s.failure['text']}"
    else:
        summary = f"Mission in progress: day {s.day} of {sim.config.mission_days}."
    return {
        "mission_id": mission.id,
        "status": s.status,
        "final": final,
        "summary": summary,
        "evaluation": evaluation,
        "score_insights": sim.explain_scores(),
        "learning_outcomes": seen,
        "investigation": investigation,
        "decisions": [{"day": d["day"], "event_id": d["event_id"], "option_id": d["option_id"],
                       "label": d["label"], "event_title": sim.events[d["event_id"]].title} for d in sim.decisions],
        "history": [{"day": h["day"], "values": h["values"]} for h in sim.history],
        "label": "SIMULATED",
        "disclaimer": "Simulated educational outcome. Values are game units, not NASA measurements.",
    }


# ---------- saving helpers ----------
def _save_snapshot(db: Session, mission: Mission, snapshot: dict):
    v = snapshot["values"]
    db.add(ResourceState(
        mission_id=mission.id, day=snapshot["day"], power=v["power"], oxygen=v["oxygen"],
        water=v["water"], food=v["food"], shielding=v["shielding"], crew_health=v["crew_health"],
    ))


def _save_report(db: Session, mission: Mission, sim: Simulation):
    if db.scalar(select(MissionReport).where(MissionReport.mission_id == mission.id)):
        return
    view = report_view(mission, sim)
    db.add(MissionReport(
        mission_id=mission.id, summary=view["summary"],
        score=view["evaluation"]["overall"] or 0, learning_outcomes=view["learning_outcomes"],
    ))
