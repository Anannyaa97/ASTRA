"""Pure maths for the ASTRA simulation (spec section 10).

No database, no web code, no state: every function takes numbers and returns a number.
All values are normalized EDUCATIONAL GAME UNITS (0-100), not NASA measurements.
"""


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    """Keep a value between low and high."""
    return max(low, min(high, value))


def power_generation(g_max: float, sunlight: float, efficiency: float) -> float:
    """G = G_max x S x E"""
    if g_max < 0 or sunlight < 0 or efficiency < 0:
        raise ValueError("g_max, sunlight and efficiency must not be negative")
    return g_max * sunlight * efficiency


def next_power(power: float, generated: float, consumed: float) -> float:
    """P_next = clamp(P + G - C, 0, 100)"""
    return clamp(power + generated - consumed)


def next_water(water: float, recycled: float, used: float) -> float:
    """W_next = clamp(W + R - D, 0, 100)"""
    return clamp(water + recycled - used)


def next_oxygen(oxygen: float, produced: float, used: float) -> float:
    """O_next = clamp(O + Q - B, 0, 100)"""
    return clamp(oxygen + produced - used)


def next_food(food: float, produced: float, used: float) -> float:
    """F_next = clamp(F + Y - C_f, 0, 100)"""
    return clamp(food + produced - used)


def next_health(health: float, loss: float, recovery: float) -> float:
    """H_next = clamp(H - L + R_h, 0, 100). A simplified game mechanic, not a medical model."""
    return clamp(health - loss + recovery)


def radiation_risk(event_severity: float, exposure: float, shielding: float) -> float:
    """R_risk = E_event x V_exposure x (1 - Sh)

    All inputs are normalized 0..1. This is a SIMULATED radiation-risk indicator.
    It is NOT an astronaut dose measurement and is never derived from real DONKI data.
    """
    for name, value in (("event_severity", event_severity), ("exposure", exposure), ("shielding", shielding)):
        if not 0.0 <= value <= 1.0:
            raise ValueError(f"{name} must be between 0 and 1, got {value}")
    return event_severity * exposure * (1.0 - shielding)


def next_research(research: float, contribution: float) -> float:
    """RP_next = RP + S_c  (never below zero)"""
    return max(0.0, research + contribution)
