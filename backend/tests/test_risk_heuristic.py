"""Heuristic exposure scoring — deterministic, bounded, interpretable components."""

from __future__ import annotations

import pytest

from app.services.analysis.risk_heuristic import RiskWeights, explain_heuristic_score


def test_heuristic_score_bounded():
    score, _, parts = explain_heuristic_score(
        ndbi_mean=0.4,
        road_density_km_per_km2=2.0,
        nearest_waterway_km=1.0,
        ndwi_mean=0.1,
        ndvi_delta=-0.2,
        ndvi_mean_latest=0.1,
        area_km2=100.0,
    )
    assert 0 <= score <= 100
    assert parts


def test_heuristic_empty_inputs():
    score, expl, parts = explain_heuristic_score(
        ndbi_mean=None,
        road_density_km_per_km2=None,
        nearest_waterway_km=None,
        ndwi_mean=None,
        ndvi_delta=None,
        ndvi_mean_latest=None,
        area_km2=50.0,
    )
    assert score >= 0
    assert score <= 100
    assert "Insufficient" in expl or score == 0
    assert parts == []


def test_heuristic_deterministic():
    kwargs = dict(
        ndbi_mean=0.2,
        road_density_km_per_km2=1.0,
        nearest_waterway_km=2.0,
        ndwi_mean=0.0,
        ndvi_delta=-0.1,
        ndvi_mean_latest=0.25,
        area_km2=80.0,
    )
    a = explain_heuristic_score(**kwargs)
    b = explain_heuristic_score(**kwargs)
    assert a[0] == b[0]
    assert a[1] == b[1]
    assert a[2] == b[2]


def test_heuristic_always_within_zero_hundred_extreme_inputs():
    score, _, _ = explain_heuristic_score(
        ndbi_mean=1.0,
        road_density_km_per_km2=100.0,
        nearest_waterway_km=0.0,
        ndwi_mean=1.0,
        ndvi_delta=-1.0,
        ndvi_mean_latest=-1.0,
        area_km2=10.0,
    )
    assert 0 <= score <= 100


def test_vegetation_loss_increases_score_when_ndvi_drops():
    """Negative ΔNDVI contributes via vegetation_loss weight — stronger drop → higher contribution."""
    base = dict(
        ndbi_mean=None,
        road_density_km_per_km2=None,
        nearest_waterway_km=None,
        ndwi_mean=None,
        ndvi_mean_latest=None,
        area_km2=100.0,
    )
    mild = explain_heuristic_score(ndvi_delta=-0.05, **base)[0]
    strong = explain_heuristic_score(ndvi_delta=-0.24, **base)[0]
    assert strong >= mild


def test_water_proximity_closer_water_raises_score():
    """Smaller nearest_waterway_km increases the water proximity term."""
    base = dict(
        ndbi_mean=None,
        road_density_km_per_km2=None,
        ndwi_mean=None,
        ndvi_delta=None,
        ndvi_mean_latest=None,
        area_km2=50.0,
    )
    far = explain_heuristic_score(nearest_waterway_km=5.0, **base)[0]
    near = explain_heuristic_score(nearest_waterway_km=0.1, **base)[0]
    assert near >= far


def test_missing_optional_inputs_do_not_crash():
    score, expl, parts = explain_heuristic_score(
        ndbi_mean=None,
        road_density_km_per_km2=None,
        nearest_waterway_km=None,
        ndwi_mean=None,
        ndvi_delta=None,
        ndvi_mean_latest=None,
        area_km2=1.0,
    )
    assert isinstance(score, float)
    assert isinstance(expl, str)
    assert isinstance(parts, list)


def test_custom_weights_remain_deterministic():
    w = RiskWeights(ndbi=10.0, water_proximity=5.0)
    s1, _, _ = explain_heuristic_score(
        ndbi_mean=0.5,
        nearest_waterway_km=0.5,
        road_density_km_per_km2=None,
        ndwi_mean=None,
        ndvi_delta=None,
        ndvi_mean_latest=None,
        area_km2=10.0,
        weights=w,
    )
    s2, _, _ = explain_heuristic_score(
        ndbi_mean=0.5,
        nearest_waterway_km=0.5,
        road_density_km_per_km2=None,
        ndwi_mean=None,
        ndvi_delta=None,
        ndvi_mean_latest=None,
        area_km2=10.0,
        weights=w,
    )
    assert s1 == s2
    assert 0 <= s1 <= 100
