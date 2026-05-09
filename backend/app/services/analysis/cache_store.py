"""In-process TTL caches for infrastructure metrics and full analysis reports (AOI fingerprint key)."""

from __future__ import annotations

import copy
import hashlib
import logging
from typing import Any

from shapely.geometry import Polygon

from app.config import get_settings
from app.services.analysis.infrastructure_osm import InfrastructureMetrics, fetch_infrastructure_metrics
from app.services.metadata_cache import TTLCache

_log = logging.getLogger(__name__)

_infra_cache: TTLCache | None = None
_report_cache: TTLCache | None = None


def _infra_ttl_cache() -> TTLCache:
    global _infra_cache
    if _infra_cache is None:
        s = get_settings()
        _infra_cache = TTLCache(
            ttl_seconds=s.analysis_infra_cache_ttl_seconds,
            max_entries=s.analysis_infra_cache_max_entries,
        )
    return _infra_cache


def _report_ttl_cache() -> TTLCache:
    global _report_cache
    if _report_cache is None:
        s = get_settings()
        _report_cache = TTLCache(
            ttl_seconds=s.analysis_report_cache_ttl_seconds,
            max_entries=s.analysis_report_cache_max_entries,
        )
    return _report_cache


def aoi_fingerprint(aoi: Polygon) -> str:
    """Stable SHA-256 of normalized polygon WKB for cache keys."""
    return hashlib.sha256(aoi.wkb).hexdigest()


def get_infrastructure_metrics_cached(aoi: Polygon) -> InfrastructureMetrics:
    key = aoi_fingerprint(aoi)
    cache = _infra_ttl_cache()
    hit = cache.get(key)
    if hit is not None:
        _log.info("infrastructure_cache hit key_prefix=%s", key[:16])
        return hit
    _log.debug("infrastructure_cache miss key_prefix=%s", key[:16])
    m = fetch_infrastructure_metrics(aoi)
    cache.set(key, m)
    return m


def get_cached_analysis_report(aoi: Polygon) -> Any | None:
    key = aoi_fingerprint(aoi)
    raw = _report_ttl_cache().get(key)
    if raw is not None:
        _log.info("analysis_report_cache hit key_prefix=%s", key[:16])
        return copy.deepcopy(raw)
    _log.debug("analysis_report_cache miss key_prefix=%s", key[:16])
    return None


def set_cached_analysis_report(aoi: Polygon, report: Any) -> None:
    key = aoi_fingerprint(aoi)
    _report_ttl_cache().set(key, copy.deepcopy(report))
