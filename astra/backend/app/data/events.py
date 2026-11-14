"""Event library. Phase 2 ships three sample events; Phase 3 grows this to ten or more.

All numbers are game units. Categories are labelled honestly:
NASA_INSPIRED_TRAINING = fictional scenario informed by real science.
"""
from app.services.event_manager import (
    SOURCE_INSPIRED, SOURCE_SIMULATED, Delayed, Event, Option, validate_event,
)

REDUCED_SUNLIGHT = Event(
    id="reduced_sunlight",
    title="Reduced Solar Illumination",
    description=(
        "Near the Moon's South Pole the Sun stays very low in the sky, so long shadows "
        "fall across the solar panels. Your habitat is getting less sunlight for a few days."
    ),
    category="power",
    source=SOURCE_INSPIRED,
    difficulty=2,
    stage=4,
    sunlight_factor=0.4,
    sunlight_days=4,
    options=(
        Option(
            id="reduce_research",
            label="Pause some science",
            description="Saves electricity. Research goes slower until the Sun returns.",
            touches=("research", "power"),
            level_changes={"research_level": -1},
            delayed=(Delayed(4, level_changes={"research_level": 1},
                             note="The Sun is back, so the science team restarts their work."),),
        ),
        Option(
            id="backup_batteries",
            label="Use the backup batteries",
            description="Keeps everything running, but uses up your emergency battery reserve.",
            touches=("battery", "power"),
            immediate={"power": 20, "battery": -25},
            requires={"battery": 25},
        ),
        Option(
            id="reduce_greenhouse",
            label="Slow down the greenhouse",
            description="Saves electricity and water, but the plants grow less food.",
            touches=("greenhouse", "water", "power"),
            level_changes={"greenhouse_level": -1},
            delayed=(Delayed(4, level_changes={"greenhouse_level": 1},
                             note="The greenhouse lights come back on and the plants start growing again."),),
        ),
    ),
    learning=(
        "Solar panels only make power when the Sun shines on them. Engineers plan batteries "
        "and decide which jobs matter most when power is short."
    ),
)

GREENHOUSE_EXPANSION = Event(
    id="greenhouse_expansion",
    title="Greenhouse Expansion Opportunity",
    description=(
        "The crew found room for another growing tray. More plants mean more food, "
        "but plants need electricity and water too."
    ),
    category="food",
    source=SOURCE_SIMULATED,
    difficulty=1,
    stage=2,
    options=(
        Option(
            id="expand",
            label="Add the growing tray",
            description="More food later. Uses more power and water starting now.",
            touches=("greenhouse", "water", "power"),
            immediate={"power": -5},
            level_changes={"greenhouse_level": 1},
        ),
        Option(
            id="expand_with_filter",
            label="Add the tray and a better water filter",
            description="Costs extra power now, but the water recycler works better two days later.",
            touches=("greenhouse", "water", "power"),
            immediate={"power": -10},
            level_changes={"greenhouse_level": 1},
            delayed=(Delayed(2, efficiency={"water": 0.2},
                             note="The new water filter is installed, so the recycler cleans water faster."),),
        ),
        Option(
            id="keep_current",
            label="Keep the greenhouse as it is",
            description="Nothing changes. Safe, but no extra food.",
        ),
    ),
    learning=(
        "Growing food in space is a trade-off: plants use power and water. "
        "A bigger greenhouse only helps if the other systems can keep up."
    ),
)

SOLAR_PARTICLE_WARNING = Event(
    id="solar_particle_warning",
    title="Solar Particle Warning (Training Scenario)",
    description=(
        "Training scenario: mission control warns that fast, tiny particles from the Sun may "
        "reach the Moon. This is a made-up game event inspired by real space weather."
    ),
    category="radiation",
    source=SOURCE_INSPIRED,
    difficulty=2,
    stage=3,
    hazard_severity=0.8,
    hazard_days=3,
    options=(
        Option(
            id="shelter",
            label="Move the crew to the shelter",
            description="Much safer. Greenhouse and science pause while everyone shelters for 3 days.",
            touches=("shelter", "research", "greenhouse"),
            shelter_days=3,
        ),
        Option(
            id="keep_working",
            label="Keep working as normal",
            description="Research and plants keep going, but the crew is exposed to more simulated risk.",
        ),
        Option(
            id="boost_shielding",
            label="Add extra shielding",
            description="Costs power now and gives better protection for the rest of the mission.",
            touches=("shielding", "power"),
            immediate={"shielding": 20, "power": -12},
        ),
    ),
    learning=(
        "Shielding and shelters reduce how much radiation reaches people. "
        "Protecting the crew can mean pausing other work. In this game, the risk number "
        "is simulated and is not a real radiation dose."
    ),
)

