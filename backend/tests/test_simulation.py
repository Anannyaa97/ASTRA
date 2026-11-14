import json
from dataclasses import replace

import pytest

from app.data.events import EVENT_LIBRARY
from app.services.event_manager import build_schedule, validate_event
from app.services.sim_config import SimConfig
from app.services.simulation_engine import (
    DecisionRequired, DuplicateDecision, InsufficientResources, InvalidDecision,
    MissionOver, Simulation, replay, signal_status,
)


def quiet_sim(**kw):
    """A simulation with no events, for testing the daily maths alone."""
    return Simulation(schedule={}, **kw)


def sim_at_day(day, event_id, seed=0):
    """A simulation advanced to `day`, where `event_id` is waiting for a decision."""
    sim = Simulation(seed=seed, schedule={day: event_id})
    while sim.state.day < day:
        sim.advance_day()
    assert sim.current_event().id == event_id
    return sim


# ---------- daily maths ----------
def test_first_quiet_day_matches_hand_calculation():
    sim = quiet_sim()
    report = sim.advance_day()
    v = report["values"]
    assert v["power"] == 64.0      # 60 + 23 - (6+5+2+3+3)
    assert v["oxygen"] == 70.5     # 70 + 5 - 4.5
    assert v["water"] == 50.5      # 50 + 5 - (3 + 1.5)
    assert v["food"] == 60.5       # 60 + 3 - 2.5
    assert v["research"] == 2.0
    assert v["crew_health"] == 100.0


def test_resources_never_exceed_100_or_go_below_0():
    sim = quiet_sim()
    sim.state.power = 99.0
    sim.advance_day()
    assert sim.state.power <= 100
    sim = quiet_sim()
    sim.state.efficiency["solar"] = 0.0
    sim.state.power = 3.0
    sim.advance_day()
    assert sim.state.power >= 0


def test_power_shortage_cuts_low_priority_systems_first():
    sim = quiet_sim()
    sim.state.efficiency["solar"] = 0.0
    sim.state.power = 14.0          # oxygen 6 + water 5 + comms 2 = 13, only 1 left for the greenhouse
    report = sim.advance_day()
    assert report["flows"]["research_made"] == 0.0           # research got nothing
    assert report["flows"]["oxygen_made"] == 5.0             # life support kept running
    assert report["flows"]["water_recycled"] == 5.0


def test_snapshot_saved_for_every_day():
    sim = quiet_sim()
    for _ in range(5):
        sim.advance_day()
    assert [h["day"] for h in sim.history] == [0, 1, 2, 3, 4, 5]


def test_mission_succeeds_after_final_day_and_then_refuses_actions():
    sim = quiet_sim()
    while sim.state.status == "active":
        sim.advance_day()
    assert sim.state.status == "success"
    assert len(sim.history) == sim.config.mission_days + 1
    with pytest.raises(MissionOver):
        sim.advance_day()


# ---------- decisions ----------
def test_cannot_advance_without_deciding():
    sim = sim_at_day(3, "reduced_sunlight")
    with pytest.raises(DecisionRequired):
        sim.advance_day()


def test_invalid_event_and_option_rejected():
    sim = sim_at_day(3, "reduced_sunlight")
    with pytest.raises(InvalidDecision):
        sim.decide("greenhouse_expansion", "expand")      # not today's event
    with pytest.raises(InvalidDecision):
        sim.decide("reduced_sunlight", "nonsense")        # not an option


def test_duplicate_decision_rejected():
    sim = sim_at_day(3, "reduced_sunlight")
    sim.decide("reduced_sunlight", "reduce_research")
    with pytest.raises(DuplicateDecision):
        sim.decide("reduced_sunlight", "reduce_greenhouse")


def test_insufficient_battery_blocks_backup_batteries():
    sim = sim_at_day(3, "reduced_sunlight")
    sim.state.battery = 10.0
    with pytest.raises(InsufficientResources):
        sim.decide("reduced_sunlight", "backup_batteries")
    assert sim.decisions == []                 # a refused decision changes nothing


