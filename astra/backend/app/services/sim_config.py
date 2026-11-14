"""All tunable numbers for the simulation live here, in one place.

Every value is a normalized educational game unit. None of them are NASA engineering numbers.
The config is frozen (read only) so a running mission can never change it by accident.
The What If? Lab will create modified copies with dataclasses.replace(config, g_max=...).
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class SimConfig:
    mission_days: int = 20
    storm_scale: float = 1.0                 # multiplies the strength of the training solar storm (see sun_service)
    bonus_event_days: tuple = ()             # extra problem days (Commander level)
    start_power: float = 60.0                # starting stock of each supply
    start_oxygen: float = 70.0
    start_water: float = 50.0
    start_food: float = 60.0
    crew_size: int = 4

    # Power
    g_max: float = 23.0                      # maximum solar generation per day
    oxygen_gen_power: float = 6.0            # power the oxygen generator needs per day
    water_recycler_power: float = 5.0
    comms_power: float = 2.0
    greenhouse_power_per_level: float = 3.0
    research_power_per_level: float = 3.0

    # Oxygen
    oxygen_gen_output: float = 5.0
    oxygen_use_per_crew: float = 1.125       # x 4 crew = 4.5 per day

    # Water
    water_recycler_output: float = 5.0
    water_base_use: float = 3.0
    water_per_greenhouse: float = 1.5        # extra water per greenhouse level

    # Food
    greenhouse_food_per_level: float = 3.0
    greenhouse_ramp: float = 0.34            # share of the gap plants close each day (delayed effect)
    food_use: float = 2.5

    # Research
    research_per_level: float = 2.0
    research_goal: float = 30.0              # points needed for the objective

    # Crew health (simplified game mechanic)
    oxygen_low: float = 25.0
    water_low: float = 25.0
    food_low: float = 15.0
    loss_oxygen: float = 6.0
    loss_water: float = 4.0
    loss_food: float = 3.0
    loss_underpowered: float = 3.0
    health_recovery: float = 2.0

    # Simulated radiation risk
    shelter_exposure: float = 0.25           # exposure while crew shelters
    radiation_health_factor: float = 12.0    # converts risk (0..1) into daily health loss

    # Limits
    max_efficiency: float = 1.5
    max_greenhouse_level: int = 3
    max_research_level: int = 2
