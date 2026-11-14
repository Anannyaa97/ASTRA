"""NASA DONKI space weather: fetch, validate, normalise, cache, and fall back.

Status of what the app returns (always shown to the player):
  LIVE      retrieved from NASA just now
  CACHED    NASA could not be reached, so this is the last successful answer (with its real retrieval time)
  ARCHIVED  nothing live or cached exists, so these are a few curated, famous historical events

DONKI events are observations of the Sun and near-Earth space. They are NOT radiation doses for astronauts.
"""
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.data.nasa_archive import ARCHIVE, DONKI_HOME
from app.models.tables import NasaCache

EVENT_TYPES = {
    "FLR": "Solar flare",
    "CME": "Coronal mass ejection",
    "SEP": "Solar energetic particle event",
    "GST": "Geomagnetic storm",
}

KID_TEXT = {
    "FLR": "A solar flare is a sudden burst of energy from the Sun.",
    "CME": "A coronal mass ejection (CME) is a huge cloud of charged particles thrown out by the Sun.",
    "SEP": "A solar energetic particle event is when the Sun sends out very fast tiny particles.",
    "GST": "A geomagnetic storm is when solar wind shakes Earth's magnetic field.",
}

FLARE_CLASS_TEXT = {
    "A": "A very small flare.", "B": "A small flare.", "C": "A small flare.",
    "M": "A medium-sized flare.", "X": "A big flare, the strongest group.",
}

DISCLAIMER = ("These are observations of the Sun and of space near Earth. They do not tell us how much "
              "radiation any astronaut received. In ASTRA, the radiation training scenarios are separate, "
              "simulated game events.")

MAX_EVENTS = 30


class FetchError(Exception):
    """NASA could not be reached or sent something we cannot trust."""


def _http_get(url: str, params: dict | None = None, timeout: float | None = None):
    """The real network call. Tests replace it. Returns parsed JSON or raises FetchError."""
    try:
        response = httpx.get(url, params=params, timeout=timeout or settings.donki_timeout_seconds,
                             follow_redirects=True)
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError) as exc:     # ValueError covers invalid JSON
        raise FetchError(f"{type(exc).__name__}: {exc}") from exc


# ---------- normalising ----------
NOTE_LIMIT = 300


def _tidy_note(note) -> str:
    """NASA's scientist note, shortened at a word boundary so it never stops mid-word."""
    if not isinstance(note, str):
        return ""
    text = " ".join(note.split())
    if len(text) <= NOTE_LIMIT:
        return text
    cut = text[:NOTE_LIMIT].rsplit(" ", 1)[0].rstrip(",;:- ")
    return cut + "\u2026"


def _first(item: dict, *names):
    for name in names:
        value = item.get(name)
        if value not in (None, ""):
            return value
    return None


def normalize_event(kind: str, item) -> dict | None:
    """Turn one raw DONKI item into our shape, or None if it is unusable (missing id or time)."""
    if not isinstance(item, dict):
        return None
    ids = {"FLR": ("flrID", "activityID"), "CME": ("activityID",), "SEP": ("sepID", "activityID"),
           "GST": ("gstID", "activityID")}[kind]
    times = {"FLR": ("beginTime", "peakTime", "startTime"), "CME": ("startTime",),
             "SEP": ("eventTime", "startTime"), "GST": ("startTime",)}[kind]
    event_id, start = _first(item, *ids), _first(item, *times)
    if not isinstance(event_id, str) or not isinstance(start, str):
        return None

    detail_bits = []
    class_type = item.get("classType") if kind == "FLR" else None
    if isinstance(class_type, str) and class_type:
        detail_bits.append(f"Class {class_type}. {FLARE_CLASS_TEXT.get(class_type[0].upper(), '')}".strip())
    location = item.get("sourceLocation")
    if isinstance(location, str) and location:
        detail_bits.append(f"Seen at {location} on the Sun.")
    note = _tidy_note(item.get("note"))

    link = item.get("link")
    return {
        "id": event_id,
        "type": kind,
        "type_name": EVENT_TYPES[kind],
        "start_time": start,
        "headline": f"{EVENT_TYPES[kind]}" + (f" ({class_type})" if class_type else ""),
        "kid_text": KID_TEXT[kind],
        "detail": " ".join(detail_bits),
        "note": note,
        "link": link if isinstance(link, str) and link.startswith("https://") else DONKI_HOME,
    }


