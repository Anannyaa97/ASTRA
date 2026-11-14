"""ASTRA deterministic simulation engine (spec sections 10, 11, 14).

Pure Python: no database, no web framework. Same seed + same decisions = same result.
All values are normalized educational game units, not NASA measurements.

Typical use:
    sim = Simulation(seed=1)
    event = sim.current_event()            # None on quiet days
    sim.preview(event.id, "expand")        # what would happen? (does not change anything)
    sim.decide(event.id, "expand")         # apply the decision
    report = sim.advance_day()             # run the day, get a daily report
"""
import copy
from dataclasses import asdict, dataclass, field

from app.data.events import EVENT_LIBRARY
from app.services import formulas as F
from app.services.event_manager import RESOURCE_KEYS, SYSTEMS, build_schedule
from app.services.sim_config import SimConfig

# Values shown to the player / stored in snapshots
VALUE_KEYS = RESOURCE_KEYS + ("research", "comms")

RESOURCE_NAMES = {"power": "Power", "oxygen": "Oxygen", "water": "Water", "food": "Food"}

# One kid-friendly tip per resource, used in the report when a score is low.
LESSON_FOR = {"oxygen": "air"}  # resource name -> Academy lesson id (the others share their name)

RESOURCE_TIPS = {
    "power": "Save battery power before the dark days and keep the solar panels clean. "
             "When power is short, pause the least important jobs first.",
    "oxygen": "Keep the oxygen generator powered. It should be the very last system you ever cut.",
    "water": "Plants drink water. Give the water recycler enough power and efficiency before growing more food.",
    "food": "Plants grow slowly, so keep the greenhouse going before food runs low.",
}

HEALTH_REASON_TEXT = {
    "oxygen": "Oxygen was running low.",
    "water": "Water was running low.",
    "food": "Food was running low.",
    "power": "Not enough power for the oxygen or water systems.",
    "radiation": "The crew was exposed to simulated radiation risk.",
}


# ---------- errors ----------
class DecisionError(Exception):
    """Base class for anything wrong with a decision."""


class InvalidDecision(DecisionError):
    """Unknown event or option, or no event today."""


class DuplicateDecision(DecisionError):
    """A decision was already made today."""


class InsufficientResources(DecisionError):
    """The option needs more of a resource than the outpost has."""


class DecisionRequired(DecisionError):
    """Today's event must be answered before the day can advance."""


class MissionOver(DecisionError):
    """The mission has already ended."""


# ---------- state ----------
@dataclass
class SimState:
    day: int = 1
    power: float = 60.0
    oxygen: float = 70.0
    water: float = 50.0
    food: float = 60.0
    shielding: float = 50.0
    crew_health: float = 100.0
    battery: float = 60.0
    research: float = 0.0
    comms: float = 100.0
    greenhouse_level: int = 1
    greenhouse_maturity: float = 1.0       # plants catch up to the level gradually (delayed effect)
    research_level: int = 1
    shelter_days_left: int = 0
    efficiency: dict = field(default_factory=lambda: {name: 1.0 for name in SYSTEMS})
    sunlight_mods: list = field(default_factory=list)   # [{"factor", "days_left"}]
    hazards: list = field(default_factory=list)         # [{"severity", "days_left"}]
    pending: list = field(default_factory=list)         # delayed effects waiting for their day
    status: str = "active"                              # active | success | failed
    failure: dict = None


