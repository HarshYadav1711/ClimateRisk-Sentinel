"""Polygon parsing, normalization, and AOI metrics on WGS84 (EPSG:4326)."""

from __future__ import annotations

from typing import Any

import geopandas as gpd
from shapely.geometry import Polygon, mapping, shape
from shapely.validation import explain_validity


class GeometryValidationError(ValueError):
    """Raised when user-supplied geometry cannot be normalized into a valid AOI."""


def polygon_from_geojson(geom: dict[str, Any]) -> Polygon:
    """Parse GeoJSON geometry dict; must be a single Polygon."""
    if geom.get("type") != "Polygon":
        raise GeometryValidationError("Geometry must be a GeoJSON Polygon.")
    g = shape(geom)
    if not isinstance(g, Polygon):
        raise GeometryValidationError("Only Polygon geometries are supported.")
    return g


def normalize_polygon(poly: Polygon) -> tuple[Polygon, list[str]]:
    """
    Close rings, attempt minimal repair, enforce consistent orientation.

    Returns (polygon, warnings).
    """
    warnings: list[str] = []

    if poly.is_empty:
        raise GeometryValidationError("Polygon is empty.")

    if not poly.is_valid:
        reason = explain_validity(poly)
        repaired = poly.buffer(0)
        if not isinstance(repaired, Polygon) or repaired.is_empty or not repaired.is_valid:
            raise GeometryValidationError(
                f"Invalid polygon geometry ({reason}). Could not repair automatically."
            )
        poly = repaired
        warnings.append("Geometry was topologically repaired (buffer(0)); verify intent.")

    exterior_ring = list(poly.exterior.coords)
    if len(exterior_ring) < 4:
        raise GeometryValidationError(
            "Polygon exterior ring needs at least four positions (including closing point)."
        )

    # Ensure closed ring
    if exterior_ring[0] != exterior_ring[-1]:
        exterior_ring.append(exterior_ring[0])
        warnings.append("Exterior ring auto-closed by repeating the first vertex.")

    poly = Polygon(exterior_ring)

    if not poly.is_valid:
        raise GeometryValidationError("Polygon remains invalid after normalization.")

    return poly, warnings


def area_km2_epsg6933(poly: Polygon) -> float:
    """Geodesic-area friendly equal-area projection (EPSG:6933)."""
    s = gpd.GeoSeries([poly], crs="EPSG:4326").to_crs("EPSG:6933")
    return float(s.area.iloc[0] / 1e6)


def bbox_wgs84(poly: Polygon) -> tuple[float, float, float, float]:
    return poly.bounds


def polygon_geojson(poly: Polygon) -> dict[str, Any]:
    gj = mapping(poly)
    if gj["type"] != "Polygon":
        raise GeometryValidationError("Internal error: expected Polygon mapping.")
    return gj


def validate_and_normalize_geojson(
    geometry: dict[str, Any],
    *,
    max_area_km2: float,
) -> tuple[dict[str, Any], list[str]]:
    """
    Full pipeline from client GeoJSON to normalized Polygon GeoJSON + warnings.

    Raises GeometryValidationError on failure.
    """
    raw = polygon_from_geojson(geometry)
    normalized_poly, warnings = normalize_polygon(raw)
    area = area_km2_epsg6933(normalized_poly)
    if area <= 0:
        raise GeometryValidationError("Polygon has zero area.")
    if area > max_area_km2:
        raise GeometryValidationError(
            f"AOI area {area:.1f} km² exceeds configured maximum {max_area_km2:.1f} km²."
        )
    return polygon_geojson(normalized_poly), warnings


def summarize_polygon(poly: Polygon) -> dict[str, Any]:
    minx, miny, maxx, maxy = bbox_wgs84(poly)
    centroid = poly.centroid
    return {
        "bbox": {"min_lon": minx, "min_lat": miny, "max_lon": maxx, "max_lat": maxy},
        "centroid": {"lon": centroid.x, "lat": centroid.y},
        "area_km2": round(area_km2_epsg6933(poly), 6),
        "vertex_count_exterior": len(poly.exterior.coords) - 1,
    }
