"""Serialize pipeline outputs into API-facing structures with explicit definitions."""

from __future__ import annotations

from typing import Any

from app.services.analysis.pipeline import AnalysisReport
from app.services.analysis.raster_readout import SceneKpis

DEFINITIONS: dict[str, tuple[str, str, str]] = {
    "ndvi_mean": (
        "Vegetation greenness proxy",
        "Mean NDVI ((NIR−RED)/(NIR+RED)) over AOI pixels on latest usable Sentinel-2 scene.",
        "index",
    ),
    "ndwi_mean": (
        "Surface wetness / open water sensitivity",
        "Mean green-vs-NIR moisture index (McFeeters-style) — higher often indicates wet surfaces.",
        "index",
    ),
    "ndbi_mean": (
        "Built-up / impervious sensitivity",
        "Mean SWIR-vs-NIR built-up index — higher suggests more developed surfaces mixed into pixels.",
        "index",
    ),
    "ndvi_delta": (
        "Vegetation change between acquisitions",
        "Difference of mean NDVI (newer − older distinct acquisition); negative ⇒ lower greenness on newer date.",
        "Δ index",
    ),
    "road_density": (
        "Mapped highway exposure density",
        "OSM `highway=*` way length inside AOI bbox divided by AOI area (mapping completeness varies).",
        "km / km²",
    ),
    "waterway_distance": (
        "Nearest mapped linear water feature",
        "Geodesic distance from AOI polygon to nearest OSM `waterway` geometry inside bbox query.",
        "km",
    ),
}


def build_indicator_rows(report: AnalysisReport) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    latest = report.scenes[0] if report.scenes else None
    nd = report.temporal.get("ndvi_delta")

    def add(key: str, value: float | None, caveat: str | None = None) -> None:
        label, definition, unit = DEFINITIONS[key]
        rows.append(
            {
                "key": key,
                "label": label,
                "definition": definition,
                "value": value,
                "unit": unit,
                "caveat": caveat,
            }
        )

    if latest:
        add(
            "ndvi_mean",
            latest.ndvi_mean,
            None if latest.ndvi_mean is not None else "No finite NDVI pixels after masking.",
        )
        add(
            "ndwi_mean",
            latest.ndwi_mean,
            None if latest.ndwi_mean is not None else "No finite NDWI pixels after masking.",
        )
        add(
            "ndbi_mean",
            latest.ndbi_mean,
            None if latest.ndbi_mean is not None else "No finite NDBI pixels after masking.",
        )
    else:
        add(
            "ndvi_mean",
            None,
            "Raster statistics unavailable — see caveats.",
        )
        add("ndwi_mean", None, "Raster statistics unavailable — see caveats.")
        add("ndbi_mean", None, "Raster statistics unavailable — see caveats.")

    if isinstance(nd, (int, float)):
        add("ndvi_delta", float(nd), None)
    else:
        add("ndvi_delta", None, report.temporal.get("summary_sentence"))

    inf = report.infrastructure
    rd = (
        inf.roads_length_km / report.area_km2
        if inf and inf.roads_length_km is not None and report.area_km2 > 0
        else None
    )
    add(
        "road_density",
        rd,
        None if rd is not None else "Road length or AOI area unavailable.",
    )
    add(
        "waterway_distance",
        inf.nearest_waterway_km if inf else None,
        None if inf and inf.nearest_waterway_km is not None else "No mapped water lines returned.",
    )

    return rows


def scenes_public_payload(scenes: list[SceneKpis]) -> list[dict[str, Any]]:
    return [s.as_dict() for s in scenes]


def machine_readable_bundle(report: AnalysisReport) -> dict[str, Any]:
    return {
        "area_km2": report.area_km2,
        "caveats": report.caveats,
        "scenes_evaluated": scenes_public_payload(report.scenes),
        "temporal": report.temporal,
        "risk_score": report.risk_score,
        "risk_explanation": report.risk_explanation,
        "risk_components": report.risk_components,
        "infrastructure": {
            "roads_length_km": report.infrastructure.roads_length_km if report.infrastructure else None,
            "nearest_waterway_km": report.infrastructure.nearest_waterway_km
            if report.infrastructure
            else None,
        },
    }
