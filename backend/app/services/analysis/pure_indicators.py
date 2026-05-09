"""Pure spectral-index math on reflectance (unitless, scaled Sentinel-2 L2A)."""

from __future__ import annotations

import numpy as np


def ndvi(nir: np.ndarray, red: np.ndarray, eps: float = 1e-6) -> np.ndarray:
    """Normalized Difference Vegetation Index: (NIR - RED) / (NIR + RED)."""
    return (nir - red) / (nir + red + eps)


def ndwi_green_nir(green: np.ndarray, nir_swir: np.ndarray, eps: float = 1e-6) -> np.ndarray:
    """McFeeters NDWI-style moisture/open-water sensitivity using green vs narrow NIR (B8A proxy)."""
    return (green - nir_swir) / (green + nir_swir + eps)


def ndbi(swir: np.ndarray, nir: np.ndarray, eps: float = 1e-6) -> np.ndarray:
    """Normalized Difference Built-up Index (built-up / impervious proxy vs vegetation)."""
    return (swir - nir) / (swir + nir + eps)


def masked_mean(arr: np.ndarray) -> float | None:
    """Mean over finite samples."""
    x = np.asarray(arr, dtype=np.float64)
    mask = np.isfinite(x)
    if not np.any(mask):
        return None
    return float(np.mean(x[mask]))
