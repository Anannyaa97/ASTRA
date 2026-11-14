from app.services.achievements import achievements
from app.services.simulation_engine import Simulation
from tests.test_api import client, start  # noqa: F401


def earned(sim):
    return {b["id"] for b in achievements(sim) if b["earned"]}


def calm_win():
    """A finished, healthy mission with no events."""
    sim = Simulation(schedule={})
    s = sim.state
    s.power = s.oxygen = s.water = s.food = 90.0
    s.shielding, s.crew_health = 80.0, 100.0
    s.research = sim.config.research_goal
    for _ in range(sim.config.mission_days):
        sim.advance_day()
    return sim


def test_new_mission_earns_nothing():
    sim = Simulation(schedule={})
    assert earned(sim) == set()


def test_first_command_after_a_decision():
    sim = Simulation()
    event = next(iter(sim.events.values()))
    sim.schedule = {sim.state.day: event.id}
    sim._decided_today = False
    sim.decide(event.id, event.options[0].id)
    assert "first_command" in earned(sim)


def test_no_outcome_badge_while_mission_is_still_running():
    sim = Simulation(schedule={})
    sim.state.research = sim.config.research_goal
    sim.advance_day()
    got = earned(sim)
    assert "mission_complete" not in got and "everyone_safe" not in got and "water_keeper" not in got


def test_healthy_finished_mission_earns_outcome_badges():
    sim = calm_win()
    assert sim.state.status == "success"
    got = earned(sim)
    assert {"mission_complete", "everyone_safe", "always_breathing", "water_keeper", "science_star"} <= got
    # no storm happened, so Storm Ready cannot be earned
    assert "storm_ready" not in got


def test_a_dip_below_the_line_blocks_the_badge():
    sim = Simulation(schedule={})
    s = sim.state
    s.power = s.oxygen = s.water = s.food = 90.0
    s.research = sim.config.research_goal
    sim.advance_day()
    sim.state.water = 10.0
    sim.history[-1] = sim._snapshot(sim.history[-1]["day"], sim.history[-1]["flows"])
    while sim.state.status == "active":
        sim.state.water = max(sim.state.water, 10.0)
        sim.advance_day()
    assert "water_keeper" not in earned(sim)


def test_failed_mission_earns_no_outcome_badges():
    sim = Simulation(schedule={})
    sim.state.oxygen = 0.0
    sim.state.crew_health = 5.0
    while sim.state.status == "active":
        sim.advance_day()
    assert sim.state.status == "failed"
    assert "mission_complete" not in earned(sim)
    assert "everyone_safe" not in earned(sim)


def test_badges_are_deterministic_and_do_not_change_the_mission():
    sim = calm_win()
    before = sim.export()
    assert achievements(sim) == achievements(sim)
    assert sim.export() == before


def test_achievements_endpoint(client):
    mission_id = start(client)["id"]
    data = client.get(f"/api/missions/{mission_id}/achievements").json()
    assert data["total"] == len(data["badges"]) == 10
    assert data["earned"] == 0
    assert client.get("/api/missions/99999/achievements").status_code == 404
