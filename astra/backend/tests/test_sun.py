from datetime import datetime, timezone

from sqlalchemy import create_engine, inspect, text

from app.core.database import ensure_columns
from app.services import mission_service as svc
from app.services import nasa_service as ns
from app.services import sun_service as sun
from app.services.simulation_engine import Simulation
import pytest
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base


class _Client:
    """A throw-away in-memory database that leaves sun_service.current_sun untouched (the API tests fake it)."""
    def __init__(self):
        engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(engine)
        self.Session = sessionmaker(bind=engine, autoflush=False)


@pytest.fixture()
def client():
    return _Client()

NOW = datetime(2026, 11, 7, 12, 0, tzinfo=timezone.utc)


def feed(flares=0, storms=0, particles=0, cmes=0, strong="M2.0"):
    def get(url, params):
        kind = url.rsplit("/", 1)[1]
        n = {"FLR": flares, "GST": storms, "SEP": particles, "CME": cmes}[kind]
        key = {"FLR": "flrID", "GST": "gstID", "SEP": "sepID", "CME": "activityID"}[kind]
        when = {"FLR": "beginTime", "GST": "startTime", "SEP": "eventTime", "CME": "startTime"}[kind]
        return [{key: f"{kind}-{i}", when: "2026-11-01T01:00Z", **({"classType": strong} if kind == "FLR" else {})}
                for i in range(n)]
    return get


def test_sun_level_follows_real_activity(client):
    with client.Session() as db:
        assert sun.current_sun(db, http_get=feed(), now=NOW)["level"] == "quiet"
        assert sun.current_sun(db, http_get=feed(flares=10), now=NOW)["level"] == "normal"
        busy = sun.current_sun(db, http_get=feed(flares=20, storms=3, particles=2), now=NOW)
    assert busy["level"] == "stormy" and busy["points"] == 20 + 6 + 6 and busy["status"] == "LIVE"
    assert busy["counts"]["strong_flares"] == 20 and busy["scale"] == 1.2


def test_weak_flares_do_not_count_as_strong(client):
    with client.Session() as db:
        calm = sun.current_sun(db, http_get=feed(flares=40, strong="C3.0"), now=NOW)
    assert calm["counts"]["strong_flares"] == 0 and calm["level"] == "quiet"


def test_no_nasa_data_means_standard_strength_and_says_so(client):
    def down(url, params):
        raise ns.FetchError("down")
    with client.Session() as db:
        info = sun.current_sun(db, http_get=down, now=NOW)
    assert info["level"] == "normal" and info["scale"] == 1.0 and info["status"] == "ARCHIVED"
    assert "not available" in info["message"]


def storm_risk(scale):
    sim = Simulation(config=svc.config_for("cadet", {"quiet": "quiet", "normal": "normal", "stormy": "stormy"}[scale]), seed=1)
    while sim.state.status == "active" and not any(h["severity"] for h in sim.state.hazards):
        event = sim.current_event()
        if event:
            sim.decide(event.id, event.options[-1].id)
        sim.advance_day()
    return max(h["severity"] for h in sim.state.hazards)


def test_a_busier_sun_makes_the_training_storm_stronger_and_a_quiet_sun_weaker():
    assert storm_risk("quiet") < storm_risk("normal") < storm_risk("stormy") <= 1.0


def test_same_sun_level_gives_identical_replays():
    def run():
        sim = Simulation(config=svc.config_for("cadet", "stormy"), seed=5)
        while sim.state.status == "active":
            e = sim.current_event()
            if e:
                sim.decide(e.id, e.options[0].id)
            sim.advance_day()
        return sim.export()
    assert run() == run()


def test_mission_saves_its_sun_and_restart_keeps_it(client):
    info = sun.standard("saved")
    info.update(level="stormy", scale=1.2, status="LIVE")
    with client.Session() as db:
        mission = svc.start_mission(db, "Tester", "cadet", seed=3, sun=info)
        assert mission.sun_level == "stormy"
        again = svc.restart(db, mission)
        assert again.sun_level == "stormy" and again.sun_info["status"] == "LIVE"
        _, sim = svc.load(db, again.id)
        assert sim.config.storm_scale == 1.2
        assert svc.mission_view(db, again, sim)["sun"]["level"] == "stormy"


def test_old_databases_get_the_new_columns():
    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE missions (id INTEGER PRIMARY KEY, difficulty VARCHAR(20))"))
        conn.execute(text("INSERT INTO missions (id, difficulty) VALUES (1, 'cadet')"))
    ensure_columns(engine)
    ensure_columns(engine)                      # safe to run twice
    assert {"sun_level", "sun_info"} <= {c["name"] for c in inspect(engine).get_columns("missions")}
    with engine.begin() as conn:
        assert conn.execute(text("SELECT sun_level FROM missions WHERE id = 1")).scalar() == "normal"
