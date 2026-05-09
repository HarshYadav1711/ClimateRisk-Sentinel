from app.services.analysis.raster_readout import SceneKpis
from app.services.analysis.temporal_summary import ndvi_delta_between_scenes, temporal_block


def test_ndvi_delta_basic():
    newer = SceneKpis("a", "t2", 0.5, 0.0, 0.1)
    older = SceneKpis("b", "t1", 0.6, 0.0, 0.1)
    d, _ = ndvi_delta_between_scenes(newer, older)
    assert d is not None and abs(d - (-0.1)) < 1e-12


def test_temporal_block_single_scene():
    out = temporal_block([SceneKpis("x", None, 0.2, None, None)])
    assert out["ndvi_delta"] is None
