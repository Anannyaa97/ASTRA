import json

from app.services.advisor import advise
from app.services.simulation_engine import Simulation
from tests.test_api import client, start  # noqa: F401  (client is a pytest fixture)


def healthy_sim():
    """A calm outpost where every number is comfortably good."""
    sim = Simulation(schedule={})
    s = sim.state
    s.power = s.oxygen = s.water = s.food = 80.0
    s.shielding, s.crew_health = 70.0, 100.0
    sim.history[-1] = sim._snapshot(0, None)
    return sim


def by_id(advice):
    return {a["id"]: a["messages"] for a in advice["advisors"]}


def top(advice, advisor_id):
    return by_id(advice)[advisor_id][0]


def test_four_advisors_in_order():
    advice = advise(healthy_sim())
    assert [a["id"] for a in advice["advisors"]] == ["commander", "engineer", "life_support", "space_weather"]
    assert advice["disclaimer"]
    assert all(1 <= len(a["messages"]) <= 3 for a in advice["advisors"])


def test_everything_fine_means_every_advisor_says_ok():
    advice = advise(healthy_sim())
    assert all(top(advice, i)["level"] == "ok" for i in by_id(advice))


def test_critical_power_is_urgent_and_the_commander_agrees():
    sim = healthy_sim()
    sim.state.power = 10.0
    advice = advise(sim)
    assert top(advice, "engineer")["level"] == "danger" and "10" in top(advice, "engineer")["text"]
    assert top(advice, "commander")["level"] == "danger"
    assert "Power is critical" in top(advice, "commander")["text"]


def test_low_and_critical_water_use_different_levels():
    sim = healthy_sim()
    sim.state.water = 30.0
    assert top(advise(sim), "life_support")["level"] == "warn"
    assert top(advise(sim), "life_support")["headline"] == "Water is getting low"
    sim.state.water = 10.0
    msg = top(advise(sim), "life_support")
    assert msg["level"] == "danger" and "recycler" in msg["text"]


def test_dusty_panels_are_explained_with_the_real_percentage():
    sim = healthy_sim()
    sim.state.efficiency["solar"] = 0.75
    texts = " ".join(m["text"] for m in by_id(advise(sim))["engineer"])
    assert "75%" in texts


def test_low_sunlight_is_explained():
    sim = healthy_sim()
    sim.state.sunlight_mods.append({"factor": 0.4, "days_left": 4})
    texts = " ".join(m["text"] for m in by_id(advise(sim))["engineer"])
    assert "40%" in texts and "4 more days" in texts


def test_a_weak_link_to_earth_is_reported():
    sim = healthy_sim()
    sim.state.comms = 40.0
    assert any("40%" in m["text"] for m in by_id(advise(sim))["engineer"])


def test_a_falling_resource_is_noticed_before_it_is_low():
    sim = Simulation(schedule={})
    sim.state.efficiency["solar"] = 0.5            # panels at half power: Power drains every day
    for _ in range(3):
        sim.advance_day()
    texts = " ".join(m["text"] for m in by_id(advise(sim))["engineer"])
    assert "falling about" in texts and "run out in about" in texts


def test_storm_without_shelter_versus_with_shelter():
    sim = healthy_sim()
    sim.state.shielding = 30.0
    sim.state.hazards.append({"severity": 0.8, "days_left": 3})
    exposed = top(advise(sim), "space_weather")
    assert exposed["level"] == "danger" and "not sheltering" in exposed["text"]
    sim.state.shelter_days_left = 3
    safe = top(advise(sim), "space_weather")
    assert safe["level"] == "ok" and "sheltering" in safe["headline"] and "Sheltering gives" in safe["text"]


def test_low_protection_is_flagged_even_without_a_storm():
    sim = healthy_sim()
    sim.state.shielding = 30.0
    msg = top(advise(sim), "space_weather")
    assert msg["level"] == "warn" and "30" in msg["text"]


def test_weather_advice_never_pretends_to_be_real():
    text = top(advise(healthy_sim()), "space_weather")["text"]
    assert "not a real forecast" in text


def test_commander_points_to_a_waiting_decision():
    sim = Simulation(schedule={1: "greenhouse_expansion"})
    texts = " ".join(m["text"] for m in by_id(advise(sim))["commander"])
    assert "Greenhouse Expansion" in texts


def test_commander_handles_a_finished_mission():
    sim = Simulation(schedule={})
    while sim.state.status == "active":
        sim.advance_day()
    assert "over" in top(advise(sim), "commander")["headline"]


def test_asking_for_advice_never_changes_the_mission():
    sim = healthy_sim()
    sim.state.power = 10.0
    before = json.dumps(sim.export(), sort_keys=True, default=str)
    advise(sim)
    assert json.dumps(sim.export(), sort_keys=True, default=str) == before


def test_advice_api(client):  # noqa: F811
    m = start(client)
    before = client.get(f"/api/missions/{m['id']}").json()
    r = client.get(f"/api/missions/{m['id']}/advice")
    assert r.status_code == 200
    body = r.json()
    assert len(body["advisors"]) == 4 and body["day"] == 1
    assert client.get(f"/api/missions/{m['id']}").json() == before
    assert client.get("/api/missions/9999/advice").status_code == 404


def test_one_day_is_never_written_as_1_days():
    sim = healthy_sim()
    sim.state.hazards.append({"severity": 0.8, "days_left": 1})
    sim.state.sunlight_mods.append({"factor": 0.4, "days_left": 1})
    advice = advise(sim)
    text = " ".join(m["text"] for a in advice["advisors"] for m in a["messages"])
    assert "1 days" not in text and "1 more days" not in text
    assert "about 1 more day" in text


def test_a_waiting_decision_is_a_tip_not_good_news():
    sim = Simulation(schedule={1: "greenhouse_expansion"})
    waiting = [m for m in by_id(advise(sim))["commander"] if m["headline"] == "A decision is waiting"]
    assert waiting and waiting[0]["level"] == "info"


def test_a_lost_signal_silences_every_advisor():
    sim = healthy_sim()
    sim.state.power = 10.0  # would normally be an urgent, chatty engineer message
    sim.state.comms = 10.0
    advice = advise(sim)
    assert advice["signal"] == "blackout"
    for messages in by_id(advice).values():
        assert len(messages) == 1
        assert messages[0]["headline"] == "No signal"
        assert "10" not in messages[0]["text"]  # the real power problem is not smuggled through


def test_a_weak_signal_warns_but_still_advises():
    sim = healthy_sim()
    sim.state.comms = 40.0
    advice = advise(sim)
    assert advice["signal"] == "delayed"
    assert top(advice, "commander")["headline"] == "The link is weak"
    # the engineer still reports the real problem underneath the warning
    assert any("40%" in m["text"] for m in by_id(advice)["engineer"])


def test_a_clear_signal_has_no_banner_and_advises_normally():
    advice = advise(healthy_sim())
    assert advice["signal"] == "clear"
    assert top(advice, "commander")["headline"] != "The link is weak"


def test_a_lost_signal_on_a_finished_mission_still_shows_the_ending():
    sim = Simulation(schedule={})
    sim.state.efficiency["comms"] = 0.0  # comms stays at 0% (blackout) for the whole mission
    while sim.state.status == "active":
        sim.advance_day()
    advice = advise(sim)
    assert advice["signal"] == "blackout"
    assert "over" in top(advice, "commander")["headline"]
