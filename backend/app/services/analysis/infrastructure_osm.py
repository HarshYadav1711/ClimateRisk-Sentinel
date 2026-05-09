"""OpenStreetMap-derived proximity metrics via public Overpass API (no geocoding)."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass

import httpx
from pyproj import Geod
from shapely.geometry import LineString, Polygon
from shapely.geometry.base import BaseGeometry
from shapely.ops import nearest_points

from app.config import get_settings

_log = logging.getLogger(__name__)

_GEOD = Geod(ellps="WGS84")


def _segment_length_m(coords: list[tuple[float, float]]) -> float:
    if len(coords) < 2:
        return 0.0
    total = 0.0
    for i in range(len(coords) - 1):
        lon1, lat1 = coords[i]
        lon2, lat2 = coords[i + 1]
        _, _, dist = _GEOD.inv(lon1, lat1, lon2, lat2)
        total += abs(dist)
    return total


def _linear_geom_length_m(geom: BaseGeometry) -> float:
    """Great-circle length (m) along LineString / MultiLineString parts; ignores non-linear pieces."""
    if geom.is_empty:
        return 0.0
    gt = geom.geom_type
    if gt == "LineString":
        coords = [(float(x), float(y)) for x, y, *_ in geom.coords]
        return _segment_length_m(coords)
    if gt == "MultiLineString":
        return sum(_linear_geom_length_m(g) for g in geom.geoms)
    if gt == "GeometryCollection":
        return sum(_linear_geom_length_m(g) for g in geom.geoms)
    return 0.0


@dataclass(frozen=True)
class InfrastructureMetrics:
    roads_length_km: float | None
    nearest_waterway_km: float | None
    caveats: tuple[str, ...]


def fetch_infrastructure_metrics(aoi: Polygon) -> InfrastructureMetrics:
    settings = get_settings()
    minx, miny, maxx, maxy = aoi.bounds
    south, west, north, east = miny, minx, maxy, maxx

    query = f"""
    [out:json][timeout:90];
    (
      way["highway"]({south},{west},{north},{east});
      way["waterway"]({south},{west},{north},{east});
    );
    out geom;
    """

    caveats: list[str] = []
    try:
        with httpx.Client(timeout=120.0) as client:
            r = client.post(settings.overpass_url, data={"data": query})
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPStatusError as exc:
        _log.warning("Overpass HTTPStatusError status=%s url=%s", exc.response.status_code, settings.overpass_url)
        caveats.append(f"OpenStreetMap Overpass HTTP error: {exc}")
        return InfrastructureMetrics(
            roads_length_km=None,
            nearest_waterway_km=None,
            caveats=tuple(caveats),
        )
    except httpx.RequestError as exc:
        _log.warning("Overpass RequestError: %s", exc)
        caveats.append(f"OpenStreetMap Overpass unavailable (network): {exc}")
        return InfrastructureMetrics(
            roads_length_km=None,
            nearest_waterway_km=None,
            caveats=tuple(caveats),
        )
    except json.JSONDecodeError as exc:
        _log.warning("Overpass JSONDecodeError: %s", exc)
        caveats.append(f"OpenStreetMap Overpass returned invalid JSON: {exc}")
        return InfrastructureMetrics(
            roads_length_km=None,
            nearest_waterway_km=None,
            caveats=tuple(caveats),
        )

    # Overpass uses the AOI bbox to limit downloads; attributing the *full* length of every way that merely crosses the bbox inflates road density (bbox corners, segments outside the polygon). Clip highways to the AOI for length.
    try:
        aoi_clip = aoi if aoi.is_valid else aoi.buffer(0)
    except Exception:
        aoi_clip = aoi

    elements = data.get("elements", [])
    road_m = 0.0
    water_lines: list[LineString] = []

    for el in elements:
        if el.get("type") != "way":
            continue
        tags = el.get("tags") or {}
        geom = el.get("geometry")
        if not geom:
            continue
        coords = [(float(p["lon"]), float(p["lat"])) for p in geom]
        if len(coords) < 2:
            continue
        if "highway" in tags:
            try:
                line = LineString(coords)
                clipped = line.intersection(aoi_clip)
                road_m += _linear_geom_length_m(clipped)
            except Exception:
                continue
        if "waterway" in tags:
            water_lines.append(LineString(coords))

    roads_km = road_m / 1000.0 if road_m else 0.0

    nearest_km: float | None = None
    if water_lines:
        nearest_m: float | None = None
        for wl in water_lines:
            p1, p2 = nearest_points(aoi, wl)
            _, _, d = _GEOD.inv(p1.x, p1.y, p2.x, p2.y)
            dist_m = abs(d)
            if nearest_m is None or dist_m < nearest_m:
                nearest_m = dist_m
        if nearest_m is not None:
            nearest_km = nearest_m / 1000.0

    if not elements:
        caveats.append("No OSM highway/water ways returned for this bbox — proximity metrics may be incomplete.")

    return InfrastructureMetrics(
        roads_length_km=float(roads_km),
        nearest_waterway_km=nearest_km,
        caveats=tuple(caveats),
    )
