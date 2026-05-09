from fastapi import APIRouter

from app.api.routes import aoi, datasets, health, version

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(version.router, tags=["meta"])
api_router.include_router(aoi.router, prefix="/aoi", tags=["aoi"])
api_router.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
