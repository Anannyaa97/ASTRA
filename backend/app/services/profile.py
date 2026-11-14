"""Engineering Decision Profile: describes the player's STYLE from the decisions they really made.

It is a play style, not a grade, and never a label of how clever a child is.
Each decision can add one point to a style. A decision that changed nothing adds nothing.
"""

MIN_DECISIONS = 3
GUARD_SYSTEMS = {"oxygen", "water", "solar", "battery"}

# Fixed order: it breaks ties the same way every time (deterministic).
STYLES = [
    {"id": "strategic_survivor", "title": "Strategic Survivor", "icon": "Compass",
     "rule": "Preparing on calm days, before trouble starts.",
     "blurb": "You think ahead. You use quiet days to get ready, so problems hit less hard later.",
     "tip": "Try a mission where you also shelter fast and fix problems the moment they appear."},
    {"id": "resource_guardian", "title": "Resource Guardian", "icon": "Wrench",
     "rule": "Fixing and protecting air, water, batteries and solar panels.",
     "blurb": "You keep the outpost's basics healthy: air, water, batteries and panels.",
     "tip": "Try a mission where you also use quiet days to prepare, and make time for science."},
    {"id": "emergency_specialist", "title": "Emergency Specialist", "icon": "Siren",
     "rule": "Taking action when a problem or storm shows up.",
     "blurb": "When something goes wrong, you act fast instead of waiting.",
     "tip": "Try a mission where you spot trouble early, so there are fewer emergencies to fix."},
    {"id": "scientific_explorer", "title": "Scientific Explorer", "icon": "FlaskConical",
     "rule": "Choosing science and research.",
     "blurb": "You love discovery. You push research forward whenever you can.",
     "tip": "Try a mission where you guard life support first. Science needs power, and power needs planning."},
]


def _acted(d) -> bool:
    """True if the choice really changed something now (resources or settings), not just 'wait'."""
    effects = d["effects"]
    return bool(effects["resources"]) or any(effects["settings"].values())


def _points(d) -> dict:
    """Which styles this one decision counts for."""
    effects = d["effects"]
    touches = set(d["touches"])
    acted = _acted(d)
    return {
        "strategic_survivor": acted and not d["event_is_problem"] and "research" not in touches,
        "resource_guardian": acted and bool(touches & GUARD_SYSTEMS),
        "emergency_specialist": acted and d["event_is_problem"],
        "scientific_explorer": effects["settings"]["research_level"] > 0 or effects["resources"].get("research", 0) > 0,
    }


def profile(sim) -> dict:
    """Return {ready, total_decisions, styles, profile, note}. Pure: does not change the mission."""
    decisions = sim.decisions
    styles = []
    for style in STYLES:
        picked = [d for d in decisions if _points(d)[style["id"]]]
        styles.append({
            "id": style["id"], "title": style["title"], "icon": style["icon"], "rule": style["rule"],
            "count": len(picked),
            "examples": [{"day": d["day"], "label": d["label"]} for d in picked[:3]],
        })

    result = {
        "ready": False, "total_decisions": len(decisions), "styles": styles, "profile": None,
        "note": "This describes your play style, not how smart you are. Try new styles and see what changes!",
    }
    if len(decisions) < MIN_DECISIONS:
        result["message"] = f"Make at least {MIN_DECISIONS} decisions and your profile will appear."
        return result
    best = max(s["count"] for s in styles)
    if best == 0:
        result["message"] = "Your choices have not changed anything yet. Try an action and see your style appear."
        return result

    winner = next(s for s in styles if s["count"] == best)     # first in fixed order wins a tie
    info = next(s for s in STYLES if s["id"] == winner["id"])
    result.update(ready=True, profile={k: info[k] for k in ("id", "title", "icon", "blurb", "tip")})
    result["close_with"] = [s["title"] for s in styles if s["count"] == best and s["id"] != winner["id"]]
    return result
