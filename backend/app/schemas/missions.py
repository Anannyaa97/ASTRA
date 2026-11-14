"""Request schemas. FastAPI rejects anything that does not match, with a clear 422 error."""
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class StartMissionRequest(BaseModel):
    nickname: str = Field(default="Junior Commander", min_length=1, max_length=40)
    difficulty: Literal["cadet", "storm_season", "the_long_night", "commander"] = "cadet"
    seed: Optional[int] = Field(default=None, ge=0, le=2_147_483_647)

    @field_validator("nickname")
    @classmethod
    def strip_nickname(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("nickname must not be empty")
        return value


class DecisionRequest(BaseModel):
    event_id: str = Field(min_length=1, max_length=60)
    option_id: str = Field(min_length=1, max_length=60)


class PreviewRequest(BaseModel):
    option_id: str = Field(min_length=1, max_length=60)
    horizon_days: int = Field(default=3, ge=1, le=5)
