import pytest

from app.services import formulas as F


def test_clamp_limits():
    assert F.clamp(-5) == 0
    assert F.clamp(150) == 100
    assert F.clamp(42) == 42


def test_power_generation_is_gmax_times_sunlight_times_efficiency():
    assert F.power_generation(24, 0.5, 0.8) == pytest.approx(9.6)
    assert F.power_generation(24, 0, 1) == 0


def test_power_generation_rejects_negative_inputs():
    with pytest.raises(ValueError):
        F.power_generation(24, -0.1, 1)


def test_next_power_formula_and_limits():
    assert F.next_power(70, 24, 19) == 75
    assert F.next_power(98, 24, 0) == 100      # cannot exceed 100
    assert F.next_power(5, 0, 30) == 0         # cannot go negative


def test_water_oxygen_food_balance_and_limits():
    assert F.next_water(80, 5, 4.5) == 80.5
    assert F.next_oxygen(80, 5, 4.5) == 80.5
    assert F.next_food(70, 3, 2.5) == 70.5
    assert F.next_water(1, 0, 9) == 0
    assert F.next_oxygen(99, 9, 0) == 100
    assert F.next_food(0, 0, 3) == 0


def test_health_loss_recovery_and_limits():
    assert F.next_health(100, 0, 2) == 100
    assert F.next_health(50, 10, 0) == 40
    assert F.next_health(5, 20, 0) == 0


def test_radiation_risk_formula():
    assert F.radiation_risk(0.8, 1.0, 0.4) == pytest.approx(0.48)
    assert F.radiation_risk(0.8, 0.25, 0.4) == pytest.approx(0.12)
    assert F.radiation_risk(0.8, 1.0, 1.0) == 0.0     # perfect shielding
    assert F.radiation_risk(0.0, 1.0, 0.0) == 0.0     # no event


def test_radiation_risk_rejects_values_outside_0_to_1():
    with pytest.raises(ValueError):
        F.radiation_risk(1.5, 1.0, 0.5)
    with pytest.raises(ValueError):
        F.radiation_risk(0.5, 1.0, 40)  # shielding must be normalized (0..1), not 0..100


def test_research_adds_and_never_negative():
    assert F.next_research(10, 2) == 12
    assert F.next_research(1, -5) == 0