HABITAT_ACTIVATION = Event(
    id="habitat_activation",
    title="Switch On the Habitat",
    description=(
        "Welcome, Commander! Your crew has landed. Before the first night you must decide "
        "what the outpost works on first. Every job uses electricity."
    ),
    category="power",
    source=SOURCE_SIMULATED,
    difficulty=1,
    stage=1,
    options=(
        Option(
            id="focus_science",
            label="Start with science",
            description="Research runs faster, but it uses more power.",
            touches=("research", "power"),
            level_changes={"research_level": 1},
        ),
        Option(
            id="focus_food",
            label="Start with the greenhouse",
            description="Plants start growing sooner. They use power and water.",
            touches=("greenhouse", "water", "power"),
            level_changes={"greenhouse_level": 1},
        ),
        Option(
            id="balanced",
            label="Keep things balanced",
            description="Use the standard settings and save some power.",
        ),
    ),
    learning=(
        "Power is shared between life support, plants and science. "
        "Doing more of one job means less power left for the others."
    ),
)

OXYGEN_MAINTENANCE = Event(
    id="oxygen_maintenance",
    title="Oxygen System Check",
    description=(
        "The oxygen generator is due for maintenance. Fixing it takes power and time, "
        "but a dirty filter slowly makes less oxygen."
    ),
    category="life_support",
    source=SOURCE_SIMULATED,
    difficulty=1,
    stage=1,
    options=(
        Option(
            id="maintain_now",
            label="Clean the filters now",
            description="Costs some power today. The generator stays in great shape.",
            touches=("oxygen", "power"),
            immediate={"power": -8},
            efficiency={"oxygen": 0.1},
        ),
        Option(
            id="postpone",
            label="Do it later",
            description="Saves power now, but the filter may get clogged in a few days.",
            touches=("oxygen",),
            delayed=(Delayed(3, efficiency={"oxygen": -0.4},
                             note="The oxygen filter got clogged, so less oxygen is being made."),),
        ),
    ),
    learning=(
        "Machines that keep people alive need regular care. Skipping maintenance saves effort today "
        "and can cause a bigger problem later."
    ),
)

WATER_RECYCLER_MALFUNCTION = Event(
    id="water_recycler_malfunction",
    title="Water Recycler Malfunction",
    description=(
        "A valve in the water recycler is stuck. It still works, but it cleans much less water than before."
    ),
    category="life_support",
    source=SOURCE_SIMULATED,
    difficulty=2,
    stage=2,
    start_efficiency={"water": -0.8},
    options=(
        Option(
            id="repair_now",
            label="Repair it right away",
            description="Costs power today. The recycler is fixed by tomorrow.",
            touches=("water", "power"),
            immediate={"power": -10},
            delayed=(Delayed(1, efficiency={"water": 0.8},
                             note="The valve is fixed and the water recycler is working normally again."),),
        ),
        Option(
            id="cut_greenhouse",
            label="Slow the greenhouse to save water",
            description="Plants use less water, but you will grow less food.",
            touches=("greenhouse", "water"),
            level_changes={"greenhouse_level": -1},
        ),
        Option(
            id="wait_and_see",
            label="Wait and see",
            description="Save your effort. The water reserve may start to shrink.",
        ),
    ),
    learning=(
        "Recycling water saves a huge amount of supplies, but the recycler is a machine "
        "that needs power and repairs."
    ),
)

COMMUNICATION_INTERRUPTION = Event(
    id="communication_interruption",
    title="Communication Interruption",
    description=(
        "The radio link to Earth is fading. Without a good link, your science team "
        "cannot send their data home, so research slows down."
    ),
    category="communication",
    source=SOURCE_SIMULATED,
    difficulty=2,
    stage=2,
    start_efficiency={"comms": -0.6},
    options=(
        Option(
            id="repair_antenna",
            label="Repair the antenna",
            description="Costs power now. The link is fully back in two days.",
            touches=("comms", "power"),
            immediate={"power": -6},
            delayed=(Delayed(2, efficiency={"comms": 0.6},
                             note="The antenna is repaired and the link to Earth is strong again."),),
        ),
        Option(
            id="backup_radio",
            label="Switch to the backup radio",
            description="A weaker link right away for a small power cost.",
            touches=("comms", "power"),
            immediate={"power": -3},
            efficiency={"comms": 0.3},
        ),
        Option(
            id="ignore_comms",
            label="Ignore it for now",
            description="Save power. Research stays slow while the link is weak.",
        ),
    ),
    learning=(
        "Signals between the Moon and Earth take over a second each way, and equipment can fail. "
        "Missions plan backup ways to talk."
    ),
)

