import json

from sqlalchemy import func, select

from app.models.tables import PlayerDecision, ResourceState
from app.services import experiments as lab
from app.services.simulation_engine import Simulation
from tests.test_api import client, play_via_api, start  # noqa: F401  (client is a pytest fixture)

NO_CHANGE = {k["key"]: 0.0 for k in lab.PARAM_INFO}


def run(**changes):
    storm = changes.pop("storm", False)
    days = changes.pop("days", 7)
    return lab.run_experiment(Simulation(schedule={}), {**NO_CHANGE, **changes}, days, storm)


# ---------- the experiments behave sensibly ----------
def test_no_changes_means_no_difference():
    result = run()
    assert result["normal"]["final"] == result["what_if"]["final"]
    assert set(result["direction"].values()) == {"same"}


def test_less_sunlight_lowers_power():
    assert run(solar_power_pct=-50)["change"]["power"] < -5


def test_more_food_production_only_changes_food():
    result = run(food_production_pct=30)
    assert result["change"]["food"] > 0
    assert result["change"]["power"] == 0 and result["change"]["water"] == 0


def test_better_water_recycling_raises_water():
    assert run(water_recycling_pct=20)["change"]["water"] > 0


def test_more_energy_use_lowers_power_and_less_raises_it():
    assert run(energy_use_pct=30)["change"]["power"] < 0
    assert run(energy_use_pct=-20)["change"]["power"] > 0


def test_extra_shielding_only_helps_during_a_storm():
    assert run(shielding_boost=30)["change"]["crew_health"] == 0          # no storm: nothing to shield from
    stormy = run(shielding_boost=30, storm=True)
    assert stormy["change"]["crew_health"] > 0
    assert stormy["change"]["shielding"] == 30


def test_explanation_mentions_real_results_and_lessons():
    text = " ".join(run(solar_power_pct=-50)["explanation"])
    assert "Power ends" in text and "lower" in text
    assert "Solar panels turn sunlight" in text
    assert "turn on the training storm" in " ".join(run(shielding_boost=10)["explanation"])


def test_trade_off_is_pointed_out():
    result = run(food_production_pct=100, energy_use_pct=50)
    assert result["direction"]["food"] == "up" and result["direction"]["power"] == "down"
    assert "trade-off" in " ".join(result["explanation"])


def test_an_experiment_that_fails_explains_why():
    base = Simulation(schedule={})
    base.state.water = 8.0                                   # an outpost that is already short of water
    result = lab.run_experiment(base, {**NO_CHANGE, "water_recycling_pct": -50}, 10, False)
    assert result["what_if"]["status"] == "failed"
    assert result["what_if"]["ended_early"].startswith("Ended on lab day")
    assert "water ran out" in result["what_if"]["ended_early"]
    assert result["normal"]["status"] == "active"             # the normal run survives, so the player sees the difference


def test_same_inputs_give_the_same_result():
    assert run(solar_power_pct=-30, storm=True) == run(solar_power_pct=-30, storm=True)


# ---------- isolation: the real simulation is never touched ----------
def test_the_base_simulation_is_not_modified():
    base = Simulation(schedule={})
    base.advance_day()
    before = json.dumps(base.export(), sort_keys=True, default=str)
    lab.run_experiment(base, {**NO_CHANGE, "solar_power_pct": -50, "shielding_boost": 20}, 7, True)
    assert json.dumps(base.export(), sort_keys=True, default=str) == before
    assert base.config.g_max == Simulation(schedule={}).config.g_max


# ---------- the API ----------
def test_options_endpoint_lists_the_sliders(client):  # noqa: F811
    data = client.get("/api/experiments/options").json()
    assert len(data["params"]) == 5
    assert all(p["min"] < p["max"] for p in data["params"])


def test_api_experiment_on_a_fresh_outpost(client):  # noqa: F811
    r = client.post("/api/experiments/run", json={"params": {"solar_power_pct": -40}, "days": 5})
    assert r.status_code == 200
    body = r.json()
    assert body["label"] == "SIMULATED" and body["start"] == "A fresh outpost"
    assert len(body["normal"]["series"]) == 6 and body["change"]["power"] < 0


def test_api_experiment_never_changes_a_real_mission(client):  # noqa: F811
    m = start(client)
    mid = m["id"]
    before = client.get(f"/api/missions/{mid}").json()
    r = client.post("/api/experiments/run",
                    json={"mission_id": mid, "params": {"solar_power_pct": -60, "energy_use_pct": 50}, "storm": True})
    assert r.status_code == 200 and "day 1" in r.json()["start"]
    assert client.get(f"/api/missions/{mid}").json() == before
    with client.Session() as db:
        assert db.scalar(select(func.count()).select_from(PlayerDecision)) == 0
        assert db.scalar(select(func.count()).select_from(ResourceState)) == 1       # only the day-0 snapshot


def test_api_rejects_bad_input(client):  # noqa: F811
    assert client.post("/api/experiments/run", json={"params": {"solar_power_pct": -99}}).status_code == 422
    assert client.post("/api/experiments/run", json={"params": {"solar_powr_pct": 10}}).status_code == 422
    assert client.post("/api/experiments/run", json={"days": 0}).status_code == 422
    assert client.post("/api/experiments/run", json={"mission_id": 9999}).status_code == 404


def test_api_refuses_a_finished_mission(client):  # noqa: F811
    from tests.test_simulation import SMART
    m = play_via_api(client, start(client, seed=3), lambda e: SMART[e["id"]])
    assert m["status"] == "success"
    assert client.post("/api/experiments/run", json={"mission_id": m["id"]}).status_code == 409
