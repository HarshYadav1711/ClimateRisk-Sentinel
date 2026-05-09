"""API schemas for geospatial analysis runs."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, model_validator


class AnalysisRunRequest(BaseModel):
    """Provide AOI geometry inline **or** reference a stored AOI row."""

    geometry: dict[str, Any] | None = None
    aoi_id: str | None = None

    @model_validator(mode="after")
    def exactly_one_source(self) -> AnalysisRunRequest:
        has_g = self.geometry is not None
        has_i = self.aoi_id is not None
        if has_g == has_i:
            raise ValueError("Provide exactly one of `geometry` or `aoi_id`.")
        return self


class IndicatorDTO(BaseModel):
    key: str
    label: str
    definition: str
    value: float | None = None
    unit: str
    caveat: str | None = None


class InfrastructureDTO(BaseModel):
    roads_length_km: float | None = None
    nearest_waterway_km: float | None = None


class RiskDTO(BaseModel):
    score_0_100: float = Field(..., description="Heuristic exposure index; not a calibrated hazard probability.")
    explanation: str
    component_notes: list[str] = Field(default_factory=list)


class AnalysisRunResponse(BaseModel):
    partial_analysis: bool = Field(
        ...,
        description="True when raster or vector inputs were incomplete — review caveats.",
    )
    caveats: list[str]
    area_km2: float
    indicators: list[IndicatorDTO]
    infrastructure: InfrastructureDTO
    temporal: dict[str, Any]
    risk: RiskDTO
    narrative_summary: str = Field(
        ...,
        description="Human-readable paragraphs suitable for analyst briefing.",
    )
    machine_summary: dict[str, Any] = Field(
        ...,
        description="Structured mirror for dashboards / JSON export.",
    )
