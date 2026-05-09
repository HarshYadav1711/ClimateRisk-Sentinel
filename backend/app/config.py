"""Application configuration (environment-driven, validated)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ClimateRisk Sentinel API"
    cors_origins: str = ""

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