def test_backup_batteries_trade_battery_for_power():
    sim = sim_at_day(3, "reduced_sunlight")
    power, battery = sim.state.power, sim.state.battery
    sim.decide("reduced_sunlight", "backup_batteries")
    assert sim.state.power == min(100, power + 20)
    assert sim.state.battery == battery - 25


def test_reduced_sunlight_lowers_generation_then_ends():
    sim = sim_at_day(3, "reduced_sunlight")
    sim.decide("reduced_sunlight", "reduce_research")
    gens = [sim.advance_day()["flows"]["power_generated"] for _ in range(5)]
    assert gens[:4] == [9.2] * 4               # 23 x 0.4 for four days
    assert gens[4] == 23.0                     # sunlight back


# ---------- delayed effects ----------
def test_water_filter_upgrade_arrives_two_days_later():
    sim = sim_at_day(3, "greenhouse_expansion")
    sim.decide("greenhouse_expansion", "expand_with_filter")
    assert sim.state.efficiency["water"] == 1.0
    sim.advance_day()                           # day 3 -> 4
    assert sim.state.efficiency["water"] == 1.0
    report = sim.advance_day()                  # day 4 -> 5: effect is due
    assert sim.state.efficiency["water"] == 1.2
    assert any("water filter" in n for n in report["notes"]) or sim.state.efficiency["water"] == 1.2


def test_science_pause_is_restored_by_a_delayed_effect():
    sim = sim_at_day(3, "reduced_sunlight")
    sim.decide("reduced_sunlight", "reduce_research")
    assert sim.state.research_level == 0
    for _ in range(6):
        sim.advance_day()
    assert sim.state.research_level == 1


def test_greenhouse_food_ramps_up_gradually_but_water_cost_is_immediate():
    sim = sim_at_day(3, "greenhouse_expansion")
    sim.decide("greenhouse_expansion", "expand")
    reports = [sim.advance_day() for _ in range(4)]
    food = [r["flows"]["food_made"] for r in reports]
    water_used = [r["flows"]["water_used"] for r in reports]
    assert water_used[0] == 6.0                           # 3 + 1.5 x 2 levels, right away
    assert food == sorted(food) and food[0] < food[-1]    # food keeps rising: a delayed benefit
    assert food[0] < 6.0                                  # not full production on day one


# ---------- radiation ----------
def health_after_storm(option_id):
    sim = sim_at_day(3, "solar_particle_warning")
    sim.decide("solar_particle_warning", option_id)
    for _ in range(3):
        sim.advance_day()
    return sim.state.crew_health


def test_shelter_protects_crew_better_than_working_through_the_storm():
    assert health_after_storm("shelter") > health_after_storm("keep_working")


def test_extra_shielding_helps_but_less_than_sheltering():
    working = health_after_storm("keep_working")
    shielded = health_after_storm("boost_shielding")
    sheltered = health_after_storm("shelter")
    assert working < shielded < sheltered


def test_sheltering_pauses_research():
    sim = sim_at_day(3, "solar_particle_warning")
    sim.decide("solar_particle_warning", "shelter")
    report = sim.advance_day()
    assert report["flows"]["research_made"] == 0.0
    assert report["flows"]["sheltering"] is True


# ---------- failure and investigation ----------
def test_water_failure_is_detected_and_explained_from_real_history():
    sim = sim_at_day(3, "greenhouse_expansion")
    sim.decide("greenhouse_expansion", "expand")
    sim.state.water = 6.0
    sim.state.efficiency["water"] = 0.0         # recycler broken
    while sim.state.status == "active":
        sim.advance_day()
    assert sim.state.status == "failed"
    assert sim.state.failure["resource"] == "water"
    report = sim.investigate()
    assert report["resource"] == "water"
    assert any("Add the growing tray" in line for line in report["relevant_decisions"])
    assert report["how_to_avoid"] and report["science_note"]
    assert report["resource_history"][-1]["water"] == 0


def test_investigation_is_none_for_a_healthy_mission():
    assert quiet_sim().investigate() is None


