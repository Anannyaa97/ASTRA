"""Achievement badges, worked out from the REAL mission history (never stored, never random).

Each badge says how to earn it (`how`) and, once earned, the real numbers behind it (`detail`).
Most badges need a finished, successful mission so a badge cannot be earned by luck on day 1.
`icon` names a lucide icon used by the frontend.
"""

CHECK_MIN = 25.0     # "never dropped below" level for oxygen / water / power
SAFE_CREW = 80.0     # crew health must stay at or above this for "Everyone Safe"
GOOD_SCORE = 70.0
STORM_SCORE = 90.0


def _lowest(history, key):
    day_values = [(h["day"], h["values"][key]) for h in history]
    day, value = min(day_values, key=lambda item: item[1])
    return day, value


def achievements(sim) -> list:
    """Return every badge as {id, title, icon, how, earned, detail}. Pure: does not change the mission."""
    state = sim.state
    won = state.status == "success"
    evaluation = sim.evaluate()
    scores = evaluation["scores"]
    history = sim.history
    badges = []

    def badge(id, title, icon, how, earned, detail=""):
        badges.append({"id": id, "title": title, "icon": icon, "how": how,
                       "earned": bool(earned), "detail": detail if earned else ""})

    badge("first_command", "First Command", "Rocket",
          "Make your first decision as commander.",
          len(sim.decisions) > 0, f"Your first choice was on day {sim.decisions[0]['day']}." if sim.decisions else "")

    badge("mission_complete", "Mission Complete", "Flag",
          "Keep the outpost running until the last day.",
          won, f"You finished all {sim.config.mission_days} days.")

    crew_day, crew_low = _lowest(history, "crew_health")
    badge("everyone_safe", "Everyone Safe", "HeartPulse",
          f"Finish the mission with crew health never below {SAFE_CREW:g}.",
          won and crew_low >= SAFE_CREW, f"Crew health never went below {crew_low:g}.")

    air_day, air_low = _lowest(history, "oxygen")
    badge("always_breathing", "Always Breathing", "Wind",
          f"Finish the mission with oxygen never below {CHECK_MIN:g}.",
          won and air_low >= CHECK_MIN, f"Oxygen never went below {air_low:g}.")

    water_day, water_low = _lowest(history, "water")
    badge("water_keeper", "Water Keeper", "Droplets",
          f"Finish the mission with water never below {CHECK_MIN:g}.",
          won and water_low >= CHECK_MIN, f"Water never went below {water_low:g}.")

    power_day, power_low = _lowest(history, "power")
    badge("power_planner", "Power Planner", "Sun",
          f"Finish the mission with power never below {CHECK_MIN:g}.",
          won and power_low >= CHECK_MIN, f"Power never went below {power_low:g}.")

    badge("green_thumb", "Green Thumb", "Sprout",
          "Finish the mission with plenty of food (70 or more).",
          won and state.food >= 70, f"You ended with food at {state.food:g}.")

    badge("science_star", "Science Star", "FlaskConical",
          "Reach the research goal.",
          state.research >= sim.config.research_goal,
          f"You beat the research goal of {sim.config.research_goal:g} with {state.research:g} points.")

    storm = scores.get("emergency_response")
    badge("storm_ready", "Storm Ready", "ShieldCheck",
          f"Get an Emergency response score of {STORM_SCORE:g} or more in the radiation storm.",
          won and storm is not None and storm >= STORM_SCORE, f"Your emergency response score was {storm}.")

    all_good = bool(scores) and all(v >= GOOD_SCORE for v in scores.values() if v is not None)
    badge("calm_commander", "Calm Commander", "Star",
          f"Finish with every score at {GOOD_SCORE:g} or more.",
          won and all_good, "Every part of your mission scored well.")

    return badges
