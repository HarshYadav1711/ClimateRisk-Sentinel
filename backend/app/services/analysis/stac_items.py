"""Select signed Sentinel-2 L2A STAC items for analysis (deterministic)."""

from __future__ import annotations

import planetary_computer
from pystac import Item
from pystac_client import Client
from shapely.geometry import Polygon

from app.config import Settings, get_settings
from app.services.geometry import bbox_wgs84


def list_signed_items_for_temporal_analysis(
    aoi: Polygon,
    settings: Settings | None = None,
    *,
    max_distinct_dates: int = 2,
) -> list[tuple[Item, str | None]]:
    """
    Return up to `max_distinct_dates` items with distinct calendar days, newest first.

    Each entry is (signed pystac Item, iso datetime or None).
    """
    settings = settings or get_settings()
    catalog = Client.open(settings.stac_catalog_url)
    bbox = bbox_wgs84(aoi)

    search = catalog.search(
        collections=[settings.default_stac_collection],
        bbox=list(bbox),
        datetime=settings.stac_datetime_preset,
        query={"eo:cloud_cover": {"lt": settings.stac_cloud_cover_lt}},
        sortby=[{"field": "datetime", "direction": "desc"}],
        limit=settings.stac_max_items,
    )

    selected: list[tuple[Item, str | None]] = []
    seen_days: set[str] = set()

    for it in search.items():
        dt = it.datetime
        day_key = dt.date().isoformat() if dt else it.id[:10]
        if day_key in seen_days:
            continue
        seen_days.add(day_key)
        signed = planetary_computer.sign(it)
        iso = dt.isoformat() if dt else None
        selected.append((signed, iso))
        if len(selected) >= max_distinct_dates:
            break

    return selected