# ---------- previews ----------
def test_preview_does_not_change_the_real_mission():
    sim = sim_at_day(3, "greenhouse_expansion")
    before = json.dumps(sim.export(), sort_keys=True, default=str)
    sim.preview("greenhouse_expansion", "expand")
    assert json.dumps(sim.export(), sort_keys=True, default=str) == before


def test_preview_directions_for_greenhouse_expansion():
    sim = sim_at_day(3, "greenhouse_expansion")
    p = sim.preview("greenhouse_expansion", "expand")["direction"]
    assert p["food"] == "up"
    assert p["water"] == "down"
    assert p["power"] == "down"
    assert p["research"] == "same"


def test_preview_matches_what_really_happens():
    sim = sim_at_day(3, "greenhouse_expansion")
    predicted = sim.preview("greenhouse_expansion", "expand", horizon=3)["forecast"][-1]
    sim.decide("greenhouse_expansion", "expand")
    sim.schedule = {}                           # preview assumes no other events
    for _ in range(3):
        sim.advance_day()
    assert sim.values() == predicted


def test_preview_refuses_what_a_real_decision_would_refuse():
    sim = sim_at_day(3, "reduced_sunlight")
    sim.state.battery = 5.0
    with pytest.raises(InsufficientResources):
        sim.preview("reduced_sunlight", "backup_batteries")


# ---------- determinism and replay ----------
def play(seed, pick):
    sim = Simulation(seed=seed)
    while sim.state.status == "active":
        event = sim.current_event()
        if event:
            sim.decide(event.id, pick(event))
        sim.advance_day()
    return sim


def first_option(event):
    return event.options[0].id


def test_same_seed_and_decisions_give_identical_results():
    a, b = play(7, first_option), play(7, first_option)
    assert a.history == b.history
    assert a.state.status == b.state.status


def test_replay_from_decision_list_reproduces_the_mission():
    original = play(3, first_option)
    rebuilt = replay(original.decisions, seed=3, days=original.state.day)
    assert rebuilt.history == original.history


def test_seed_changes_the_event_order():
    schedules = {tuple(sorted(Simulation(seed=s).schedule.items())) for s in range(10)}
    assert len(schedules) > 1


def test_schedule_is_stable_for_a_seed():
    assert build_schedule(EVENT_LIBRARY, 5, 20) == build_schedule(list(reversed(EVENT_LIBRARY)), 5, 20)


# ---------- configuration and evaluation ----------
def test_event_library_is_valid():
    for event in EVENT_LIBRARY:
        validate_event(event)


def test_config_changes_the_outcome_through_a_copy_only():
    from dataclasses import replace

    from app.services.sim_config import SimConfig
    base = quiet_sim()
    dim = quiet_sim(config=replace(SimConfig(), g_max=12.0))
    assert dim.advance_day()["values"]["power"] < base.advance_day()["values"]["power"]


def test_evaluation_has_several_categories():
    sim = play(1, first_option)
    result = sim.evaluate()
    assert {"crew_safety", "resource_management", "research_progress",
            "emergency_response", "sustainability"} == set(result["scores"])
    for value in result["scores"].values():
        assert value is None or 0 <= value <= 100
    assert 0 <= result["overall"] <= 100


# ---------- full event library and stages ----------
def test_library_has_at_least_ten_events_covering_all_five_stages():
    assert len(EVENT_LIBRARY) >= 10
    assert {e.stage for e in EVENT_LIBRARY} == {1, 2, 3, 4, 5}
    assert len({e.id for e in EVENT_LIBRARY}) == len(EVENT_LIBRARY)


def test_schedule_follows_the_story_order_for_every_seed():
    by_id = {e.id: e for e in EVENT_LIBRARY}
    for seed in range(25):
        schedule = Simulation(seed=seed).schedule
        stages = [by_id[schedule[day]].stage for day in sorted(schedule)]
        assert stages == sorted(stages)                    # Arrival -> ... -> Outpost
        assert len(set(schedule.values())) == len(schedule)  # no event repeats


