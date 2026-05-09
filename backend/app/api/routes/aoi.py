from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.shape import from_shape
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.models import StoredAOI
from app.db.session import get_db
from app.schemas.aoi import (
    AOICreatedResponse,
    AOIMetadata,
    AOIGetResponse,
    AOIPersistRequest,
    ValidateAOIResponse,
)
from app.services.geometry import (
    GeometryValidationError,
    polygon_from_geojson,
    summarize_polygon,
    validate_and_normalize_geojson,
)

router = APIRouter()


@router.post("/validate", response_model=ValidateAOIResponse)
def validate_aoi(payload: AOIPersistRequest):
    """Validate and normalize AOI geometry; does not persist."""
    settings = get_settings()
    try:
        normalized, warnings = validate_and_normalize_geojson(
            payload.geometry,
            max_area_km2=settings.max_aoi_area_km2,
        )
        poly = polygon_from_geojson(normalized)
        meta = summarize_polygon(poly)
        return ValidateAOIResponse(
            normalized_geometry=normalized,
            metadata=AOIMetadata(**meta),
            warnings=warnings,
        )
    except GeometryValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/", response_model=AOICreatedResponse)
def save_aoi(payload: AOIPersistRequest, db: Session = Depends(get_db)):
    """Persist normalized AOI to PostGIS."""
    settings = get_settings()
    try:
        normalized, warnings = validate_and_normalize_geojson(
            payload.geometry,
            max_area_km2=settings.max_aoi_area_km2,
        )
        poly = polygon_from_geojson(normalized)
        meta = summarize_polygon(poly)
        row = StoredAOI(
            label=payload.label,
            geojson=normalized,
            geom=from_shape(poly, srid=4326),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return AOICreatedResponse(
            id=row.id,
            normalized_geometry=normalized,
            metadata=AOIMetadata(**meta),
            warnings=warnings,
        )
    except GeometryValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/{aoi_id}", response_model=AOIGetResponse)
def get_aoi(aoi_id: str, db: Session = Depends(get_db)):
    row = db.get(StoredAOI, aoi_id)
    if row is None:
        raise HTTPException(status_code=404, detail="AOI not found.")
    poly = polygon_from_geojson(row.geojson)
    meta = summarize_polygon(poly)
    return AOIGetResponse(
        id=row.id,
        label=row.label,
        normalized_geometry=row.geojson,
        metadata=AOIMetadata(**meta),
        created_at=row.created_at.isoformat(),
    )
