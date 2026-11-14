"""What If? Lab engine (spec section 6).

An experiment runs on an ISOLATED COPY of a simulation. It runs the same copy twice:
once unchanged (the "normal" run) and once with the player's changes (the "what if" run).
The caller's simulation is never modified, and nothing is saved to the database.
All results are simulated educational outcomes in game units.
"""
from dataclasses import replace

from app.services import formulas as F
from app.services.simulation_engine import Simulation

# Slider information. The frontend builds its sliders from this, so limits live in one place.
PARAM_INFO = [
    {"key": "food_production_pct", "label": "Food production", "unit": "%", "min": -50, "max": 100, "step": 10,
     "question": "What if the greenhouse grows more (or less) food?"},
    {"key": "solar_power_pct", "label": "Sunlight power", "unit": "%", "min": -60, "max": 50, "step": 10,
     "question": "What if the solar panels make less (or more) power?"},
    {"key": "water_recycling_pct", "label": "Water recycling", "unit": "%", "min": -50, "max": 50, "step": 10,
     "question": "What if the water recycler works better (or worse)?"},
    {"key": "energy_use_pct", "label": "Energy use", "unit": "%", "min": -30, "max": 50, "step": 10,
     "question": "What if the machines use more (or less) electricity?"},
    {"key": "shielding_boost", "label": "Extra shielding", "unit": "points", "min": 0, "max": 40, "step": 5,
     "question": "What if the habitat had stronger radiation shielding?"},
]

STORM = {"severity": 0.8, "days_left": 3}      # the training storm used when the storm switch is on
CHART_KEYS = ("power", "oxygen", "water", "food", "crew_health", "research")
COMPARE_KEYS = CHART_KEYS + ("shielding",)
LABELS = {"power": "Power", "oxygen": "Oxygen", "water": "Water", "food": "Food",
          "crew_health": "Crew health", "research": "Research", "shielding": "Protection"}

LESSONS = {
    "food_production_pct": "Plants make food using power and water. More food is great, but check what else changed.",
    "solar_power_pct": "Solar panels turn sunlight into electricity. With less power, some jobs have to switch off.",
    "water_recycling_pct": "A better recycler gives back more clean water, so the outpost wastes less.",
    "energy_use_pct": "Every machine uses electricity. Using less leaves more for other jobs, and using more can leave some jobs without power.",
    "shielding_boost": "Shielding reduces how much radiation reaches the crew. It only matters when there is radiation around.",
}


def _scaled(value: float, pct: float) -> float:
    return value * (1.0 + pct / 100.0)


def apply_changes(sim: Simulation, params: dict, storm: bool) -> None:
    """Change a copy of a simulation (never the real one) according to the slider values."""
    cfg = sim.config
    factor = 1.0 + params.get("energy_use_pct", 0.0) / 100.0
    sim.config = replace(
        cfg,
        greenhouse_food_per_level=_scaled(cfg.greenhouse_food_per_level, params.get("food_production_pct", 0.0)),
        g_max=_scaled(cfg.g_max, params.get("solar_power_pct", 0.0)),
        water_recycler_output=_scaled(cfg.water_recycler_output, params.get("water_recycling_pct", 0.0)),
        oxygen_gen_power=cfg.oxygen_gen_power * factor,
        water_recycler_power=cfg.water_recycler_power * factor,
        comms_power=cfg.comms_power * factor,
        greenhouse_power_per_level=cfg.greenhouse_power_per_level * factor,
        research_power_per_level=cfg.research_power_per_level * factor,
    )
    sim.state.shielding = F.clamp(sim.state.shielding + params.get("shielding_boost", 0.0))
    _prepare(sim, storm)


def _prepare(sim: Simulation, storm: bool) -> None:
    sim.schedule = {}                      # an experiment has no random events: only your changes matter
    if storm:
        sim.state.hazards.append(dict(STORM))


def _run(sim: Simulation, days: int) -> dict:
    series = [{"day": 0, "values": sim.values()}]
    for lab_day in range(1, days + 1):
        if sim.state.status != "active":
            break
        report = sim.advance_day()
        series.append({"day": lab_day, "values": report["values"]})
    failure = sim.state.failure
    return {
        "series": series,
        "final": series[-1]["values"],
        "status": sim.state.status,
        "ended_early": None if failure is None else f"Ended on lab day {failure['day']}: {failure['text']}",
    }


def run_experiment(base: Simulation, params: dict, days: int = 7, storm: bool = False) -> dict:
    """Run the normal copy and the what-if copy side by side. `base` is never changed."""
    normal = base.clone()
    changed = base.clone()
    _prepare(normal, storm)
    apply_changes(changed, params, storm)

    before = _run(normal, days)
    after = _run(changed, days)
    change = {k: round(after["final"][k] - before["final"][k], 2) for k in COMPARE_KEYS}
    direction = {k: ("up" if v > 0.5 else "down" if v < -0.5 else "same") for k, v in change.items()}
    return {
        "label": "SIMULATED",
        "disclaimer": "Simulated educational outcome in game units. Your real mission was not changed.",
        "days": days,
        "storm": storm,
        "params": params,
        "normal": before,
        "what_if": after,
        "change": change,
        "direction": direction,
        "explanation": explain(params, storm, change, direction),
    }


def explain(params: dict, storm: bool, change: dict, direction: dict) -> list:
    """Short, kid-friendly sentences built from the real results."""
    lines = []
    for key in ("power", "oxygen", "water", "food", "crew_health", "research"):
        if direction[key] != "same":
            word = "higher" if direction[key] == "up" else "lower"
            lines.append(f"{LABELS[key]} ends {abs(change[key]):g} {word} than in the normal run.")
    if not lines:
        lines.append("Your changes made almost no difference over these days.")

    core = [direction[k] for k in ("power", "oxygen", "water", "food")]
    if "up" in core and "down" in core:
        lines.append("Notice the trade-off: making one thing better made another thing worse.")

    for key, lesson in LESSONS.items():
        if params.get(key, 0.0) != 0.0:
            lines.append(lesson)
    if params.get("shielding_boost", 0.0) > 0 and not storm:
        lines.append("Tip: turn on the training storm to see what the extra shielding really does.")
    return lines
