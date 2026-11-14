"""Mission Advisor: four expert voices (spec section 14).

READ ONLY and rule based. The advisors look at the current simulation and give hints.
They never change the mission, and they are made-up characters, not real NASA staff.
Every sentence is built from the real numbers in the simulation, so advice always matches the game.
"""
from app.services.simulation_engine import HEALTH_REASON_TEXT, Simulation, signal_status

LOW, CRITICAL = 50.0, 25.0
SEVERITY = {"danger": 0, "warn": 1, "info": 2, "ok": 3}

ADVISORS = (
    ("commander", "Commander", "Looks at the whole mission"),
    ("engineer", "Systems Engineer", "Power, solar panels and the link to Earth"),
    ("life_support", "Life Support Scientist", "Air, water, food and crew health"),
    ("space_weather", "Space Weather Specialist", "Radiation and shielding"),
)

RESOURCE_TIPS = {
    "oxygen": "Keep the oxygen generator powered. It should be the last system you ever cut.",
    "water": "Plants drink water. Give the water recycler enough power, or slow the greenhouse.",
    "food": "Keep the greenhouse growing. Plants take several days to catch up.",
}
NAMES = {"power": "Power", "oxygen": "Oxygen", "water": "Water", "food": "Food"}


def _days(n) -> str:
    """'1 day' or '5 days', so the advice never says '1 days'."""
    n = int(round(n))
    return f"{n} day" if n == 1 else f"{n} days"


def _more_days(n) -> str:
    """'1 more day' or '4 more days'."""
    n = int(round(n))
    return f"{n} more day" if n == 1 else f"{n} more days"


def _msg(level: str, headline: str, text: str) -> dict:
    return {"level": level, "headline": headline, "text": text}


def _trend(sim: Simulation, key: str, span: int = 3) -> float:
    """Average change per day over the last few days (negative means falling)."""
    history = sim.history
    n = min(span, len(history) - 1)
    if n < 1:
        return 0.0
    return (history[-1]["values"][key] - history[-1 - n]["values"][key]) / n


def _days_until_empty(value: float, trend: float):
    return value / -trend if trend < -0.25 else None


def _sorted(messages: list) -> list:
    return sorted(messages, key=lambda m: SEVERITY[m["level"]])[:3]


# ---------- the four voices ----------
def _engineer(sim: Simulation, remaining: int) -> list:
    s, v, out = sim.state, sim.values(), []
    power = v["power"]
    trend = _trend(sim, "power")
    left = _days_until_empty(power, trend)

    if power < CRITICAL:
        out.append(_msg("danger", "Power is critical",
                        f"Power is down to {power:g}. Oxygen and water keep their power first, but the greenhouse "
                        "and research switch off when it runs out. Pause the least important jobs."))
    elif left is not None and left <= remaining:
        out.append(_msg("warn", "Power is falling",
                        f"Power is falling about {abs(trend):.1f} a day. At this rate it could run out in "
                        f"about {_days(left)}."))

    if s.sunlight_mods:
        factor = 1.0
        for mod in s.sunlight_mods:
            factor *= mod["factor"]
        days = max(mod["days_left"] for mod in s.sunlight_mods)
        out.append(_msg("warn", "Sunlight is low",
                        f"For about {_more_days(days)} the panels get little sunlight, so they make roughly "
                        f"{factor * s.efficiency['solar'] * 100:.0f}% of their normal power."))

    if s.efficiency["solar"] < 1.0:
        out.append(_msg("warn", "The panels need care",
                        f"The solar panels are only working at {s.efficiency['solar'] * 100:.0f}% (for example "
                        "because of dust or damage). Cleaning or repairing them brings the power back."))

    if v["comms"] < 100:
        out.append(_msg("warn", "The link to Earth is weak",
                        f"The link to Earth is at {v['comms']:g}%. Research slows down until it is repaired."))

    if not out:
        out.append(_msg("ok", "Power looks steady", f"Power is {power:g} and the panels are working well."))
    return _sorted(out)


def _life_support(sim: Simulation, remaining: int) -> list:
    v, out = sim.values(), []
    for key in ("oxygen", "water", "food"):
        value, trend = v[key], _trend(sim, key)
        left = _days_until_empty(value, trend)
        falling = f" It is falling about {abs(trend):.1f} a day." if trend < -0.25 else ""
        if value < CRITICAL:
            out.append(_msg("danger", f"{NAMES[key]} is critical",
                            f"{NAMES[key]} is down to {value:g}.{falling} {RESOURCE_TIPS[key]}"))
        elif value < LOW:
            out.append(_msg("warn", f"{NAMES[key]} is getting low",
                            f"{NAMES[key]} is {value:g}.{falling} {RESOURCE_TIPS[key]}"))
        elif left is not None and left <= remaining:
            out.append(_msg("warn", f"{NAMES[key]} is slowly falling",
                            f"{NAMES[key]} is {value:g} but falling about {abs(trend):.1f} a day. "
                            f"If nothing changes it could run out in about {_days(left)}."))

    health = v["crew_health"]
    if health < 90:
        reasons = sim.history[-1]["flows"]["health_loss_reasons"] if sim.history[-1]["flows"] else []
        why = " ".join(HEALTH_REASON_TEXT.get(r, r) for r in reasons)
        level = "danger" if health < CRITICAL * 2 else "warn"
        out.append(_msg(level, "The crew is not at full health",
                        f"Crew health is {health:g} out of 100. {why}".strip()))

    if not out:
        out.append(_msg("ok", "Air, water and food are fine",
                        f"Oxygen {v['oxygen']:g}, water {v['water']:g}, food {v['food']:g}. "
                        f"Crew health is {health:g}."))
    return _sorted(out)