def test_every_event_is_playable_and_labelled():
    for event in EVENT_LIBRARY:
        for option in event.options:
            sim = sim_at_day(3, event.id)
            sim.state.battery = 100.0
            sim.decide(event.id, option.id)
            sim.advance_day()
            assert event.learning and event.source


def test_dust_lowers_power_generation():
    sim = sim_at_day(3, "dust_on_equipment")
    sim.decide("dust_on_equipment", "ignore_dust")
    assert sim.advance_day()["flows"]["power_generated"] == 17.25    # 23 x 0.75


def test_cleaning_dust_restores_generation_for_a_power_cost():
    sim = sim_at_day(3, "dust_on_equipment")
    sim.decide("dust_on_equipment", "clean_now")
    assert sim.advance_day()["flows"]["power_generated"] == 23.0


def test_weak_radio_link_slows_research():
    sim = sim_at_day(3, "communication_interruption")
    sim.decide("communication_interruption", "ignore_comms")
    sim.advance_day()                                           # link weakens during this day
    slow = sim.advance_day()["flows"]["research_made"]
    assert slow < 2.0


def test_water_malfunction_cuts_recycling_until_repaired():
    sim = sim_at_day(3, "water_recycler_malfunction")
    sim.decide("water_recycler_malfunction", "wait_and_see")
    assert sim.advance_day()["flows"]["water_recycled"] == 1.0       # 5 x (1 - 0.8)
    sim = sim_at_day(3, "water_recycler_malfunction")
    sim.decide("water_recycler_malfunction", "repair_now")
    sim.advance_day()
    assert sim.advance_day()["flows"]["water_recycled"] == 5.0


def test_battery_shortage_removes_battery_when_it_starts():
    sim = Simulation(schedule={3: "battery_shortage"})
    battery_before = sim.state.battery
    while sim.state.day < 3:
        sim.advance_day()
    assert sim.state.battery == battery_before - 30


SMART = {
    "habitat_activation": "balanced", "oxygen_maintenance": "maintain_now",
    "greenhouse_expansion": "expand_with_filter", "water_recycler_malfunction": "repair_now",
    "communication_interruption": "repair_antenna", "radiation_shelter_inspection": "full_upgrade",
    "solar_particle_warning": "shelter", "battery_shortage": "charge_now",
    "dust_on_equipment": "clean_now", "reduced_sunlight": "reduce_research",
    "science_opportunity": "collect_samples",
    "oxygen_filter_clog": "swap_filter", "greenhouse_blight": "treat_plants",
}


def test_careful_play_never_fails_across_many_seeds():
    for seed in range(30):
        assert play(seed, lambda e: SMART[e.id]).state.status == "success"


def test_ignoring_the_broken_water_recycler_can_sink_the_mission():
    outcomes = [play(seed, lambda e: e.options[-1].id) for seed in range(30)]
    failed = [g for g in outcomes if g.state.status == "failed"]
    assert failed, "neglect should be able to lose, otherwise the game teaches nothing"
    assert all(g.state.failure["resource"] == "water" for g in failed)
    report = failed[0].investigate()
    assert any("Wait and see" in line and "Nothing was changed" in line for line in report["relevant_decisions"])


# ---------- score explanations ----------
def test_low_power_is_explained_from_the_real_history():
    sim = quiet_sim()
    sim.state.efficiency["solar"] = 0.5            # panels make about half the power: Power slowly drains to zero
    while sim.state.status == "active":
        sim.advance_day()
    insights = {i["category"]: i for i in sim.explain_scores()}
    why = insights["resource_management"]["why"]
    assert "Power was your lowest resource on" in why and "as low as 0" in why
    assert insights["resource_management"]["tip"]
    assert insights["resource_management"]["score"] == sim.evaluate()["scores"]["resource_management"]
    # Power is flat at zero at the end: not "still falling", but there is no spare supply left
    assert "sustainability" in insights and insights["sustainability"]["tip"]


def test_a_healthy_quiet_mission_has_no_explanations():
    sim = quiet_sim()
    sim.state.efficiency["solar"] = 1.5            # plenty of power all mission
    sim.state.research_level = 2
    while sim.state.status == "active":
        sim.advance_day()
    low = [i for i in sim.explain_scores() if i["category"] != "emergency_response"]
    assert all(i["score"] < 70 for i in low)       # only genuinely weak categories are ever listed