class Simulation:
    def __init__(self, config=None, events=None, seed=0, schedule=None):
        self.config = config or SimConfig()
        self.events = {e.id: e for e in (events if events is not None else EVENT_LIBRARY)}
        self.seed = seed
        self.schedule = dict(schedule) if schedule is not None else build_schedule(
            list(self.events.values()), seed, self.config.mission_days)
        self.state = SimState()
        self.decisions = []        # decision history
        self.history = []          # one snapshot per day (day 0 = starting state)
        self._decided_today = False
        self._activated_day = 0
        self._day_notes = []
        self.history.append(self._snapshot(0, None))
        self._begin_day()

    # ---------- reading ----------
    def current_event(self):
        if self.state.status != "active":
            return None
        event_id = self.schedule.get(self.state.day)
        return self.events[event_id] if event_id else None

    def values(self) -> dict:
        s = self.state
        return {k: round(getattr(s, k), 2) for k in VALUE_KEYS}

    def public_state(self) -> dict:
        """Everything the frontend needs to draw the dashboard."""
        s = self.state
        return {
            "day": s.day,
            "mission_days": self.config.mission_days,
            "status": s.status,
            "values": self.values(),
            "research_goal": self.config.research_goal,
            "greenhouse_level": s.greenhouse_level,
            "research_level": s.research_level,
            "sheltering": s.shelter_days_left > 0,
            "efficiency": dict(s.efficiency),
            "active_conditions": {
                "low_sunlight": bool(s.sunlight_mods),
                "radiation_hazard": bool(s.hazards),
            },
            "decided_today": self._decided_today,
            "failure": s.failure,
        }

    def clone(self) -> "Simulation":
        """An independent copy. Used by previews and the What If? Lab so the real mission is never touched."""
        return copy.deepcopy(self)

    # ---------- decisions ----------
    def decide(self, event_id: str, option_id: str) -> dict:
        s = self.state
        if s.status != "active":
            raise MissionOver("The mission has ended.")
        event = self.current_event()
        if event is None or event.id != event_id:
            raise InvalidDecision(f"'{event_id}' is not today's event.")
        if self._decided_today:
            raise DuplicateDecision("A decision was already made today.")
        try:
            option = event.option(option_id)
        except KeyError:
            raise InvalidDecision(f"'{option_id}' is not an option for {event_id}.") from None
        for key, minimum in option.requires.items():
            if getattr(s, key) < minimum:
                raise InsufficientResources(
                    f"'{option.label}' needs {key} of at least {minimum}, but you have {round(getattr(s, key), 1)}.")

        before = self.values()
        levels_before = (s.greenhouse_level, s.research_level)

        self._apply_deltas(option.immediate)
        self._apply_levels(option.level_changes)
        self._apply_efficiency(option.efficiency)
        if option.shelter_days:
            s.shelter_days_left = max(s.shelter_days_left, option.shelter_days)
        for delayed in option.delayed:
            s.pending.append({
                "due_day": s.day + delayed.after_days,
                "deltas": dict(delayed.deltas),
                "efficiency": dict(delayed.efficiency),
                "level_changes": dict(delayed.level_changes),
                "note": delayed.note,
            })
        self._decided_today = True

        after = self.values()
        record = {
            "day": s.day,
            "event_id": event.id,
            "option_id": option.id,
            "label": option.label,
            "touches": list(option.touches),
            # every system this event was about, so "do nothing" choices can still be investigated
            "event_systems": sorted({s for o in event.options for s in o.touches}),
            "event_is_problem": bool(event.start_efficiency or event.start_deltas
                                     or event.hazard_days or event.sunlight_days),
            "effects": {
                "resources": {k: round(after[k] - before[k], 2) for k in after if abs(after[k] - before[k]) > 1e-9},
                "settings": {
                    "greenhouse_level": s.greenhouse_level - levels_before[0],
                    "research_level": s.research_level - levels_before[1],
                    "shelter_days": option.shelter_days,
                },
                "delayed": [d.note for d in option.delayed],
            },
        }
        self.decisions.append(record)
        return record

    # ---------- preview (same rules as the real thing) ----------
    def preview(self, event_id: str, option_id: str, horizon: int = 3) -> dict:
        """Predict an option by running the REAL engine on a copy.

        Compares the copy against another copy where the player does nothing.
        Assumes no further events happen during the horizon.
        """
        start = self.values()
        chosen = self.clone()
        chosen.decide(event_id, option_id)  # raises the same errors a real decision would
        baseline = self.clone()
        baseline._decided_today = True
        for sim in (chosen, baseline):
            sim.schedule = {}
        forecast = []
        for _ in range(horizon):
            for sim in (chosen, baseline):
                if sim.state.status == "active":
                    sim.advance_day()
            forecast.append(chosen.history[-1]["values"])
        change = {k: round(chosen.values()[k] - baseline.values()[k], 2) for k in VALUE_KEYS}
        direction = {k: ("up" if v > 0.5 else "down" if v < -0.5 else "same") for k, v in change.items()}

        # Effects that arrive later (possibly after the forecast window) so a slow benefit is not missed.
        option = self.events[event_id].option(option_id)
        later = [{"after_days": d.after_days, "note": d.note} for d in option.delayed if d.note]

        # What keeps happening even if the player does nothing (per day, from the same engine run).
        days_run = len(baseline.history) - len(self.history)
        trend_if_nothing = {}
        if days_run > 0:
            end = baseline.values()
            trend_if_nothing = {k: round((end[k] - start[k]) / days_run, 1)
                                for k in ("power", "oxygen", "water", "food")}
        return {
            "event_id": event_id,
            "option_id": option_id,
            "horizon_days": horizon,
            "start": start,
            "forecast": forecast,
            "change_vs_no_action": change,
            "direction": direction,
            "later": later,
            "trend_if_nothing": trend_if_nothing,
            "assumes": "No other events happen during these days. This is a simulated prediction.",
        }

    # ---------- advancing ----------
    def advance_day(self) -> dict:
        s = self.state
        if s.status != "active":
            raise MissionOver("The mission has ended.")
        if self.current_event() is not None and not self._decided_today:
            raise DecisionRequired("Make a decision for today's event first.")
        return self._run_day()

    def _begin_day(self):
        """Start of a day: delayed effects arrive and today's event conditions switch on."""
        s = self.state
        still_waiting = []
        for item in s.pending:
            if item["due_day"] <= s.day:
                self._apply_deltas(item["deltas"])
                self._apply_efficiency(item["efficiency"])
                self._apply_levels(item["level_changes"])
                if item["note"]:
                    self._day_notes.append(item["note"])
            else:
                still_waiting.append(item)
        s.pending = still_waiting

        event = self.current_event()
        if event is not None and self._activated_day != s.day:
            self._activated_day = s.day
            if event.sunlight_days > 0:
                s.sunlight_mods.append({"factor": event.sunlight_factor, "days_left": event.sunlight_days})
            if event.hazard_days > 0:
                s.hazards.append({"severity": event.hazard_severity, "days_left": event.hazard_days})
            self._apply_efficiency(event.start_efficiency)
            self._apply_deltas(event.start_deltas)
        self._decided_today = False

    def _run_day(self) -> dict:
        cfg, s = self.config, self.state
        yesterday = dict(self.history[-1]["values"])  # where each dial stood at the end of the last day
        sheltered = s.shelter_days_left > 0

        # --- power ---
        sunlight = 1.0
        for mod in s.sunlight_mods:
            sunlight *= mod["factor"]
        generated = F.power_generation(cfg.g_max, sunlight, s.efficiency["solar"])

        gh_level = 0 if sheltered else s.greenhouse_level
        rs_level = 0 if sheltered else s.research_level
        # Priority order: if power runs short, the last systems lose power first.
        demands = (
            ("oxygen", cfg.oxygen_gen_power),
            ("water", cfg.water_recycler_power),
            ("comms", cfg.comms_power),
            ("greenhouse", cfg.greenhouse_power_per_level * gh_level),
            ("research", cfg.research_power_per_level * rs_level),
        )
        available = s.power + generated
        run, consumed = {}, 0.0
        for name, demand in demands:
            if demand <= 0:
                run[name] = 0.0
                continue
            used = min(demand, available)
            run[name] = used / demand       # 1.0 = fully powered, 0.0 = off
            available -= used
            consumed += used
        new_power = F.next_power(s.power, generated, consumed)

        # --- oxygen, water, food, research ---
        oxygen_made = cfg.oxygen_gen_output * s.efficiency["oxygen"] * run["oxygen"]
        oxygen_used = cfg.oxygen_use_per_crew * cfg.crew_size
        water_made = cfg.water_recycler_output * s.efficiency["water"] * run["water"]
        water_used = cfg.water_base_use + cfg.water_per_greenhouse * gh_level * run["greenhouse"]
        food_made = (cfg.greenhouse_food_per_level * s.greenhouse_maturity
                     * s.efficiency["greenhouse"] * run["greenhouse"])
        # Research needs the link to Earth to send data home: a weak link slows it (full speed at 100).
        comms_factor = 0.5 + 0.5 * s.comms / 100.0
        research_made = (cfg.research_per_level * rs_level * s.efficiency["research"]
                         * run["research"] * comms_factor)

        new_oxygen = F.next_oxygen(s.oxygen, oxygen_made, oxygen_used)
        new_water = F.next_water(s.water, water_made, water_used)
        new_food = F.next_food(s.food, food_made, cfg.food_use)
        new_research = F.next_research(s.research, research_made)

        # plants slowly catch up with the greenhouse level (delayed effect)
        if not sheltered:
            s.greenhouse_maturity += (s.greenhouse_level - s.greenhouse_maturity) * cfg.greenhouse_ramp

        # --- simulated radiation risk ---
        severity = max((h["severity"] for h in s.hazards), default=0.0)
        exposure = cfg.shelter_exposure if sheltered else 1.0
        risk = F.radiation_risk(severity, exposure, s.shielding / 100.0) if severity > 0 else 0.0

        # --- crew health ---
        losses = {}
        if new_oxygen < cfg.oxygen_low:
            losses["oxygen"] = cfg.loss_oxygen
        if new_water < cfg.water_low:
            losses["water"] = cfg.loss_water
        if new_food < cfg.food_low:
            losses["food"] = cfg.loss_food
        if run["oxygen"] < 1.0 or run["water"] < 1.0:
            losses["power"] = cfg.loss_underpowered
        if risk > 0:
            losses["radiation"] = risk * cfg.radiation_health_factor
        total_loss = sum(losses.values())
        recovery = 0.0 if losses else cfg.health_recovery
        new_health = F.next_health(s.crew_health, total_loss, recovery)

        # --- commit ---
        s.power, s.oxygen, s.water, s.food = new_power, new_oxygen, new_water, new_food
        s.research, s.crew_health = new_research, new_health
        s.comms = F.clamp(100.0 * run["comms"] * s.efficiency["comms"])
        for key in ("power", "oxygen", "water", "food", "research", "crew_health", "comms", "greenhouse_maturity"):
            setattr(s, key, round(getattr(s, key), 4))

        # --- countdowns ---
        for mod in s.sunlight_mods:
            mod["days_left"] -= 1
        s.sunlight_mods = [m for m in s.sunlight_mods if m["days_left"] > 0]
        for hazard in s.hazards:
            hazard["days_left"] -= 1
        s.hazards = [h for h in s.hazards if h["days_left"] > 0]
        s.shelter_days_left = max(0, s.shelter_days_left - 1)

        # --- end of mission checks ---
        day_run = s.day
        if s.oxygen <= 0:
            self._fail(day_run, "oxygen", "The oxygen ran out.", losses)
        elif s.water <= 0:
            self._fail(day_run, "water", "The water ran out.", losses)
        elif s.crew_health <= 0:
            worst = max(losses, key=losses.get) if losses else "crew_health"
            self._fail(day_run, "crew_health", "The crew's health reached zero.", losses, worst)
        elif day_run >= cfg.mission_days:
            s.status = "success"

        notes = list(self._day_notes)
        for reason in losses:
            if reason == "radiation" and sheltered:
                notes.append("The crew sheltered, so the simulated radiation risk stayed low.")
            else:
                notes.append(HEALTH_REASON_TEXT[reason])
        self._day_notes = []

        flows = {
            "sunlight": round(sunlight, 3), "power_generated": round(generated, 2),
            "power_consumed": round(consumed, 2), "oxygen_made": round(oxygen_made, 2),
            "oxygen_used": round(oxygen_used, 2), "water_recycled": round(water_made, 2),
            "water_used": round(water_used, 2), "food_made": round(food_made, 2),
            "food_used": round(cfg.food_use, 2), "research_made": round(research_made, 2),
            "radiation_risk": round(risk, 3), "health_loss": round(total_loss, 2),
            "health_loss_reasons": sorted(losses), "sheltering": sheltered,
        }
        snapshot = self._snapshot(day_run, flows)
        self.history.append(snapshot)

        if s.status == "active":
            s.day += 1
            self._begin_day()

        after = self.values() if s.status == "active" else snapshot["values"]
        return {
            "day": day_run,
            "status": s.status,
            "flows": flows,
            # Compare with where the dial stood at the END of the last day, so the player's own
            # decision (for example a repair that costs power) shows up in the change too.
            "deltas": {k: round(snapshot["values"][k] - yesterday[k], 2) for k in VALUE_KEYS},
            "notes": notes,
            "values": after,
            "failure": s.failure,
        }

    # ---------- helpers ----------
    def _apply_deltas(self, deltas: dict):
        for key, amount in deltas.items():
            setattr(self.state, key, F.clamp(getattr(self.state, key) + amount))

    def _apply_levels(self, changes: dict):
        s, cfg = self.state, self.config
        if "greenhouse_level" in changes:
            s.greenhouse_level = int(F.clamp(s.greenhouse_level + changes["greenhouse_level"],
                                             0, cfg.max_greenhouse_level))
        if "research_level" in changes:
            s.research_level = int(F.clamp(s.research_level + changes["research_level"],
                                           0, cfg.max_research_level))

    def _apply_efficiency(self, changes: dict):
        for name, amount in changes.items():
            s = self.state
            s.efficiency[name] = round(F.clamp(s.efficiency[name] + amount, 0.0, self.config.max_efficiency), 4)

    def _snapshot(self, day: int, flows):
        return {"day": day, "values": self.values(), "flows": flows}

    def _fail(self, day, resource, text, losses, detail=None):
        self.state.status = "failed"
        self.state.failure = {
            "day": day, "resource": resource, "text": text,
            "health_loss_reasons": sorted(losses), "worst_reason": detail,
        }

    # ---------- evaluation ----------
    def evaluate(self) -> dict:
        """Multi-factor evaluation (not a single score). Each category is 0-100, or None if not tested yet."""
        days = [h for h in self.history if h["flows"] is not None]
        if not days:
            return {"scores": {}, "overall": None}
        cfg = self.config

        crew_safety = sum(h["values"]["crew_health"] for h in days) / len(days)
        # Share of days when oxygen, water, food and power all stayed out of the red zone (40 or more).
        safe_days = sum(1 for h in days if min(h["values"][k] for k in ("power", "oxygen", "water", "food")) >= 40)
        resource_mgmt = 100.0 * safe_days / len(days)
        research = min(100.0, 100.0 * self.state.research / cfg.research_goal)

        hazard_days = [h for h in days if h["flows"]["radiation_risk"] > 0]
        emergency = None
        if hazard_days:
            lost = sum(h["flows"]["health_loss"] for h in hazard_days)
            emergency = F.clamp(100.0 - 3.0 * lost)

        # Sustainability = could the outpost keep going? Half is "steady" (are the supplies still
        # falling at the end?), half is "stocked" (is the lowest supply comfortably full?).
        recent = self.history[-6:]
        shrink = 0.0
        if len(recent) >= 2:
            span = len(recent) - 1
            for key in ("power", "oxygen", "water", "food"):
                trend = (recent[-1]["values"][key] - recent[0]["values"][key]) / span
                shrink += max(0.0, -trend)
        steady = F.clamp(100.0 - 5.0 * shrink)
        lowest_now = min(self.history[-1]["values"][k] for k in ("power", "oxygen", "water", "food"))
        stocked = F.clamp(100.0 * lowest_now / 35.0)
        sustainability = 0.5 * steady + 0.5 * stocked

        scores = {
            "crew_safety": round(crew_safety, 1),
            "resource_management": round(resource_mgmt, 1),
            "research_progress": round(research, 1),
            "emergency_response": None if emergency is None else round(emergency, 1),
            "sustainability": round(sustainability, 1),
        }
        tested = [v for v in scores.values() if v is not None]
        return {"scores": scores, "overall": round(sum(tested) / len(tested), 1)}

    def explain_scores(self, below: float = 70.0) -> list:
        """For every category scoring under `below`, say WHY (from the real history) and give one tip.

        Returns a list of {"category", "score", "why", "tip"}, weakest first.
        """
        scores = self.evaluate()["scores"]
        days = [h for h in self.history if h["flows"] is not None]
        if not days:
            return []
        keys = ("power", "oxygen", "water", "food")
        insights = []

        def add(category, why, tip, topic):
            # topic = id of the Academy lesson that explains this (see frontend/src/data/lessons.js)
            insights.append({"category": category, "score": scores[category], "why": why, "tip": tip,
                             "topic": LESSON_FOR.get(topic, topic)})

        def weak(category):
            return scores.get(category) is not None and scores[category] < below

        if weak("resource_management"):
            # The score is the average of each day's weakest resource, so find which resource was weakest most often.
            weakest_each_day = [min(keys, key=lambda k: h["values"][k]) for h in days]
            key = max(keys, key=lambda k: weakest_each_day.count(k))
            count = weakest_each_day.count(key)
            day, value = min(((h["day"], h["values"][key]) for h in days), key=lambda item: item[1])
            why = (f"{RESOURCE_NAMES[key]} was your lowest resource on {count} of {len(days)} days "
                   f"(as low as {value:g} on day {day}).")
            add("resource_management", why, RESOURCE_TIPS[key], key)

        if weak("sustainability"):
            recent = self.history[-6:]
            span = len(recent) - 1
            trends = {k: (recent[-1]["values"][k] - recent[0]["values"][k]) / span for k in keys}
            worst = min(trends, key=trends.get)
            lows = {k: self.history[-1]["values"][k] for k in keys}
            lowest = min(lows, key=lows.get)
            if trends[worst] >= 0 and lows[lowest] < 35:
                add("sustainability",
                    f"At the end, {RESOURCE_NAMES[lowest]} was down at {lows[lowest]:g}, so the outpost had "
                    "very little spare supply to keep going.",
                    RESOURCE_TIPS[lowest], lowest)
            if trends[worst] < 0:
                add("sustainability",
                    f"At the end, {RESOURCE_NAMES[worst]} was still falling by about {abs(trends[worst]):.1f} a day, "
                    "so the outpost could not keep going for long.",
                    RESOURCE_TIPS[worst], worst)

        if weak("crew_safety"):
            day, value = min(((h["day"], h["values"]["crew_health"]) for h in days), key=lambda item: item[1])
            reasons = sorted({r for h in days for r in h["flows"]["health_loss_reasons"]})
            why = f"Crew health fell to {value:g} on day {day}."
            if reasons:
                why += " " + " ".join(HEALTH_REASON_TEXT.get(r, r) for r in reasons)
            tip = RESOURCE_TIPS.get(reasons[0]) if reasons and reasons[0] in RESOURCE_TIPS else \
                "Protect the crew first: shelter and shielding matter more than science during danger."
            add("crew_safety", why, tip, reasons[0] if reasons else "radiation")

        if weak("research_progress"):
            add("research_progress",
                f"Research reached {self.state.research:g} of {self.config.research_goal:g} points.",
                "Keep the science team powered and avoid pausing it for long. Even a small daily gain adds up.",
                "power")

        if weak("emergency_response"):
            lost = sum(h["flows"]["health_loss"] for h in days if h["flows"]["radiation_risk"] > 0)
            add("emergency_response",
                f"During the radiation storm the crew lost about {lost:g} health points.",
                "Improve shielding before a storm and move the crew to the shelter when it arrives. "
                "Sheltering protects the most.",
                "radiation")

        return sorted(insights, key=lambda item: item["score"])

    # ---------- failure investigation ----------
    def investigate(self):
        """Explain a failed mission from the real history. Returns None if the mission has not failed."""
        failure = self.state.failure
        if failure is None:
            return None

        resource = failure["resource"]
        related = {"oxygen": {"oxygen"}, "water": {"water"}}.get(resource)
        if related is None:  # crew health: look at what hurt the crew
            related = set()
            for reason in failure["health_loss_reasons"]:
                related |= {
                    "radiation": {"shielding", "shelter"},
                    "food": {"greenhouse", "food"},
                    "oxygen": {"oxygen"},
                    "water": {"water"},
                    "power": {"power", "battery"},
                }[reason]

        series = [h["values"][resource] for h in self.history]
        i = len(series) - 1
        while i > 0 and series[i] <= series[i - 1]:
            i -= 1
        # i is the last day before the final run of drops, so the decline starts the day after
        decline_start = self.history[min(i + 1, len(series) - 1)]["day"]

        relevant = [
            d for d in self.decisions
            if related & set(d["touches"]) or (d["event_is_problem"] and related & set(d["event_systems"]))
        ]
        chain = []
        for d in relevant:
            changes = ", ".join(f"{k} {v:+g}" for k, v in d["effects"]["resources"].items())
            levels = ", ".join(f"{k} {v:+d}" for k, v in d["effects"]["settings"].items()
                               if k != "shelter_days" and v)
            parts = [p for p in (changes, levels) if p]
            if parts:
                chain.append(f"Day {d['day']}: you chose '{d['label']}' ({'; '.join(parts)}).")
            else:
                chain.append(f"Day {d['day']}: you chose '{d['label']}'. Nothing was changed, so the problem stayed.")

        tips = {
            "oxygen": "Keep enough power for the oxygen generator. It should be the last system you ever cut.",
            "water": "Watch water use. Every greenhouse level uses more water, so give the water recycler enough power and efficiency first.",
            "crew_health": "When the crew is in danger, protect them first. Shelter, shielding and basic supplies matter more than science.",
        }
        science = {
            "oxygen": "Astronauts breathe oxygen all the time, so life support must always have power. (ASTRA uses simplified game units.)",
            "water": "Space stations recycle water because carrying it from Earth is very expensive. Recyclers need power to work.",
            "crew_health": "Radiation, thin air, thirst and hunger all harm people. Engineers plan protection for every one of them.",
        }
        return {
            "primary_cause": failure["text"],
            "resource": resource,
            "failure_day": failure["day"],
            "decline_started_day": decline_start,
            "relevant_decisions": chain,
            "resource_history": [{"day": h["day"], resource: h["values"][resource]} for h in self.history],
            "health_loss_reasons": failure["health_loss_reasons"],
            "how_to_avoid": tips[resource if resource in tips else "crew_health"],
            "science_note": science[resource if resource in science else "crew_health"],
            "note": "Simulated training outcome. Values are game units, not real NASA measurements.",
        }

    # ---------- export ----------
    def export(self) -> dict:
        return {
            "seed": self.seed,
            "schedule": self.schedule,
            "state": asdict(self.state),
            "decisions": self.decisions,
            "history": self.history,
        }


def replay(decisions: list, seed: int = 0, days: int = None, config=None, events=None, schedule=None) -> "Simulation":
    """Rebuild a mission from its seed and decision list. Proves the engine is deterministic.

    `decisions` is a list of dicts with day, event_id and option_id (the format Simulation.decisions uses).
    """
    sim = Simulation(config=config, events=events, seed=seed, schedule=schedule)
    by_day = {d["day"]: d for d in decisions}
    target = days if days is not None else max((d["day"] for d in decisions), default=0)
    while sim.state.status == "active" and sim.state.day <= target:
        event = sim.current_event()
        if event is not None:
            choice = by_day.get(sim.state.day)
            if choice is None:
                raise DecisionRequired(f"No recorded decision for day {sim.state.day}.")
            sim.decide(choice["event_id"], choice["option_id"])
        sim.advance_day()
    return sim