def normalize_list(kind: str, raw) -> tuple[list, int]:
    """Validate a whole response. Returns (events, skipped_count). Raises FetchError if it is not a list."""
    if not isinstance(raw, list):
        raise FetchError(f"{kind}: expected a list, got {type(raw).__name__}")
    events, skipped = [], 0
    for item in raw:
        event = normalize_event(kind, item)
        if event is None:
            skipped += 1
        else:
            events.append(event)
    return events, skipped


# ---------- fetching, caching, fallback ----------
def _cache_get(db: Session, key: str):
    return db.scalars(select(NasaCache).where(NasaCache.cache_key == key)).first()


def _cache_put(db: Session, key: str, payload: dict, url: str, now: datetime):
    row = _cache_get(db, key)
    if row is None:
        row = NasaCache(cache_key=key, payload=payload, source_url=url, retrieved_at=now)
        db.add(row)
    else:
        row.payload, row.source_url, row.retrieved_at = payload, url, now
    db.commit()


def _view(status, events, retrieved_at, source_url, window, message, failed=(), skipped=0):
    return {
        "status": status,
        "source": "NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)",
        "source_url": source_url,
        "retrieved_at": retrieved_at,
        "window": window,
        "events": events,
        "counts": {t: sum(1 for e in events if e["type"] == t) for t in EVENT_TYPES},
        "failed_types": list(failed),
        "skipped_items": skipped,
        "message": message,
        "disclaimer": DISCLAIMER,
    }


def get_space_weather(db: Session, days: int = 30, http_get=None, now: datetime | None = None) -> dict:
    """LIVE if NASA answers, else CACHED, else ARCHIVED. Never raises because of NASA."""
    http_get = http_get or _http_get
    now = now or datetime.now(timezone.utc)
    days = max(1, min(int(days), 90))
    start_date, end_date = (now - timedelta(days=days)).date().isoformat(), now.date().isoformat()
    window = {"start": start_date, "end": end_date}
    cache_key = f"donki:{days}"
    base = settings.donki_base_url.rstrip("/")

    events, failed, skipped = [], [], 0
    for kind in EVENT_TYPES:
        try:
            raw = http_get(f"{base}/{kind}", {"startDate": start_date, "endDate": end_date})
            found, bad = normalize_list(kind, raw)
        except FetchError:
            failed.append(kind)
            continue
        events.extend(found)
        skipped += bad

    if len(failed) < len(EVENT_TYPES):                      # at least one type answered: this is live data
        events.sort(key=lambda e: e["start_time"], reverse=True)
        events = events[:MAX_EVENTS]
        message = (f"NASA reported {len(events)} events in the last {days} days."
                   if events else f"NASA reported no events in the last {days} days. Quiet Sun!")
        if failed:
            message += f" Could not load: {', '.join(failed)}."
        retrieved = now.isoformat()
        view = _view("LIVE", events, retrieved, base, window, message, failed, skipped)
        if not failed:                                       # only cache complete answers
            _cache_put(db, cache_key, view, base, now)
        return view

    cached = _cache_get(db, cache_key)
    if cached is not None:
        view = dict(cached.payload)
        view.update(status="CACHED", retrieved_at=cached.retrieved_at.isoformat(),
                    message="Could not reach NASA, so this is the last answer we saved.")
        return view

    archived = [{**e, "type_name": EVENT_TYPES[e["type"]], "kid_text": KID_TEXT[e["type"]]} for e in ARCHIVE]
    return _view("ARCHIVED", archived, None, DONKI_HOME, None,
                 "Could not reach NASA and nothing was saved yet. Showing famous past events instead.",
                 failed=list(EVENT_TYPES))
