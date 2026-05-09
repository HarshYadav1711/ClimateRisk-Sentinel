from fastapi import APIRouter

from app.config import get_settings
from app.schemas.api import VersionResponse
from app.utils.version_info import package_version

router = APIRouter()


@router.get("/version", response_model=VersionResponse)
def app_version() -> VersionResponse:
    return VersionResponse(
        name=get_settings().app_name,
        version=package_version(),
        api_version="v1",
    )
