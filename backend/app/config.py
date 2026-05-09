"""Application configuration (environment-driven, validated)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ClimateRisk Sentinel API"
    cors_origins: str = ""

    database_url: str = "postgresql+psycopg://sentinel:sentinel@127.0.0.1:5432/climate_risk"

    stac_catalog_url: str = "https://planetarycomputer.microsoft.com/api/stac/v1"
    default_stac_collection: str = "sentinel-2-l2a"
    stac_datetime_preset: str = "2024-01-01/2025-12-31"
    stac_max_items: int = 25
    stac_cloud_cover_lt: float = 45.0

    max_aoi_area_km2: float = 500_000.0

    analysis_max_aoi_area_km2: float = 75_000.0

    metadata_cache_ttl_seconds: int = 300
    metadata_cache_max_entries: int = 128

    overpass_url: str = "https://overpass-api.de/api/interpreter"

    @property
    def cors_origin_list(self) -> list[str]:
        raw = self.cors_origins.strip()
        if not raw:
            return [
                "http://127.0.0.1:5173",
                "http://localhost:5173",
            ]
        return [part.strip() for part in raw.split(",") if part.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