def test_explanations_only_list_categories_below_the_limit():
    sim = play(1, first_option)
    scores = sim.evaluate()["scores"]
    for item in sim.explain_scores():
        assert scores[item["category"]] < 70
        assert item["why"] and item["tip"]


# ---------- preview extras ----------
def test_preview_lists_effects_that_arrive_later():
    sim = sim_at_day(3, "greenhouse_expansion")
    p = sim.preview("greenhouse_expansion", "expand_with_filter")
    assert any(item["after_days"] == 2 and "water filter" in item["note"] for item in p["later"])
    assert sim.preview("greenhouse_expansion", "keep_current")["later"] == []


def test_preview_reports_a_resource_that_is_already_falling():
    sim = sim_at_day(3, "greenhouse_expansion")
    sim.state.greenhouse_level = 2                 # the greenhouse drinks more water than the recycler makes
    sim.state.greenhouse_maturity = 2.0
    p = sim.preview("greenhouse_expansion", "keep_current")
    assert p["trend_if_nothing"]["water"] < -0.5
    assert p["trend_if_nothing"]["oxygen"] >= 0


def test_score_insights_point_to_an_academy_lesson():
    from app.services.simulation_engine import Simulation
    import tests.test_simulation as t
    lessons = {"power", "air", "water", "food", "radiation", "dust"}
    # every insight produced by a weak run carries a valid lesson id
    sim = Simulation(seed=3)
    for _ in range(sim.config.mission_days):
        if sim.state.status != "active":
            break
        event = sim.current_event()
        if event is not None and not sim._decided_today:
            sim.decide(event.id, event.options[-1].id)
        sim.advance_day()
    for item in sim.explain_scores(below=101):
        assert item["topic"] in lessons


# ---------- game balance (the difficulty curve is a design promise, so it is tested) ----------
def test_the_power_crisis_ends_before_the_mission_does():
    # Even when it hits in the last event slot of stage 4 (day 16), sunlight returns and paused work restarts by day 20.
    sim = sim_at_day(16, "reduced_sunlight")
    sim.decide("reduced_sunlight", "reduce_research")
    assert sim.state.research_level == 0
    while sim.state.status == "active":
        sim.advance_day()
    assert sim.state.status == "success"
    assert sim.state.research_level == 1          # the delayed "science restarts" effect really arrived
    assert not sim.state.sunlight_mods


def test_balance_careful_play_wins_and_neglect_can_lose():
    seeds = range(40)
    careful = [play(s, first_option) for s in seeds]
    neglect = [play(s, lambda e: e.options[-1].id) for s in seeds]
    assert all(g.state.status == "success" for g in careful)          # careful play is always rewarded
    lost = sum(1 for g in neglect if g.state.status == "failed")
    assert 5 <= lost <= 30, "neglect should lose sometimes, but not nearly always (it is a game for kids)"


def test_a_fresh_mission_starts_with_every_dial_in_the_good_zone():
    values = Simulation(seed=0).values()
    for key in ("power", "oxygen", "water", "food", "shielding"):
        assert values[key] >= 50, f"{key} should not start in the warning zone"


def test_sustainability_rewards_a_steady_well_stocked_ending():
    def average(policy):
        scores = [play(seed, policy).evaluate()["scores"]["sustainability"] for seed in range(20)]
        assert all(0 <= x <= 100 for x in scores)
        return sum(scores) / len(scores)
    assert average(lambda e: SMART.get(e.id, e.options[0].id)) > average(lambda e: e.options[-1].id) + 10


def test_preview_reports_where_each_value_starts_and_ends():
    sim = quiet_sim()
    sim.advance_day()
    event = sim.current_event()
    if event is None:
        return
    p = sim.preview(event.id, event.options[0].id)
    assert p["start"] == sim.values()
    assert len(p["forecast"]) == p["horizon_days"]


