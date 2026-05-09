"""OpenStreetMap-derived proximity metrics via public Overpass API (no geocoding)."""

from __future__ import annotations

from dataclasses import dataclass

import httpx
from pyproj import Geod
from shapely.geometry import LineString, Polygon
from shapely.ops import nearest_points

from app.config import get_settings

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
    except Exception as exc:  # noqa: BLE001
        caveats.append(f"OpenStreetMap Overpass unavailable: {exc}")
        return InfrastructureMetrics(
            roads_length_km=None,
            nearest_waterway_km=None,
            caveats=tuple(caveats),
        )

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
            road_m += _segment_length_m(coords)
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
