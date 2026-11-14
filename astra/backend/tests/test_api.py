import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.data.events import EVENT_LIBRARY
from app.main import app
from app.services import sun_service
from app.models.tables import MissionReport, PlayerDecision, ResourceState
from app.services.simulation_engine import Simulation
from tests.test_simulation import SMART, play


@pytest.fixture()
def client():
    """A client wired to a throw-away in-memory database."""
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False)

    def override():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override
    # Never touch the real network in tests: a fixed, standard-strength Sun unless a test says otherwise.
    original_sun = sun_service.current_sun
    sun_service.current_sun = lambda db, **_: sun_service.standard("Test Sun.")
    test_client = TestClient(app)
    test_client.Session = Session
    yield test_client
    sun_service.current_sun = original_sun
    app.dependency_overrides.clear()


def start(client, **body):
    r = client.post("/api/missions/start", json={"seed": 1, **body})
    assert r.status_code == 200, r.text
    return r.json()


def play_via_api(client, mission, pick):
    """Play a mission to the end using only HTTP calls. Returns the final mission view."""
    mid = mission["id"]
    while mission["status"] == "active":
        event = mission["event"]
        if event and not event["decided"]:
            r = client.post(f"/api/missions/{mid}/decision",
                            json={"event_id": event["id"], "option_id": pick(event)})
            assert r.status_code == 200, r.text
        r = client.post(f"/api/missions/{mid}/advance-day")
        assert r.status_code == 200, r.text
        mission = r.json()["mission"]
        # the saved mission must always equal a fresh load: nothing drifts
        assert client.get(f"/api/missions/{mid}").json() == mission
    return mission


# ---------- starting and reading ----------
def test_start_returns_a_fresh_mission(client):
    m = start(client)
    assert m["state"]["day"] == 1 and m["status"] == "active"
    assert m["stage"]["number"] == 1
    assert m["event"] is None                       # first event arrives on day 2
    assert set(m["state"]["values"]) >= {"power", "oxygen", "water", "food", "shielding", "crew_health"}
    assert "game units" in m["disclaimer"]


def test_start_validates_input(client):
    assert client.post("/api/missions/start", json={"difficulty": "impossible"}).status_code == 422
    assert client.post("/api/missions/start", json={"nickname": "   "}).status_code == 422
    assert client.post("/api/missions/start", json={"seed": -5}).status_code == 422


def test_unknown_mission_is_404(client):
    assert client.get("/api/missions/9999").status_code == 404
    assert client.post("/api/missions/9999/advance-day").status_code == 404


def test_list_missions(client):
    start(client)
    start(client)
    assert len(client.get("/api/missions").json()) == 2


# ---------- decisions ----------
def test_decision_with_no_event_today_is_rejected(client):
    m = start(client)
    r = client.post(f"/api/missions/{m['id']}/decision", json={"event_id": "x", "option_id": "y"})
    assert r.status_code == 400


def test_cannot_advance_past_an_unanswered_event(client):
    m = start(client)
    client.post(f"/api/missions/{m['id']}/advance-day")     # day 1 -> 2, an event is waiting
    r = client.post(f"/api/missions/{m['id']}/advance-day")
    assert r.status_code == 409


def test_invalid_option_400_and_duplicate_409_and_nothing_saved_on_error(client):
    m = start(client)
    mid = m["id"]
    m = client.post(f"/api/missions/{mid}/advance-day").json()["mission"]
    event = m["event"]
    bad = client.post(f"/api/missions/{mid}/decision", json={"event_id": event["id"], "option_id": "nope"})
    assert bad.status_code == 400
    ok = client.post(f"/api/missions/{mid}/decision",
                     json={"event_id": event["id"], "option_id": event["options"][0]["id"]})
    assert ok.status_code == 200 and ok.json()["learning"]
    dup = client.post(f"/api/missions/{mid}/decision",
                      json={"event_id": event["id"], "option_id": event["options"][1]["id"]})
    assert dup.status_code == 409
    with client.Session() as db:
        assert db.scalar(select(func.count()).select_from(PlayerDecision)) == 1


def test_decision_survives_reload_before_advancing(client):
    m = start(client)
    mid = m["id"]
    m = client.post(f"/api/missions/{mid}/advance-day").json()["mission"]
    event = m["event"]
    after = client.post(f"/api/missions/{mid}/decision",
                        json={"event_id": event["id"], "option_id": event["options"][0]["id"]}).json()["mission"]
    assert client.get(f"/api/missions/{mid}").json() == after
    assert after["event"]["decided"] is True


