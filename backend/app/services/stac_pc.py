"""Microsoft Planetary Computer STAC search — deterministic, reproducible query parameters."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from pystac_client import Client

from app.config import Settings, get_settings
from app.services.geometry import bbox_wgs84
from app.services.metadata_cache import make_stac_cache
from shapely.geometry import Polygon, shape

_cache = make_stac_cache()


def _bbox_key(bbox: tuple[float, float, float, float]) -> tuple[float, float, float, float]:
    return tuple(round(x, 6) for x in bbox)


def search_sentinel_items_for_polygon(
    poly: Polygon,
    settings: Settings | None = None,
    *,
    use_cache: bool = True,
) -> dict[str, Any]:
    settings = settings or get_settings()
    bbox = bbox_wgs84(poly)
    bbox_r = _bbox_key(bbox)

    cache_key_raw = {
        "catalog": settings.stac_catalog_url,
        "collection": settings.default_stac_collection,
        "bbox": bbox_r,
        "datetime": settings.stac_datetime_preset,
        "limit": settings.stac_max_items,
        "cloud_lt": settings.stac_cloud_cover_lt,
    }
    key = hashlib.sha256(json.dumps(cache_key_raw, sort_keys=True).encode()).hexdigest()

    if use_cache:
        hit = _cache.get(key)
        if hit is not None:
            hit = dict(hit)
            hit["cache"] = "hit"
            return hit

    catalog = Client.open(settings.stac_catalog_url)
    search = catalog.search(
        collections=[settings.default_stac_collection],
        bbox=list(bbox),
        datetime=settings.stac_datetime_preset,
        query={"eo:cloud_cover": {"lt": settings.stac_cloud_cover_lt}},
        sortby=[{"field": "datetime", "direction": "desc"}],
        limit=settings.stac_max_items,
    )

    items: list[dict[str, Any]] = []
    for it in search.items():
        cc = None
        if it.properties and "eo:cloud_cover" in it.properties:
            cc = float(it.properties["eo:cloud_cover"])
        items.append(
            {
                "id": it.id,
                "datetime": it.datetime.isoformat() if it.datetime else None,
                "bbox": list(it.bbox) if it.bbox else None,
                "cloud_cover": cc,
                "collection": settings.default_stac_collection,
            }
        )

    payload = {
        "catalog_url": settings.stac_catalog_url,
        "collection": settings.default_stac_collection,
        "bbox": {"min_lon": bbox_r[0], "min_lat": bbox_r[1], "max_lon": bbox_r[2], "max_lat": bbox_r[3]},
        "datetime_range": settings.stac_datetime_preset,
        "items": items,
        "cache": "miss",
    }

    if use_cache:
        _cache.set(key, dict(payload))

    return payload


def search_from_geojson_polygon(geometry: dict[str, Any]) -> dict[str, Any]:
    g = shape(geometry)
    if not isinstance(g, Polygon):
        raise ValueError("Geometry must be a Polygon.")
    return search_sentinel_items_for_polygon(g)
