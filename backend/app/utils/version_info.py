"""Package version resolution for `/version` — prefers installed distribution metadata."""

from __future__ import annotations

from importlib.metadata import PackageNotFoundError, version


def package_version(dist_name: str = "climate-risk-sentinel-api") -> str:
    try:
        return version(dist_name)
    except PackageNotFoundError:
        return "0.0.0-dev"
