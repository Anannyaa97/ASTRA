"""Database tables from the project spec (section 15).

Resource values are normalized game units (0-100), NOT NASA measurements.
"""
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Player(Base):
    __tablename__ = "players"
    id: Mapped[int] = mapped_column(primary_key=True)
    nickname: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Mission(Base):
    __tablename__ = "missions"
    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"))
    difficulty: Mapped[str] = mapped_column(String(20), default="cadet")
    status: Mapped[str] = mapped_column(String(20), default="active")  # active | success | failed
    current_day: Mapped[int] = mapped_column(Integer, default=1)
    mission_type: Mapped[str] = mapped_column(String(40), default="lunar_south_pole")
    seed: Mapped[int] = mapped_column(Integer, default=0)  # for reproducible event order
    # How active the real Sun was when the mission began (sets the training storm's strength; see sun_service).
    sun_level: Mapped[str] = mapped_column(String(12), default="normal")
    sun_info: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class ResourceState(Base):
    """One snapshot per mission day."""
    __tablename__ = "resource_states"
    id: Mapped[int] = mapped_column(primary_key=True)
    mission_id: Mapped[int] = mapped_column(ForeignKey("missions.id"))
    day: Mapped[int] = mapped_column(Integer)
    power: Mapped[float] = mapped_column(Float)
    oxygen: Mapped[float] = mapped_column(Float)
    water: Mapped[float] = mapped_column(Float)
    food: Mapped[float] = mapped_column(Float)
    shielding: Mapped[float] = mapped_column(Float)
    crew_health: Mapped[float] = mapped_column(Float)


class MissionEvent(Base):
    __tablename__ = "mission_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_type: Mapped[str] = mapped_column(String(60))
    # REAL_NASA_OBSERVATION | NASA_INSPIRED_TRAINING | SIMULATED_ENGINEERING
    source: Mapped[str] = mapped_column(String(40))
    description: Mapped[str] = mapped_column(Text)
    event_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PlayerDecision(Base):
    __tablename__ = "player_decisions"
    id: Mapped[int] = mapped_column(primary_key=True)
    mission_id: Mapped[int] = mapped_column(ForeignKey("missions.id"))
    event_id: Mapped[str] = mapped_column(String(60))
    day: Mapped[int] = mapped_column(Integer)
    selected_option: Mapped[str] = mapped_column(String(60))
    effects: Mapped[dict] = mapped_column(JSON, default=dict)


class MissionReport(Base):
    __tablename__ = "mission_reports"
    id: Mapped[int] = mapped_column(primary_key=True)
    mission_id: Mapped[int] = mapped_column(ForeignKey("missions.id"))
    summary: Mapped[str] = mapped_column(Text)
    score: Mapped[float] = mapped_column(Float, default=0)
    learning_outcomes: Mapped[list] = mapped_column(JSON, default=list)


class NasaCache(Base):
    """Cached NASA API responses (used from Phase 4)."""
    __tablename__ = "nasa_cache"
    id: Mapped[int] = mapped_column(primary_key=True)
    cache_key: Mapped[str] = mapped_column(String(200), unique=True)
    payload: Mapped[dict] = mapped_column(JSON)
    source_url: Mapped[str] = mapped_column(String(500))
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
