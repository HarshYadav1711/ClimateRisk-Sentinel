from fastapi import APIRouter, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.models import StoredAOI
from app.db.session import get_engine
from app.schemas.datasets import DatasetSearchRequest, DatasetSearchResponse
from app.services.geometry import (
    GeometryValidationError,
    polygon_from_geojson,
    validate_and_normalize_geojson,
)
from app.services.stac_pc import search_sentinel_items_for_polygon

router = APIRouter()


@router.post("/search", response_model=DatasetSearchResponse)
def search_datasets(body: DatasetSearchRequest, request: Request) -> DatasetSearchResponse:
    """Discover analysis-ready Sentinel-2 L2A scenes from Planetary Computer STAC for the AOI."""
    settings = get_settings()

    if body.aoi_id is not None:
        if not getattr(request.app.state, "db_available", False):
            raise HTTPException(
                status_code=503,
                detail="Database unavailable; cannot resolve `aoi_id`. Start Postgres or pass `geometry`.",
            )
        engine = get_engine()
        with Session(engine) as db:
            row = db.get(StoredAOI, body.aoi_id)
            if row is None:
                raise HTTPException(status_code=404, detail="Unknown `aoi_id`.")
            poly = polygon_from_geojson(row.geojson)
    else:
        assert body.geometry is not None
        try:
            normalized, _warnings = validate_and_normalize_geojson(
                body.geometry,
                max_area_km2=settings.max_aoi_area_km2,
            )
            poly = polygon_from_geojson(normalized)
        except GeometryValidationError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e

    payload = search_sentinel_items_for_polygon(poly)
    return DatasetSearchResponse(
        catalog_url=payload["catalog_url"],
        collection=settings.default_stac_collection,
        bbox={
            "min_lon": payload["bbox"]["min_lon"],
            "min_lat": payload["bbox"]["min_lat"],
            "max_lon": payload["bbox"]["max_lon"],
            "max_lat": payload["bbox"]["max_lat"],
        },
        datetime_range=payload["datetime_range"],
        items=payload["items"],
        cache=str(payload["cache"]),
    )
