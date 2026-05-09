from fastapi import APIRouter, Request

from app.config import get_settings
from app.schemas.api import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=get_settings().app_name,
        database=getattr(request.app.state, "db_available", False),
    )
