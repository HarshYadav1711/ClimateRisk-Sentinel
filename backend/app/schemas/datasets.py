from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, model_validator


class DatasetSearchRequest(BaseModel):
    """Supply either inline normalized geometry or a previously stored AOI id."""

    geometry: dict[str, Any] | None = None
    aoi_id: str | None = None

    @model_validator(mode="after")
    def one_source(self) -> DatasetSearchRequest:
        has_g = self.geometry is not None
        has_id = self.aoi_id is not None
        if has_g == has_id:
            raise ValueError("Provide exactly one of `geometry` or `aoi_id`.")
        return self


class DatasetSearchResponse(BaseModel):
    catalog_url: str
    collection: str
    bbox: dict[str, float]
    datetime_range: str
    items: list[dict[str, Any]]
    cache: str
