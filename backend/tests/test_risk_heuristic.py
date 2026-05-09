from app.services.analysis.risk_heuristic import explain_heuristic_score


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
    assert "Insufficient" in expl or score == 0
