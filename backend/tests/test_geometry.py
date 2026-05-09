"""Tests for `app.services.geometry` — normalization, validation, and AOI limits (no HTTP)."""

from __future__ import annotations

import pytest
from shapely.geometry import Polygon

from app.services.geometry import GeometryValidationError, validate_and_normalize_geojson

# Small landmark footprint (~few km²); ring explicitly closed.
_VALID_DENVER_BOX = {
    "type": "Polygon",
    "coordinates": [
        [
            [-104.98, 39.74],
            [-104.88, 39.74],
            [-104.88, 39.82],
            [-104.98, 39.82],
            [-104.98, 39.74],
        ]
    ],
}

# Same footprint without repeating the first vertex at the end — normalize_polygon auto-closes.
_UNCLOSED_DENVER_BOX = {
    "type": "Polygon",
    "coordinates": [
        [
            [-104.98, 39.74],
            [-104.88, 39.74],
            [-104.88, 39.82],
            [-104.98, 39.82],
        ]
    ],
}

# Classic bowtie self-intersection (invalid topology).
_BOWTIE = {
    "type": "Polygon",
    "coordinates": [[[0.0, 0.0], [1.0, 1.0], [1.0, 0.0], [0.0, 1.0], [0.0, 0.0]]],
}

# Large quad (~2° × 2° at mid-latitudes → area far above a tight km² cap).
_LARGE_BOX = {
    "type": "Polygon",
    "coordinates": [
        [
            [-106.0, 39.0],
            [-104.0, 39.0],
            [-104.0, 41.0],
            [-106.0, 41.0],
            [-106.0, 39.0],
        ]
    ],
}


def test_valid_polygon_normalizes_and_returns_geojson():
    normalized, warnings = validate_and_normalize_geojson(_VALID_DENVER_BOX, max_area_km2=500_000.0)
    assert normalized["type"] == "Polygon"
    # mapping() uses tuples; structure matches GeoJSON nesting.
    coords = normalized["coordinates"]
    assert len(coords) >= 1
    ring = coords[0]
    assert len(ring) >= 4
    assert ring[0] == ring[-1]


def test_auto_closing_ring_emits_warning_or_closed_output():
    normalized, warnings = validate_and_normalize_geojson(_UNCLOSED_DENVER_BOX, max_area_km2=500_000.0)
    ring = normalized["coordinates"][0]
    assert ring[0] == ring[-1]
    assert any("closed" in w.lower() for w in warnings) or len(ring) >= 4


def test_self_intersection_repaired_with_warning():
    # Bowtie is invalid; normalize_polygon uses buffer(0) and records a repair warning when fixed.
    normalized, warnings = validate_and_normalize_geojson(_BOWTIE, max_area_km2=500_000.0)
    assert normalized["type"] == "Polygon"
    assert any("repair" in w.lower() for w in warnings)


def test_zero_area_collinear_ring_rejected():
    """Degenerate exterior should not yield a positive-area AOI."""
    collinear = {
        "type": "Polygon",
        "coordinates": [[[0.0, 0.0], [2.0, 0.0], [1.0, 0.0], [0.0, 0.0]]],
    }
    with pytest.raises(GeometryValidationError):
        validate_and_normalize_geojson(collinear, max_area_km2=500_000.0)


def test_oversized_aoi_rejected():
    with pytest.raises(GeometryValidationError) as exc_info:
        validate_and_normalize_geojson(_LARGE_BOX, max_area_km2=100.0)
    assert "exceeds" in str(exc_info.value).lower()


def test_normalize_polygon_roundtrip_area_positive():
    normalized, _ = validate_and_normalize_geojson(_VALID_DENVER_BOX, max_area_km2=500_000.0)
    poly = Polygon(normalized["coordinates"][0])
    assert poly.is_valid
    assert poly.area > 0
