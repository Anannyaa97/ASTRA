from app.services.profile import MIN_DECISIONS, profile
from app.services.simulation_engine import Simulation
from tests.test_api import client, start  # noqa: F401


def play(choices):
    """Make a decision on each listed (event_id, option_id), one per mission day, on a fresh simulation."""
    sim = Simulation(schedule={})
    for day, (event_id, option_id) in enumerate(choices, start=sim.state.day):
        sim.schedule = {sim.state.day: event_id}
        sim._decided_today = False
        sim.decide(event_id, option_id)
        sim.advance_day()
    return sim


def counts(sim):
    return {s["id"]: s["count"] for s in profile(sim)["styles"]}


def test_not_ready_with_too_few_decisions():
    sim = play([("habitat_activation", "focus_science")])
    p = profile(sim)
    assert not p["ready"] and p["profile"] is None and str(MIN_DECISIONS) in p["message"]


def test_science_choices_make_a_scientific_explorer():
    sim = play([("habitat_activation", "focus_science"), ("science_opportunity", "big_experiment"),
                ("science_opportunity", "collect_samples")])
    p = profile(sim)
    assert p["ready"] and p["profile"]["id"] == "scientific_explorer"
    assert counts(sim)["scientific_explorer"] == 3


def test_fixing_basics_makes_a_resource_guardian():
    sim = play([("oxygen_maintenance", "maintain_now"), ("dust_on_equipment", "clean_now"),
                ("battery_shortage", "charge_now")])
    assert profile(sim)["profile"]["id"] == "resource_guardian"


def test_acting_on_problems_makes_an_emergency_specialist():
    sim = play([("solar_particle_warning", "shelter"), ("communication_interruption", "backup_radio"),
                ("solar_particle_warning", "boost_shielding")])
    assert profile(sim)["profile"]["id"] == "emergency_specialist"


def test_preparing_on_calm_days_makes_a_strategic_survivor():
    sim = play([("radiation_shelter_inspection", "full_upgrade"), ("greenhouse_expansion", "expand"),
                ("habitat_activation", "focus_food")])
    assert profile(sim)["profile"]["id"] == "strategic_survivor"


def test_doing_nothing_earns_no_style():
    sim = play([("habitat_activation", "balanced"), ("greenhouse_expansion", "keep_current"),
                ("battery_shortage", "live_without")])
    p = profile(sim)
    assert not p["ready"] and sum(counts(sim).values()) == 0 and "message" in p


def test_ties_resolve_in_fixed_order_and_report_the_close_style():
    sim = play([("habitat_activation", "focus_science"), ("oxygen_maintenance", "maintain_now"),
                ("science_opportunity", "collect_samples"), ("dust_on_equipment", "clean_now")])
    p = profile(sim)
    assert counts(sim)["scientific_explorer"] == 2 == counts(sim)["resource_guardian"]
    assert p["profile"]["id"] == "resource_guardian"           # earlier in the fixed order
    assert p["close_with"] == ["Scientific Explorer"]


def test_profile_is_deterministic_and_does_not_change_the_mission():
    sim = play([("habitat_activation", "focus_science"), ("oxygen_maintenance", "maintain_now"),
                ("dust_on_equipment", "clean_now")])
    before = sim.export()
    assert profile(sim) == profile(sim)
    assert sim.export() == before


def test_profile_endpoint(client):
    mission_id = start(client)["id"]
    data = client.get(f"/api/missions/{mission_id}/profile").json()
    assert data["ready"] is False and len(data["styles"]) == 4
    assert client.get("/api/missions/99999/profile").status_code == 404
