"""HTTP API contracts for AOI and STAC dataset discovery."""

from typing import Any

from pydantic import BaseModel, Field


class PolygonGeometryPayload(BaseModel):
    """GeoJSON Polygon geometry (type + coordinates only)."""

    type: str = Field(default="Polygon")
    coordinates: list[list[list[float]]]


class AOIPersistRequest(BaseModel):
    geometry: dict[str, Any]
    label: str | None = Field(default=None, max_length=256)


class AOIMetadata(BaseModel):
    bbox: dict[str, float]
    centroid: dict[str, float]
    area_km2: float
    vertex_count_exterior: int


class ValidateAOIResponse(BaseModel):
    normalized_geometry: dict[str, Any]
    metadata: AOIMetadata
    warnings: list[str] = Field(default_factory=list)


class AOICreatedResponse(BaseModel):
    id: str
    normalized_geometry: dict[str, Any]
    metadata: AOIMetadata
    warnings: list[str] = Field(default_factory=list)


class AOIGetResponse(BaseModel):
    id: str
    label: str | None
    normalized_geometry: dict[str, Any]
    metadata: AOIMetadata
    created_at: str