RADIATION_SHELTER_INSPECTION = Event(
    id="radiation_shelter_inspection",
    title="Radiation Shelter Inspection",
    description=(
        "It is time to inspect the radiation shelter. A strong shelter protects the crew when the Sun is stormy."
    ),
    category="radiation",
    source=SOURCE_INSPIRED,
    difficulty=1,
    stage=3,
    options=(
        Option(
            id="full_upgrade",
            label="Inspect and reinforce the shelter",
            description="Costs power now, then gives much better protection.",
            touches=("shielding", "power"),
            immediate={"shielding": 20, "power": -8},
        ),
        Option(
            id="quick_check",
            label="Do a quick check",
            description="A small improvement for a very small cost.",
            touches=("shielding", "power"),
            immediate={"shielding": 8, "power": -2},
        ),
        Option(
            id="skip_inspection",
            label="Skip the inspection",
            description="No cost today. Protection stays the same.",
        ),
    ),
    learning=(
        "Shielding is a bit like a thick wall for radiation. Checking and improving it before a storm "
        "is safer than hoping for the best."
    ),
)

DUST_ON_EQUIPMENT = Event(
    id="dust_on_equipment",
    title="Dust on the Solar Panels",
    description=(
        "Fine moon dust is sticking to your solar panels and blocking sunlight. "
        "Dirty panels make less power."
    ),
    category="power",
    source=SOURCE_INSPIRED,
    difficulty=2,
    stage=4,
    start_efficiency={"solar": -0.25},
    options=(
        Option(
            id="clean_now",
            label="Clean the panels now",
            description="Uses power today, but the panels work well again.",
            touches=("solar", "power"),
            immediate={"power": -8},
            efficiency={"solar": 0.25},
        ),
        Option(
            id="clean_later",
            label="Schedule the cleaning robot",
            description="Free, but the panels stay dusty for three more days.",
            touches=("solar", "power"),
            delayed=(Delayed(3, efficiency={"solar": 0.25},
                             note="The cleaning robot finished and the panels are shiny again."),),
        ),
        Option(
            id="ignore_dust",
            label="Leave the dust",
            description="No effort now. Less power every day.",
        ),
    ),
    learning=(
        "Moon dust is sharp and sticky. Real lunar missions have to protect equipment from it "
        "because dirty solar panels collect less sunlight."
    ),
)

BATTERY_SHORTAGE = Event(
    id="battery_shortage",
    title="Battery Reserve Shortage",
    description=(
        "A battery cell failed and part of your emergency reserve is gone. "
        "You need to decide how to rebuild it."
    ),
    category="power",
    source=SOURCE_SIMULATED,
    difficulty=2,
    stage=4,
    start_deltas={"battery": -30},
    options=(
        Option(
            id="charge_now",
            label="Charge the batteries now",
            description="Uses power today to refill part of the reserve.",
            touches=("battery", "power"),
            immediate={"power": -15, "battery": 20},
        ),
        Option(
            id="pause_science_charge",
            label="Pause science and charge slowly",
            description="Saves power now and refills the reserve in three days.",
            touches=("battery", "research", "power"),
            level_changes={"research_level": -1},
            delayed=(Delayed(3, deltas={"battery": 25}, level_changes={"research_level": 1},
                             note="The batteries are recharged and science starts up again."),),
        ),
        Option(
            id="live_without",
            label="Live without the extra reserve",
            description="No cost, but you have less emergency power if something goes wrong.",
        ),
    ),
    learning=(
        "Batteries store energy for dark times. A smaller battery reserve gives engineers fewer choices "
        "in an emergency."
    ),
)

