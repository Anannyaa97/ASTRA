"""Play a whole ASTRA mission in the terminal with a simple automatic player.

Run from the backend folder:   python demo_mission.py
Optional:                      python demo_mission.py 5      (use seed 5 for a different event order)
"""
import sys

from app.services.simulation_engine import Simulation

seed = int(sys.argv[1]) if len(sys.argv) > 1 else 1
sim = Simulation(seed=seed)
print(f"ASTRA demo mission  (seed {seed}, {sim.config.mission_days} days)  - all numbers are game units\n")
print(f"{'Day':>3} {'Power':>6} {'Oxy':>6} {'Water':>6} {'Food':>6} {'Health':>7} {'Sci':>5}  What happened")

while sim.state.status == "active":
    event = sim.current_event()
    what = ""
    if event:
        option = event.options[0]          # this simple player always picks the first option
        preview = sim.preview(event.id, option.id)
        sim.decide(event.id, option.id)
        what = f"{event.title} -> '{option.label}'  (preview: {preview['direction']['food']} food, {preview['direction']['power']} power)"
    report = sim.advance_day()
    v = report["values"]
    print(f"{report['day']:>3} {v['power']:>6} {v['oxygen']:>6} {v['water']:>6} {v['food']:>6} {v['crew_health']:>7} {v['research']:>5}  {what}")
    for note in report["notes"]:
        print(f"      - {note}")

print(f"\nMission result: {sim.state.status.upper()}")
if sim.state.status == "failed":
    inv = sim.investigate()
    print("INVESTIGATION:", inv["primary_cause"])
    print("Decline began on day", inv["decline_started_day"])
    for line in inv["relevant_decisions"]:
        print("  ", line)
    print("How to avoid it:", inv["how_to_avoid"])
else:
    print("Evaluation:", sim.evaluate())
