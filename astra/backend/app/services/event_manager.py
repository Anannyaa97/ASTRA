"""Event structure, validation and the seeded event schedule (spec sections 13, 25).

Events are plain data. The simulation engine decides what the numbers do.
"""
import random
from dataclasses import dataclass, field

# Source classification: never present one category as another.
SOURCE_REAL = "REAL_NASA_OBSERVATION"
SOURCE_INSPIRED = "NASA_INSPIRED_TRAINING"
SOURCE_SIMULATED = "SIMULATED_ENGINEERING"
VALID_SOURCES = (SOURCE_REAL, SOURCE_INSPIRED, SOURCE_SIMULATED)

RESOURCE_KEYS = ("power", "oxygen", "water", "food", "shielding", "crew_health", "battery")
SYSTEMS = ("solar", "oxygen", "water", "greenhouse", "comms", "research")
LEVEL_KEYS = ("greenhouse_level", "research_level")
DELTA_KEYS = RESOURCE_KEYS + ("research",)   # things an option or event may add or remove

# The five mission stages (spec section 12) and which mission days get an event.
STAGES = {
    1: {"name": "Arrival on the Moon", "goal": "Switch on the habitat and learn the controls."},
    2: {"name": "Establishing Survival", "goal": "Keep oxygen, water and food steady."},
    3: {"name": "The Solar Storm", "goal": "Protect the crew from simulated radiation risk."},
    4: {"name": "The Power Crisis", "goal": "Share limited power between the most important systems."},
    5: {"name": "Sustainable Outpost", "goal": "Finish your research and keep the outpost steady."},
}
STAGE_DAYS = {1: (1, 2), 2: (3, 7), 3: (8, 11), 4: (12, 17), 5: (18, 99)}
STAGE_EVENT_DAYS = {1: [2], 2: [4, 6], 3: [8, 10], 4: [12, 14, 16], 5: [18]}


def stage_for_day(day: int) -> int:
    for stage, (first, last) in STAGE_DAYS.items():
        if first <= day <= last:
            return stage
    return 5


@dataclass(frozen=True)
class Delayed:
    """An effect that happens `after_days` days after the decision."""
    after_days: int
    deltas: dict = field(default_factory=dict)         # resource changes
    efficiency: dict = field(default_factory=dict)     # system efficiency changes
    level_changes: dict = field(default_factory=dict)  # greenhouse_level / research_level changes
    note: str = ""                                     # kid-friendly sentence shown when it happens


@dataclass(frozen=True)
class Option:
    id: str
    label: str
    description: str
    touches: tuple = ()                                # systems this choice affects (used by investigations)
    immediate: dict = field(default_factory=dict)      # resource deltas applied right away
    level_changes: dict = field(default_factory=dict)
    efficiency: dict = field(default_factory=dict)
    shelter_days: int = 0                              # crew shelters for this many days
    requires: dict = field(default_factory=dict)       # minimum resource values to pick this option
    delayed: tuple = ()


@dataclass(frozen=True)
class Event:
    id: str
    title: str
    description: str
    category: str                                      # power, life_support, food, radiation, science...
    source: str                                        # one of VALID_SOURCES
    difficulty: int                                    # 1 (easy) .. 3 (hard)
    stage: int                                         # mission stage 1..5
    options: tuple
    learning: str                                      # the engineering idea this teaches
    sunlight_factor: float = 1.0                       # environment while the event lasts
    sunlight_days: int = 0
    hazard_severity: float = 0.0                       # simulated event severity 0..1
    hazard_days: int = 0
    start_efficiency: dict = field(default_factory=dict)  # equipment damage when the event begins
    start_deltas: dict = field(default_factory=dict)      # resource changes when the event begins
    commander_only: bool = False                       # bonus problem that only appears on the Commander level

    def option(self, option_id: str) -> Option:
        for opt in self.options:
            if opt.id == option_id:
                return opt
        raise KeyError(option_id)


def validate_event(event: Event) -> None:
    """Raise ValueError if an event is badly formed. Run on the whole library at import time."""
    if event.source not in VALID_SOURCES:
        raise ValueError(f"{event.id}: unknown source {event.source}")
    if len(event.options) < 2:
        raise ValueError(f"{event.id}: needs at least 2 options")
    ids = [o.id for o in event.options]
    if len(set(ids)) != len(ids):
        raise ValueError(f"{event.id}: duplicate option ids")
    if not 1 <= event.stage <= 5 or not 1 <= event.difficulty <= 3:
        raise ValueError(f"{event.id}: stage must be 1-5 and difficulty 1-3")
    for key in event.start_deltas:
        if key not in DELTA_KEYS:
            raise ValueError(f"{event.id}: unknown resource {key}")
    for key in event.start_efficiency:
        if key not in SYSTEMS:
            raise ValueError(f"{event.id}: unknown system {key}")
    for opt in event.options:
        for key in list(opt.immediate) + list(opt.requires):
            if key not in DELTA_KEYS:
                raise ValueError(f"{event.id}/{opt.id}: unknown resource {key}")
        for key in opt.level_changes:
            if key not in LEVEL_KEYS:
                raise ValueError(f"{event.id}/{opt.id}: unknown level {key}")
        for key in opt.efficiency:
            if key not in SYSTEMS:
                raise ValueError(f"{event.id}/{opt.id}: unknown system {key}")
        for d in opt.delayed:
            if d.after_days < 1:
                raise ValueError(f"{event.id}/{opt.id}: delayed effects need after_days >= 1")


def build_schedule(events: list, seed: int, mission_days: int, bonus_days: tuple = ()) -> dict:
    """Map mission day -> event id, stage by stage. The same seed always gives the same schedule.

    Each stage has a few event days. Events for a stage are shuffled with the seed, so every
    seed plays a little differently, but the story still goes Arrival -> Survival -> Storm -> Crisis -> Outpost.
    """
    rng = random.Random(seed)
    schedule = {}
    for stage in sorted(STAGE_EVENT_DAYS):
        pool = sorted(e.id for e in events if e.stage == stage and not e.commander_only)  # sorted: never depends on list order
        rng.shuffle(pool)
        for day, event_id in zip(STAGE_EVENT_DAYS[stage], pool):
            if day < mission_days:
                schedule[day] = event_id
    # Commander bonus problems use their OWN random stream, so the normal schedule is never changed.
    bonus = sorted(e.id for e in events if e.commander_only)
    random.Random(f"bonus:{seed}").shuffle(bonus)
    for day, event_id in zip(sorted(bonus_days), bonus):
        if day < mission_days and day not in schedule:
            schedule[day] = event_id
    return schedule
