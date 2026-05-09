"""Application configuration (environment-driven, validated)."""

from datetime import UTC, datetime, timedelta
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ClimateRisk Sentinel API"
    cors_origins: str = ""

    database_url: str = "postgresql+psycopg://sentinel:sentinel@127.0.0.1:5432/climate_risk"

    stac_catalog_url: str = "https://planetarycomputer.microsoft.com/api/stac/v1"
    default_stac_collection: str = "sentinel-2-l2a"
    # Optional fixed interval (env STAC_DATETIME_PRESET). When unset, `stac_datetime_range` uses a rolling UTC window.
    stac_datetime_preset: str | None = None
    # Rolling window length when no preset is set — catalogs gain new scenes continuously; a sliding window avoids stale fixed years.
    stac_lookback_days: int = 365
    stac_max_items: int = 25
    stac_cloud_cover_lt: float = 45.0

    max_aoi_area_km2: float = 500_000.0

    analysis_max_aoi_area_km2: float = 75_000.0

    # In-process caches for /analysis/run (same geometry → reuse within TTL).
    analysis_infra_cache_ttl_seconds: int = 300
    analysis_infra_cache_max_entries: int = 128
    analysis_report_cache_ttl_seconds: int = 300
    analysis_report_cache_max_entries: int = 64
    # Wall-clock limit for the blocking analysis pipeline (async wrapper); 0 disables.
    analysis_request_timeout_seconds: float = 300.0

    metadata_cache_ttl_seconds: int = 300
    metadata_cache_max_entries: int = 128

    overpass_url: str = "https://overpass-api.de/api/interpreter"

    @property
    def stac_datetime_range(self) -> str:
        """Effective STAC datetime interval: explicit `STAC_DATETIME_PRESET` or `<UTC today − lookback>/<UTC today>`.

        Rolling bounds stay aligned with catalog updates without editing config each year; pinned presets remain available for reproducible audits.
        """
        if self.stac_datetime_preset is not None:
            preset = self.stac_datetime_preset.strip()
            if preset:
                return preset
        end = datetime.now(UTC).date()
        start = end - timedelta(days=self.stac_lookback_days)
        return f"{start.isoformat()}/{end.isoformat()}"

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
