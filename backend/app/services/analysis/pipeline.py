"""Orchestrate AOI raster KPIs, OSM proximity, heuristic scoring, and narratives."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from shapely.geometry import Polygon

from app.config import Settings, get_settings
from app.services.analysis.infrastructure_osm import InfrastructureMetrics, fetch_infrastructure_metrics
from app.services.analysis.raster_readout import SceneKpis, compute_scene_kpis
from app.services.analysis.risk_heuristic import explain_heuristic_score
from app.services.analysis.stac_items import list_signed_items_for_temporal_analysis
from app.services.analysis.temporal_summary import temporal_block
from app.services.geometry import area_km2_epsg6933


@dataclass
class AnalysisReport:
    """Structured analysis output before Pydantic serialization."""

    area_km2: float
    caveats: list[str] = field(default_factory=list)
    scenes: list[SceneKpis] = field(default_factory=list)
    infrastructure: InfrastructureMetrics | None = None
    temporal: dict[str, Any] = field(default_factory=dict)
    risk_score: float = 0.0
    risk_explanation: str = ""
    risk_components: list[str] = field(default_factory=list)
    narrative_paragraphs: list[str] = field(default_factory=list)


def run_aoi_analysis(aoi: Polygon, settings: Settings | None = None) -> AnalysisReport:
    settings = settings or get_settings()
    report = AnalysisReport(area_km2=area_km2_epsg6933(aoi))

    if report.area_km2 > settings.analysis_max_aoi_area_km2:
        report.caveats.append(
            f"AOI area {report.area_km2:.0f} km² exceeds analysis limit "
            f"{settings.analysis_max_aoi_area_km2:.0f} km² — "
            "skipping raster downloads; infrastructure metrics still computed."
        )
        infra = fetch_infrastructure_metrics(aoi)
        report.infrastructure = infra
        report.caveats.extend(list(infra.caveats))
        rd = (
            infra.roads_length_km / report.area_km2
            if infra.roads_length_km is not None and report.area_km2 > 0
            else None
        )
        score, expl, parts = explain_heuristic_score(
            ndbi_mean=None,
            road_density_km_per_km2=rd,
            nearest_waterway_km=infra.nearest_waterway_km,
            ndwi_mean=None,
            ndvi_delta=None,
            ndvi_mean_latest=None,
            area_km2=report.area_km2,
        )
        report.risk_score = score
        report.risk_explanation = expl
        report.risk_components = parts
        report.narrative_paragraphs = _narrative(report, raster_skipped=True)
        return report

    infra = fetch_infrastructure_metrics(aoi)
    report.infrastructure = infra
    report.caveats.extend(list(infra.caveats))

    signed_items = list_signed_items_for_temporal_analysis(aoi, settings)
    if not signed_items:
        report.caveats.append(
            "No Sentinel-2 L2A items matched the STAC query for this AOI/date/cloud filters."
        )
    scenes: list[SceneKpis] = []
    for signed_item, _iso in signed_items:
        kpis = compute_scene_kpis(aoi, signed_item)
        if kpis is None:
            report.caveats.append(
                f"Could not derive band statistics for scene {signed_item.id} "
                "(missing assets, network, or unreadable COG window)."
            )
            continue
        scenes.append(kpis)

    report.scenes = scenes
    report.temporal = temporal_block(scenes)

    latest = scenes[0] if scenes else None
    ndvi_delta = report.temporal.get("ndvi_delta")

    rd = (
        infra.roads_length_km / report.area_km2
        if infra.roads_length_km is not None and report.area_km2 > 0
        else None
    )

    score, expl, parts = explain_heuristic_score(
        ndbi_mean=latest.ndbi_mean if latest else None,
        road_density_km_per_km2=rd,
        nearest_waterway_km=infra.nearest_waterway_km,
        ndwi_mean=latest.ndwi_mean if latest else None,
        ndvi_delta=ndvi_delta if isinstance(ndvi_delta, (int, float)) else None,
        ndvi_mean_latest=latest.ndvi_mean if latest else None,
        area_km2=report.area_km2,
    )
    report.risk_score = score
    report.risk_explanation = expl
    report.risk_components = parts
    report.narrative_paragraphs = _narrative(report, raster_skipped=False)
    return report


def _narrative(report: AnalysisReport, *, raster_skipped: bool) -> list[str]:
    paras: list[str] = []
    paras.append(
        "This output is a **heuristic screening blend**, not a calibrated prediction of "
        "financial loss or structural failure."
    )
    paras.append(
        f"AOI footprint covers approximately **{report.area_km2:,.1f} km²** "
        "(equal-area projection EPSG:6933)."
    )
    if report.infrastructure:
        inf = report.infrastructure
        nw = inf.nearest_waterway_km
        nw_txt = f"{nw:.2f} km" if nw is not None else "n/a (no mapped water nearby)"
        paras.append(
            "OpenStreetMap-derived context: "
            f"mapped highway length summed inside query extent ≈ **{inf.roads_length_km or 0:.2f} km**; "
            f"nearest mapped stream/waterway distance ≈ **{nw_txt}** "
            "(geodesic — OSM completeness varies)."
        )
    if raster_skipped:
        paras.append(
            "Raster vegetation/water/built proxies were **not computed** due to AOI size limits."
        )
    elif report.scenes:
        sc = report.scenes[0]
        paras.append(
            f"Latest Sentinel-2 summary ({sc.datetime}): "
            f"mean NDVI≈{sc.ndvi_mean}, NDWI≈{sc.ndwi_mean}, NDBI≈{sc.ndbi_mean} "
            "(dimensionless indices; cloud/shadow can bias pixels)."
        )
    else:
        paras.append("Raster indicators were **partially or fully unavailable** — see caveats.")

    if report.temporal.get("ndvi_delta") is not None:
        paras.append(report.temporal.get("summary_sentence", ""))

    paras.append(
        f"Heuristic exposure index: **{report.risk_score:.1f} / 100** — {report.risk_explanation}"
    )
    return [p for p in paras if p.strip()]