def _space_weather(sim: Simulation) -> list:
    s, shielding = sim.state, sim.values()["shielding"]
    if s.hazards:
        days = max(h["days_left"] for h in s.hazards)
        if s.shelter_days_left > 0:
            return [_msg("ok", "Storm: the crew is sheltering",
                         f"A simulated radiation storm has about {_more_days(days)}. Sheltering gives the most "
                         "protection. The greenhouse and science are paused until it is over.")]
        level = "danger" if shielding < LOW else "warn"
        return [_msg(level, "Radiation storm in progress",
                     f"A simulated radiation storm has about {_more_days(days)} and the crew is not sheltering. "
                     f"Protection is {shielding:g}. Sheltering protects the most, and extra shielding helps too.")]
    if shielding < LOW:
        return [_msg("warn", "Protection is low",
                     f"Nothing is happening now, but Protection is only {shielding:g}. Improving shielding before "
                     "a storm is safer than hoping for the best.")]
    return [_msg("ok", "Quiet in the game",
                 f"No storm right now and Protection is good ({shielding:g}). "
                 "This is the game's training weather, not a real forecast.")]


def _commander(sim: Simulation, others: list, remaining: int) -> list:
    s, v, out = sim.state, sim.values(), []
    if s.status != "active":
        done = s.status == "success"
        return [_msg("ok" if done else "danger", "The mission is over",
                     "Your crew made it through all the days." if done
                     else "The mission ended early. Read the report to see what happened.")]

    urgent = [m for m in others if m["level"] != "ok"]
    if urgent:
        top = min(urgent, key=lambda m: SEVERITY[m["level"]])
        out.append(_msg(top["level"], "Biggest worry right now",
                        f"{top['headline']}. Deal with that first. There are {_days(remaining)} to go."))
    else:
        out.append(_msg("ok", "All systems are steady", f"Everything looks good. {_days(remaining)} to go."))

    event = sim.current_event()
    if event is not None and not sim.public_state()["decided_today"]:
        out.append(_msg("info", "A decision is waiting",
                        f"Today's event is '{event.title}'. Read each option and use the preview before you decide."))

    goal = sim.config.research_goal
    expected = goal * (s.day - 1) / sim.config.mission_days
    if v["research"] < expected * 0.8:
        out.append(_msg("warn", "Research is behind",
                        f"Research is {v['research']:g} of {goal:g} points, a little behind where it should be."))
    elif v["research"] >= goal:
        out.append(_msg("ok", "Research goal reached", f"Research is {v['research']:g}, above the goal of {goal:g}."))
    return _sorted(out)


BLACKOUT_MESSAGE = _msg(
    "danger", "No signal",
    "Mission Control can't be heard right now. The link to Earth is too weak to carry a message. "
    "Restore power or repair the communication equipment, and their advice will get through again.",
)


def advise(sim: Simulation) -> dict:
    """Advice for the current moment. Does not modify `sim`."""
    signal = signal_status(sim.state.comms)

    # A real outpost does not get to hear from Earth whenever it likes. When the
    # link is down, every advisor's voice goes with it -- the player is on their own
    # until power or the equipment brings the signal back.
    if signal == "blackout" and sim.state.status == "active":
        blacked_out = [BLACKOUT_MESSAGE]
        return {
            "day": sim.state.day,
            "status": sim.state.status,
            "signal": signal,
            "advisors": [{"id": i, "name": n, "focus": f, "messages": blacked_out} for i, n, f in ADVISORS],
            "disclaimer": "The advisors are made-up characters. They read your game numbers and follow simple rules. "
                          "Their advice is only a hint, and you make the decisions.",
        }

    remaining = max(0, sim.config.mission_days - sim.state.day + 1)
    engineer = _engineer(sim, remaining)
    life = _life_support(sim, remaining)
    weather = _space_weather(sim)
    commander = _commander(sim, engineer + life + weather, remaining)
    if signal == "delayed" and sim.state.status == "active":
        commander = [_msg("warn", "The link is weak",
                           "Messages to and from Earth are slow right now. Advice may be a little out of date."),
                     *commander]
    by_id = {"commander": commander, "engineer": engineer, "life_support": life, "space_weather": weather}
    return {
        "day": sim.state.day,
        "status": sim.state.status,
        "signal": signal,
        "advisors": [{"id": i, "name": n, "focus": f, "messages": by_id[i]} for i, n, f in ADVISORS],
        "disclaimer": "The advisors are made-up characters. They read your game numbers and follow simple rules. "
                      "Their advice is only a hint, and you make the decisions.",
    }