SCIENCE_OPPORTUNITY = Event(
    id="science_opportunity",
    title="Scientific Research Opportunity",
    description=(
        "Your science team found an exciting rock sample. They can study it more quickly "
        "if you give them extra power."
    ),
    category="science",
    source=SOURCE_SIMULATED,
    difficulty=1,
    stage=5,
    options=(
        Option(
            id="big_experiment",
            label="Run a big experiment",
            description="A burst of research now. It uses extra power for a while.",
            touches=("research", "power"),
            immediate={"research": 6, "power": -10},
            level_changes={"research_level": 1},
            delayed=(Delayed(2, level_changes={"research_level": -1},
                             note="The big experiment is finished, so the science team goes back to normal."),),
        ),
        Option(
            id="collect_samples",
            label="Just collect samples",
            description="A small research boost with very little power.",
            touches=("research", "power"),
            immediate={"research": 3, "power": -3},
        ),
        Option(
            id="skip_science",
            label="Save the power",
            description="No extra research. All power stays for the outpost.",
        ),
    ),
    learning=(
        "Science is the reason for going to the Moon, but it must be balanced with keeping the crew safe "
        "and the outpost running."
    ),
)

# ---- Commander-only bonus problems (never appear on the Cadet level) ----
OXYGEN_FILTER_CLOG = Event(
    id="oxygen_filter_clog",
    title="Clogged Air Filter",
    description=(
        "Moon dust has clogged a filter in the oxygen maker. It still works, "
        "but it makes less air than before."
    ),
    category="life_support",
    source=SOURCE_SIMULATED,
    difficulty=2,
    stage=2,
    commander_only=True,
    start_efficiency={"oxygen": -0.3},
    options=(
        Option(
            id="swap_filter",
            label="Swap in the spare filter",
            description="Uses power today, and the air maker works well again.",
            touches=("oxygen", "power"),
            immediate={"power": -6},
            efficiency={"oxygen": 0.3},
        ),
        Option(
            id="clean_by_hand",
            label="Clean it slowly by hand",
            description="Free, but the air maker stays weak for two more days.",
            touches=("oxygen",),
            delayed=(Delayed(2, efficiency={"oxygen": 0.3},
                             note="The filter is clean and the air maker is back to full strength."),),
        ),
        Option(
            id="keep_going",
            label="Keep going for now",
            description="No work today. Less oxygen is made every day.",
        ),
    ),
    learning=(
        "Life support machines need care. A small blockage can quietly cut how much air is made, "
        "so engineers check filters before they become a problem."
    ),
)

GREENHOUSE_BLIGHT = Event(
    id="greenhouse_blight",
    title="Sick Plants",
    description=(
        "Some plants in the greenhouse are getting sick. If nothing is done, "
        "the garden will grow less food."
    ),
    category="food",
    source=SOURCE_SIMULATED,
    difficulty=2,
    stage=4,
    commander_only=True,
    start_efficiency={"greenhouse": -0.3},
    options=(
        Option(
            id="treat_plants",
            label="Treat the plants with clean water",
            description="Uses some water today, and the plants get healthy again.",
            touches=("greenhouse", "water"),
            immediate={"water": -6},
            efficiency={"greenhouse": 0.3},
        ),
        Option(
            id="remove_sick",
            label="Remove the sick plants",
            description="Saves water, but the garden is smaller for a while.",
            touches=("greenhouse",),
            level_changes={"greenhouse_level": -1},
            efficiency={"greenhouse": 0.3},
            delayed=(Delayed(4, level_changes={"greenhouse_level": 1},
                             note="New seedlings have grown and the garden is back to its full size."),),
        ),
        Option(
            id="wait_and_see",
            label="Wait and see",
            description="No work now. The plants may grow less food every day.",
        ),
    ),
    learning=(
        "Growing food in space is delicate. Space farmers watch for plant diseases early, "
        "because a small problem in a closed garden can spread fast."
    ),
)


EVENT_LIBRARY = [
    HABITAT_ACTIVATION, OXYGEN_MAINTENANCE,                                           # stage 1
    GREENHOUSE_EXPANSION, WATER_RECYCLER_MALFUNCTION, COMMUNICATION_INTERRUPTION,     # stage 2
    SOLAR_PARTICLE_WARNING, RADIATION_SHELTER_INSPECTION,                             # stage 3
    REDUCED_SUNLIGHT, BATTERY_SHORTAGE, DUST_ON_EQUIPMENT,                            # stage 4
    SCIENCE_OPPORTUNITY,                                                              # stage 5
    OXYGEN_FILTER_CLOG, GREENHOUSE_BLIGHT,                                            # Commander bonus problems
]

for _event in EVENT_LIBRARY:
    validate_event(_event)
