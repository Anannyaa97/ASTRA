"""Developer tool: play many missions with simple strategies to check the game is neither too easy nor impossible.

Run:  python balance_check.py
"""
import statistics as st

from app.services.simulation_engine import Simulation

SMART = {
    "habitat_activation": "balanced", "oxygen_maintenance": "maintain_now",
    "greenhouse_expansion": "expand_with_filter", "water_recycler_malfunction": "repair_now",
    "communication_interruption": "repair_antenna", "radiation_shelter_inspection": "full_upgrade",
    "solar_particle_warning": "shelter", "battery_shortage": "charge_now",
    "dust_on_equipment": "clean_now", "reduced_sunlight": "reduce_research",
    "science_opportunity": "collect_samples",
}
def greedy(event, sim):
    """Always grabs the option that expands activity (more greenhouse, more science), else the first option."""
    for option in event.options:
        if any(v > 0 for v in option.level_changes.values()):
            return option.id
    return event.options[0].id


POLICIES = {
    "greedy (always expands)": greedy,
    "careful (hand-made strategy)": lambda e, s: SMART[e.id],
    "always first option": lambda e, s: e.options[0].id,
    "always last option (do little)": lambda e, s: e.options[-1].id,
}


def play(seed, pick):
    sim = Simulation(seed=seed)
    while sim.state.status == "active":
        event = sim.current_event()
        if event:
            sim.decide(event.id, pick(event, sim))
        sim.advance_day()
    return sim


if __name__ == "__main__":
    N = 60
    for name, pick in POLICIES.items():
        games = [play(seed, pick) for seed in range(N)]
        wins = sum(g.state.status == "success" for g in games)
        scores = [g.evaluate()["overall"] for g in games]
        causes = {}
        for g in games:
            if g.state.failure:
                causes[g.state.failure["resource"]] = causes.get(g.state.failure["resource"], 0) + 1
        print(f"{name:32} success {wins:2}/{N}   average score {st.mean(scores):5.1f}   failures: {causes or 'none'}")
