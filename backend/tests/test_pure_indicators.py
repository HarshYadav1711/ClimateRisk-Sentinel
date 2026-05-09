import numpy as np

from app.services.analysis.pure_indicators import masked_mean, ndvi, ndwi_green_nir


def test_ndvi_middle_range():
    nir = np.array([[0.3, 0.4], [0.2, np.nan]])
    red = np.array([[0.1, 0.2], [0.1, 0.1]])
    out = ndvi(nir, red)
    assert np.isfinite(out[0, 0])


def test_masked_mean_handles_nan():
    x = np.array([1.0, np.nan, 3.0])
    assert masked_mean(x) == 2.0


def test_ndwi_shape():
    g = np.ones((2, 2)) * 0.2
    n = np.ones((2, 2)) * 0.15
    out = ndwi_green_nir(g, n)
    assert out.shape == (2, 2)
