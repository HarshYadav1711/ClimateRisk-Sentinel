"""Small in-process TTL cache for deterministic STAC metadata responses."""

from __future__ import annotations

import threading
import time
from typing import Any

from app.config import get_settings


class TTLCache:
    def __init__(self, *, ttl_seconds: int, max_entries: int) -> None:
        self._ttl = ttl_seconds
        self._max = max_entries
        self._data: dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Any | None:
        now = time.monotonic()
        with self._lock:
            entry = self._data.get(key)
            if not entry:
                return None
            expires_at, payload = entry
            if expires_at < now:
                del self._data[key]
                return None
            return payload

    def set(self, key: str, value: Any) -> None:
        now = time.monotonic()
        expires_at = now + self._ttl
        with self._lock:
            self._data[key] = (expires_at, value)
            if len(self._data) > self._max:
                # Drop arbitrary oldest half by insertion order — adequate for metadata caching.
                keys = list(self._data.keys())
                for k in keys[: len(keys) // 2]:
                    self._data.pop(k, None)


def make_stac_cache() -> TTLCache:
    s = get_settings()
    return TTLCache(ttl_seconds=s.metadata_cache_ttl_seconds, max_entries=s.metadata_cache_max_entries)
