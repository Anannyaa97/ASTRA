"""Link the REAL Sun to the training game, honestly.

When a mission starts, ASTRA looks at how busy the real Sun has been over the last 30 days (NASA DONKI) and
uses that to nudge how strong the game's TRAINING solar storm is. This is a game rule inspired by NASA data:

  * It does NOT make the game storm a real event, and it never produces a radiation dose.
  * The level is saved with the mission, so replays and "try again" use the same storm strength.
  * If NASA data is not available, the standard strength is used and the player is told so.
"""
import re
from datetime import datetime

from sqlalchemy.orm import Session

from app.services import nasa_service

LEVEL_SCALE = {"quiet": 0.85, "normal": 1.0, "stormy": 1.2}
QUIET_BELOW = 8        # activity points in 30 days
STORMY_FROM = 30
RULE = ("Our simple game rule: 1 point for each strong flare (class M or X), 2 for each magnetic storm and "
        f"3 for each particle event in the last 30 days. Under {QUIET_BELOW} points is a quiet Sun, "
        f"{STORMY_FROM} or more is a stormy Sun.")
STRONG = re.compile(r"\(([MX])\d", re.IGNORECASE)

TEXT = {
    "quiet": "The real Sun has been quiet, so the training storm is a bit gentler (15% weaker).",
    "normal": "The real Sun has been about normal, so the training storm has its standard strength.",
    "stormy": "The real Sun has been very busy, so the training storm is a bit stronger (20% stronger).",
}


def classify(points: int) -> str:
    return "quiet" if points < QUIET_BELOW else "stormy" if points >= STORMY_FROM else "normal"


def standard(message: str, status: str = "ARCHIVED") -> dict:
    return {"level": "normal", "scale": 1.0, "status": status, "retrieved_at": None, "window_days": 30,
            "counts": None, "points": None, "message": message, "rule": RULE,
            "disclaimer": "The storm in the game is invented. This only sets how strong the training storm is."}


def current_sun(db: Session, http_get=None, now: datetime | None = None) -> dict:
    """Never raises. Falls back to the standard storm strength when NASA data is not available."""
    try:
        view = nasa_service.get_space_weather(db, 30, http_get=http_get, now=now)
    except Exception:                                   # a problem here must never stop a mission starting
        return standard("NASA space weather was not available, so the training storm has its standard strength.")
    if view["status"] == "ARCHIVED":
        return standard("NASA space weather was not available when this mission began, so the training storm "
                        "has its standard strength.")
    events = view["events"]
    strong = sum(1 for e in events if e["type"] == "FLR" and STRONG.search(e.get("headline", "")))
    counts = {"strong_flares": strong, "cmes": view["counts"]["CME"],
              "particle_events": view["counts"]["SEP"], "magnetic_storms": view["counts"]["GST"]}
    points = strong + 2 * counts["magnetic_storms"] + 3 * counts["particle_events"]
    level = classify(points)
    return {"level": level, "scale": LEVEL_SCALE[level], "status": view["status"],
            "retrieved_at": view["retrieved_at"], "window_days": 30, "counts": counts, "points": points,
            "message": TEXT[level], "rule": RULE,
            "disclaimer": "The storm in the game is invented. This only sets how strong the training storm is."}
