from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Operational readiness probe."""

    status: str = Field(..., examples=["ok"])
    service: str


class VersionResponse(BaseModel):
    """Deployed artifact identity."""

    name: str
    version: str
    api_version: str = Field(default="v1", description="Stable URL prefix for public endpoints.")
