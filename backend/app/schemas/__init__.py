"""Pydantic models for HTTP request/response bodies (API contract layer)."""

from app.schemas.api import HealthResponse, VersionResponse

__all__ = ["HealthResponse", "VersionResponse"]