def test_daily_report_changes_include_the_cost_of_the_players_choice():
    # Each day's "change" must equal today's end value minus yesterday's end value,
    # so a repair that costs power can never show up as a power gain.
    for seed in range(5):
        sim = Simulation(seed=seed)
        while sim.state.status == "active":
            event = sim.current_event()
            if event:
                sim.decide(event.id, event.options[0].id)
            yesterday = dict(sim.history[-1]["values"])
            report = sim.advance_day()
            today = sim.history[-1]["values"]
            for key, change in report["deltas"].items():
                assert change == round(today[key] - yesterday[key], 2)


def test_commander_level_has_bonus_problems_and_lower_supplies_but_cadet_is_unchanged():
    from app.services.mission_service import DIFFICULTIES
    cadet = Simulation(config=DIFFICULTIES["cadet"], seed=4)
    commander = Simulation(config=DIFFICULTIES["commander"], seed=4)
    bonus = {"oxygen_filter_clog", "greenhouse_blight"}
    assert not bonus & set(cadet.schedule.values())          # Cadet never sees them
    assert bonus == bonus & set(commander.schedule.values())  # Commander gets both
    normal = {d: e for d, e in commander.schedule.items() if e not in bonus}
    assert normal == cadet.schedule                          # the normal story is identical
    assert commander.state.power < cadet.state.power and commander.state.water < cadet.state.water


def test_commander_still_rewards_careful_play_and_punishes_neglect():
    from app.services.mission_service import DIFFICULTIES
    def run(pick, seed):
        sim = Simulation(config=DIFFICULTIES["commander"], seed=seed)
        while sim.state.status == "active":
            e = sim.current_event()
            if e:
                sim.decide(e.id, pick(e))
            sim.advance_day()
        return sim.state.status
    assert all(run(lambda e: SMART[e.id], s) == "success" for s in range(20))
    losses = sum(run(lambda e: e.options[-1].id, s) != "success" for s in range(20))
    assert losses >= 8


def test_cadet_and_commander_configs_are_unchanged_by_the_ladder():
    from app.services.mission_service import DIFFICULTIES
    assert DIFFICULTIES["cadet"] == SimConfig()
    assert DIFFICULTIES["commander"] == replace(
        SimConfig(), g_max=20.0, start_power=50.0, start_water=42.0, start_food=52.0,
        bonus_event_days=(5, 13),
    )


def test_storm_season_and_the_long_night_are_winnable_with_smart_play():
    from app.services.mission_service import DIFFICULTIES
    for difficulty in ("storm_season", "the_long_night"):
        for seed in range(20):
            sim = Simulation(config=DIFFICULTIES[difficulty], seed=seed)
            while sim.state.status == "active":
                event = sim.current_event()
                if event:
                    sim.decide(event.id, SMART[event.id])
                sim.advance_day()
            assert sim.state.status == "success", f"{difficulty} failed with seed {seed}"


def test_storm_season_and_the_long_night_are_harder_than_cadet_with_neglect():
    from app.services.mission_service import DIFFICULTIES

    def losses(difficulty):
        count = 0
        for seed in range(20):
            sim = Simulation(config=DIFFICULTIES[difficulty], seed=seed)
            while sim.state.status == "active":
                event = sim.current_event()
                if event:
                    sim.decide(event.id, event.options[-1].id)
                sim.advance_day()
            count += sim.state.status != "success"
        return count

    cadet_losses = losses("cadet")
    for difficulty in ("storm_season", "the_long_night"):
        assert losses(difficulty) >= cadet_losses


def test_signal_status_thresholds():
    assert signal_status(100) == "clear"
    assert signal_status(70) == "clear"
    assert signal_status(69.9) == "delayed"
    assert signal_status(25) == "delayed"
    assert signal_status(24.9) == "blackout"
    assert signal_status(0) == "blackout"


def test_public_state_reports_the_signal_to_earth():
    sim = quiet_sim()
    assert sim.public_state()["signal"] == "clear"       # comms starts healthy
    sim.state.comms = 10.0
    assert sim.public_state()["signal"] == "blackout"
