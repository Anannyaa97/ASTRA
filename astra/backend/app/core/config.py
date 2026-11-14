"""Central configuration, loaded from environment variables / .env file."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ASTRA"
    app_version: str = "0.1.0"
    database_url: str = "sqlite:///./astra.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    nasa_api_key: str = "DEMO_KEY"
    # Official DONKI web service (moved to this address on 30 Sep 2026, see
    # https://ccmc.gsfc.nasa.gov/news/major-updates/). Kept in settings so a future move is a one-line change.
    donki_base_url: str = "https://ccmc.gsfc.nasa.gov/DONKI-API/get"
    donki_timeout_seconds: float = 8.0
    # NASA OSDR RadLab: real dose-rate readings from instruments on the International Space Station.
    radlab_base_url: str = "https://visualization.osdr.nasa.gov/radlab/api/"
    radlab_timeout_seconds: float = 20.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
