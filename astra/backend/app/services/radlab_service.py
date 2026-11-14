"""NASA OSDR RadLab: real radiation dose-rate readings from instruments on the International Space Station.

Same honest labels as the space-weather service:
  LIVE      retrieved from NASA just now
  CACHED    NASA could not be reached, so this is the last successful answer (with its real retrieval time)
  ARCHIVED  nothing live or cached exists, so this is a real sample day the author saved earlier

These are measurements in low Earth orbit. They are NOT Moon measurements, and they are NOT the numbers
used inside the game (the game's radiation risk is a simulated indicator).
"""
from datetime import date, datetime, timedelta, timezone
from math import isfinite

from sqlalchemy.orm import Session

from app.core.config import settings
from app.data.radlab_archive import ARCHIVE_DAY, ARCHIVE_HOURLY, ARCHIVE_SUMMARY, RADLAB_HOME
from app.services.nasa_service import FetchError, _cache_get, _cache_put, _http_get

REFERENCE_DAY = ARCHIVE_DAY          # a day we have checked really has readings
UNIT = "micrograys per hour (µGy/h)"
SOURCE = "NASA OSDR RadLab (radiation dosimetry on the International Space Station)"
CACHE_KEY = f"radlab:{REFERENCE_DAY}"

EXPLAIN = [
    "Radiation is energy and tiny particles that travel through space.",
    "These are real readings from dose-measuring instruments (DosTel1 and DosTel2) on the International Space Station.",
    "The number jumps at some hours because the station keeps circling Earth, and Earth's magnetic field "
    "protects less in some parts of the orbit.",
]
DISCLAIMER = ("These are measurements in orbit around Earth, not on the Moon. ASTRA's Protection dial and "
              "radiation risk are simulated game numbers, not these readings.")


def build_url(day: str) -> str:
    """RadLab only accepts `fields+=` together with `query=`, so the whole request uses the query form."""
    end = (date.fromisoformat(day) + timedelta(days=1)).isoformat()
    query = f"(timestamp>={day})AND(timestamp<{end})AND(spacecraft=ISS)AND(instrument=DosTel)"
    return f"{settings.radlab_base_url}?query={query}&fields+=absorbed_dose_rate,instrument_family&format=json"


def summarise(raw) -> tuple[list, dict, int]:
    """Validate a RadLab JSON answer ({"columns": [...], "data": [[...]]}) and average it per hour.

    Returns (hourly rows, whole-day summary, number of readings skipped because they looked wrong)."""
    if not isinstance(raw, dict) or not isinstance(raw.get("columns"), list) or not isinstance(raw.get("data"), list):
        raise FetchError("RadLab: unexpected response shape")
    columns = raw["columns"]
    if "timestamp" not in columns or "absorbed_dose_rate" not in columns:
        raise FetchError("RadLab: timestamp or absorbed_dose_rate column missing")
    t_i, d_i = columns.index("timestamp"), columns.index("absorbed_dose_rate")

    per_hour: dict[int, list] = {}
    skipped = 0
    for row in raw["data"]:
        try:
            hour = int(str(row[t_i])[11:13])
            dose = float(row[d_i])
        except (TypeError, ValueError, IndexError):
            skipped += 1
            continue
        if not (0 <= hour <= 23) or not isfinite(dose) or dose < 0:
            skipped += 1
            continue
        per_hour.setdefault(hour, []).append(dose)

    all_doses = [d for v in per_hour.values() for d in v]
    if not all_doses:
        raise FetchError("RadLab: no usable readings")
    hourly = [{"hour": h, "readings": len(per_hour[h]), "average": round(sum(per_hour[h]) / len(per_hour[h]), 4)}
              for h in sorted(per_hour)]
    summary = {"readings": len(all_doses), "average": round(sum(all_doses) / len(all_doses), 4),
               "minimum": round(min(all_doses), 4), "maximum": round(max(all_doses), 4)}
    return hourly, summary, skipped


def _view(status, hourly, summary, retrieved_at, message, skipped=0):
    return {
        "status": status, "source": SOURCE, "source_url": RADLAB_HOME,
        "retrieved_at": retrieved_at, "data_day": REFERENCE_DAY,
        "spacecraft": "International Space Station (ISS)", "instruments": "DosTel1 and DosTel2",
        "unit": UNIT, "hourly": hourly, "summary": summary, "skipped_readings": skipped,
        "message": message, "explain": EXPLAIN, "disclaimer": DISCLAIMER,
    }


def get_iss_radiation(db: Session, http_get=None, now: datetime | None = None) -> dict:
    """LIVE if NASA answers, else CACHED, else ARCHIVED. Never raises because of NASA."""
    http_get = http_get or _http_get
    now = now or datetime.now(timezone.utc)
    url = build_url(REFERENCE_DAY)
    try:
        raw = http_get(url, None, settings.radlab_timeout_seconds) if http_get is _http_get else http_get(url, None)
        hourly, summary, skipped = summarise(raw)
    except FetchError:
        cached = _cache_get(db, CACHE_KEY)
        if cached is not None:
            view = dict(cached.payload)
            view.update(status="CACHED", retrieved_at=cached.retrieved_at.isoformat(),
                        message="Could not reach NASA, so this is the last answer we saved.")
            return view
        hourly = [{"hour": h, "readings": n, "average": a} for h, n, a in ARCHIVE_HOURLY]
        return _view("ARCHIVED", hourly, dict(ARCHIVE_SUMMARY), None,
                     "Could not reach NASA and nothing was saved yet. Showing a real sample day saved earlier.")
    view = _view("LIVE", hourly, summary, now.isoformat(),
                 f"NASA RadLab sent {summary['readings']} readings for {REFERENCE_DAY}.", skipped)
    _cache_put(db, CACHE_KEY, view, RADLAB_HOME, now)
    return view
