import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.models import StoredAOI
from app.db.session import get_engine
from app.schemas.analysis import (
    AnalysisRunRequest,
    AnalysisRunResponse,
    IndicatorDTO,
    InfrastructureDTO,
    RiskDTO,
)
from app.services.analysis.pipeline import run_aoi_analysis
from app.services.analysis.presentation import build_indicator_rows, machine_readable_bundle
from app.services.geometry import (
    GeometryValidationError,
    polygon_from_geojson,
    validate_and_normalize_geojson,
)

router = APIRouter()
_log = logging.getLogger(__name__)


@router.post("/run", response_model=AnalysisRunResponse)
async def execute_analysis(body: AnalysisRunRequest, request: Request) -> AnalysisRunResponse:
    settings = get_settings()

    if body.aoi_id is not None:
        if not getattr(request.app.state, "db_available", False):
            raise HTTPException(status_code=503, detail="Database unavailable — cannot resolve `aoi_id`.")
        engine = get_engine()
        with Session(engine) as db:
            row = db.get(StoredAOI, body.aoi_id)
            if row is None:
                raise HTTPException(status_code=404, detail="Unknown `aoi_id`.")
            poly = polygon_from_geojson(row.geojson)
    else:
        assert body.geometry is not None
        try:
            normalized, _ = validate_and_normalize_geojson(
                body.geometry,
                max_area_km2=settings.max_aoi_area_km2,
            )
            poly = polygon_from_geojson(normalized)
        except GeometryValidationError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e

    timeout = settings.analysis_request_timeout_seconds
    try:
        if timeout and timeout > 0:
            report = await asyncio.wait_for(asyncio.to_thread(run_aoi_analysis, poly), timeout=timeout)
        else:
            report = await asyncio.to_thread(run_aoi_analysis, poly)
    except asyncio.TimeoutError:
        _log.warning("analysis run timed out after %.1fs", timeout)
        raise HTTPException(status_code=504, detail="Analysis timed out.") from None

    indicators = [IndicatorDTO(**row) for row in build_indicator_rows(report)]
    infra = report.infrastructure
    partial = len(report.scenes) == 0 or any("skipping raster" in c.lower() for c in report.caveats)

    narrative = "\n\n".join(report.narrative_paragraphs)

    return AnalysisRunResponse(
        partial_analysis=partial,
        caveats=report.caveats,
        area_km2=report.area_km2,
        indicators=indicators,
        infrastructure=InfrastructureDTO(
            roads_length_km=infra.roads_length_km if infra else None,
            nearest_waterway_km=infra.nearest_waterway_km if infra else None,
        ),
        temporal=report.temporal,
        risk=RiskDTO(
            score_0_100=report.risk_score,
            explanation=report.risk_explanation,
            component_notes=report.risk_components,
        ),
        narrative_summary=narrative,
        machine_summary=machine_readable_bundle(report),
    )