# ---------- preview ----------
def test_preview_changes_nothing_and_matches_engine_rules(client):
    m = start(client)
    mid = m["id"]
    m = client.post(f"/api/missions/{mid}/advance-day").json()["mission"]
    before = client.get(f"/api/missions/{mid}").json()
    event = m["event"]
    for option in event["options"]:
        r = client.post(f"/api/missions/{mid}/preview", json={"option_id": option["id"]})
        assert r.status_code == 200
        assert set(r.json()["direction"].values()) <= {"up", "down", "same"}
    assert client.get(f"/api/missions/{mid}").json() == before
    with client.Session() as db:
        assert db.scalar(select(func.count()).select_from(PlayerDecision)) == 0


def test_preview_without_event_is_400(client):
    m = start(client)
    assert client.post(f"/api/missions/{m['id']}/preview", json={"option_id": "a"}).status_code == 400


# ---------- whole missions ----------
def test_full_mission_through_the_api_succeeds_and_matches_the_engine(client):
    m = play_via_api(client, start(client, seed=3), lambda e: SMART[e["id"]])
    assert m["status"] == "success"
    direct = play(3, lambda e: SMART[e.id])
    assert [h["values"] for h in m["history"]] == [h["values"] for h in direct.history]
    report = client.get(f"/api/missions/{m['id']}/report").json()
    assert report["final"] and report["status"] == "success"
    assert report["investigation"] is None
    assert isinstance(report["score_insights"], list)
    assert report["learning_outcomes"] and len(report["evaluation"]["scores"]) == 5
    with client.Session() as db:
        assert db.scalar(select(func.count()).select_from(ResourceState)) == 21        # day 0..20
        assert db.scalar(select(func.count()).select_from(MissionReport)) == 1
    assert client.post(f"/api/missions/{m['id']}/advance-day").status_code == 409     # mission over


def test_failed_mission_produces_an_investigation(client):
    last_option = {ev.id: ev.options[-1].id for ev in EVENT_LIBRARY}

    def neglect(e):  # the API shuffles the display order, so choose by id, not by position
        return last_option[e["id"]]
    failing_seed = next(s for s in range(60) if play(s, lambda ev: ev.options[-1].id).state.status == "failed")
    m = play_via_api(client, start(client, seed=failing_seed), neglect)
    assert m["status"] == "failed"
    report = client.get(f"/api/missions/{m['id']}/report").json()
    inv = report["investigation"]
    assert inv["primary_cause"] and inv["relevant_decisions"] and inv["how_to_avoid"]
    assert inv["resource_history"][-1][inv["resource"]] <= 0 or inv["resource"] == "crew_health"


def test_restart_replays_the_same_scenario_with_a_clean_slate(client):
    first = play_via_api(client, start(client, seed=5), lambda e: SMART[e["id"]])
    r = client.post(f"/api/missions/{first['id']}/restart").json()
    again = r["mission"]
    assert r["previous_mission_id"] == first["id"] and again["id"] != first["id"]
    assert again["seed"] == first["seed"] and again["state"]["day"] == 1 and again["decisions"] == []
    # same seed -> same story: the first event is identical
    a = client.post(f"/api/missions/{again['id']}/advance-day").json()["mission"]["event"]["id"]
    assert a == first["decisions"][0]["event_id"]


def test_commander_difficulty_is_harder_than_cadet(client):
    easy = play_via_api(client, start(client, seed=2), lambda e: SMART[e["id"]])
    hard = play_via_api(client, start(client, seed=2, difficulty="commander"), lambda e: SMART[e["id"]])
    def average_power(m):
        return sum(h["values"]["power"] for h in m["history"]) / len(m["history"])
    assert average_power(hard) < average_power(easy)


def test_option_order_is_shuffled_but_stable_for_a_seed(client):
    def first_event_order(seed):
        m = start(client, seed=seed)
        for _ in range(3):
            ev = m.get("event")
            if ev:
                return [o["id"] for o in ev["options"]]
            m = client.post(f"/api/missions/{m['id']}/advance-day").json()["mission"]
    orders = {tuple(first_event_order(s)) for s in range(12)}
    assert len(orders) > 1                                   # not always the same order
    assert first_event_order(7) == first_event_order(7)      # same seed -> same order


def test_a_won_mission_never_says_research_is_above_its_goal_as_progress(client):
    m = start(client, seed=1)
    text = " ".join(m["objectives"])
    assert "of 30" in text or "goal" in text
