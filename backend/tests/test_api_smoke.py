"""FastAPI smoke tests — no external STAC/raster; uses in-process TestClient."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_health_ok(client: TestClient) -> None:
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "service" in body
    assert "database" in body


def test_version_ok(client: TestClient) -> None:
    r = client.get("/api/v1/version")
    assert r.status_code == 200
    body = r.json()
    assert body["api_version"] == "v1"
    assert "version" in body
    assert "name" in body


def test_aoi_validate_happy_path(client: TestClient) -> None:
    payload = {
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-104.98, 39.74],
                    [-104.88, 39.74],
                    [-104.88, 39.82],
                    [-104.98, 39.82],
                    [-104.98, 39.74],
                ]
            ],
        },
    }
    r = client.post("/api/v1/aoi/validate", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["normalized_geometry"]["type"] == "Polygon"
    assert "metadata" in body
    assert "area_km2" in body["metadata"]
    assert body["metadata"]["area_km2"] > 0
