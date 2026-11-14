from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ExperimentParams(BaseModel):
    """Slider values. The limits here must match PARAM_INFO in services/experiments.py."""
    model_config = ConfigDict(extra="forbid")      # a misspelled slider name is an error, not silently ignored

    food_production_pct: float = Field(0, ge=-50, le=100)
    solar_power_pct: float = Field(0, ge=-60, le=50)
    water_recycling_pct: float = Field(0, ge=-50, le=50)
    energy_use_pct: float = Field(0, ge=-30, le=50)
    shielding_boost: float = Field(0, ge=0, le=40)


class ExperimentRequest(BaseModel):
    mission_id: Optional[int] = Field(None, description="Copy this mission. Leave empty for a fresh outpost.")
    days: int = Field(7, ge=1, le=10)
    storm: bool = False
    params: ExperimentParams = Field(default_factory=ExperimentParams)
