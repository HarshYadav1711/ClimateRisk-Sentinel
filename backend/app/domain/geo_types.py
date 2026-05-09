"""
Placeholder domain models for future AOI ingestion, raster/vector processing, and reporting.

These types intentionally avoid framework imports so services can depend on them cleanly.
"""

from __future__ import annotations

from enum import StrEnum
from typing import Any, NamedTuple


class GeoBoundingBox(NamedTuple):
    """WGS84 axis-aligned envelope."""

    min_lon: float
    min_lat: float
    max_lon: float
    max_lat: float


class AnalysisJobState(StrEnum):
    """Lifecycle for an asynchronous analysis job (future worker integration)."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class AreaOfInterest:
    """
    Logical AOI wrapper — extend with validated GeoJSON or PostGIS geometry later.

    Attributes store minimal metadata only for this skeleton.
    """

    __slots__ = ("label", "crs_epsg", "_geojson")

    def __init__(
        self,
        *,
        geojson: dict[str, Any],
        crs_epsg: int = 4326,
        label: str | None = None,
    ) -> None:
        self._geojson = geojson
        self.crs_epsg = crs_epsg
        self.label = label

    @property
    def geojson(self) -> dict[str, Any]:
        return self._geojson


class RasterLayerDescriptor:
    """Reference metadata for a raster layer that analysis pipelines may consume."""

    __slots__ = ("id", "title", "source_hint")

    def __init__(self, *, id: str, title: str, source_hint: str) -> None:
        self.id = id
        self.title = title
        self.source_hint = source_hint


class IndicatorDescriptor:
    """Human-readable definition for a derived spatial indicator (NDVI, proximity, etc.)."""

    __slots__ = ("key", "label", "unit", "description")

    def __init__(self, *, key: str, label: str, unit: str, description: str) -> None:
        self.key = key
        self.label = label
        self.unit = unit
        self.description = description
