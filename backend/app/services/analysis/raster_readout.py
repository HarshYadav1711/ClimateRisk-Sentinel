"""Raster statistics over AOI — Sentinel-2 L2A bands via signed COGs."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import rasterio
import xarray as xr
from pystac import Item
from rasterio.mask import mask
from rasterio.warp import Resampling, reproject, transform_geom

from app.services.analysis.pure_indicators import masked_mean, ndbi, ndvi, ndwi_green_nir


def _geom_mask_transform(href: str, polygon_wgs84: Polygon) -> tuple[np.ndarray, Any, Any]:
    with rasterio.open(href) as src:
        geom_src = transform_geom("EPSG:4326", src.crs.to_string(), mapping(polygon_wgs84))
        out, out_transform = mask(src, [geom_src], crop=True, filled=False)
        arr = np.ma.masked_invalid(out[0].astype(np.float32))
        arr = np.ma.masked_where(arr == 0, arr)
        return arr, out_transform, src.crs


def _reproject_to_match(
    src_arr: np.ma.MaskedArray,
    src_transform: rasterio.Affine,
    src_crs: rasterio.crs.CRS,
    dst_shape: tuple[int, int],
    dst_transform: rasterio.Affine,
    dst_crs: rasterio.crs.CRS,
) -> np.ma.MaskedArray:
    dst = np.full(dst_shape, np.nan, dtype=np.float32)
    reproject(
        source=src_arr.filled(np.nan),
        destination=dst,
        src_transform=src_transform,
        src_crs=src_crs,
        dst_transform=dst_transform,
        dst_crs=dst_crs,
        resampling=Resampling.bilinear,
    )
    return np.ma.masked_invalid(dst)


@dataclass(frozen=True)
class SceneKpis:
    scene_id: str
    datetime: str | None
    ndvi_mean: float | None
    ndwi_mean: float | None
    ndbi_mean: float | None

    def as_dict(self) -> dict[str, Any]:
        return {
            "scene_id": self.scene_id,
            "datetime": self.datetime,
            "ndvi_mean": self.ndvi_mean,
            "ndwi_mean": self.ndwi_mean,
            "ndbi_mean": self.ndbi_mean,
        }


def compute_scene_kpis(aoi: Polygon, signed_item: Item) -> SceneKpis | None:
    """
    Mean NDVI / NDWI / NDBI inside AOI for one Sentinel-2 L2A granule.

    Returns None if mandatory assets are missing or reads fail.
    """
    assets = signed_item.assets
    need = ("B04", "B08", "B03", "B11", "B8A")
    if not all(k in assets for k in need):
        return None

    scale = 1 / 10000.0

    try:
        b4_a, b4_t, b4_crs = _geom_mask_transform(assets["B04"].href, aoi)
        b8_a, b8_t, b8_crs = _geom_mask_transform(assets["B08"].href, aoi)
        b3_a, b3_t, b3_crs = _geom_mask_transform(assets["B03"].href, aoi)
        b11_a, b11_t, b11_crs = _geom_mask_transform(assets["B11"].href, aoi)
        b8a_a, b8a_t, b8a_crs = _geom_mask_transform(assets["B8A"].href, aoi)

        b8_a = _reproject_to_match(b8_a, b8_t, b8_crs, b4_a.shape, b4_t, b4_crs)
        b3_a = _reproject_to_match(b3_a, b3_t, b3_crs, b4_a.shape, b4_t, b4_crs)
        b11_a = _reproject_to_match(b11_a, b11_t, b11_crs, b4_a.shape, b4_t, b4_crs)
        b8a_a = _reproject_to_match(b8a_a, b8a_t, b8a_crs, b4_a.shape, b4_t, b4_crs)

        b4s = b4_a.astype(np.float32) * scale
        b8s = b8_a.astype(np.float32) * scale
        b3s = b3_a.astype(np.float32) * scale
        b11s = b11_a.astype(np.float32) * scale
        b8as = b8a_a.astype(np.float32) * scale

        iv = ndvi(b8s, b4s)
        iw = ndwi_green_nir(b3s, b8as)
        ib = ndbi(b11s, b8s)

        ndvi_xr = xr.DataArray(iv.filled(np.nan))
        ndvi_m_raw = ndvi_xr.mean(skipna=True).item()
        ndvi_m = float(ndvi_m_raw) if ndvi_m_raw is not None and np.isfinite(ndvi_m_raw) else None

        ndwi_m = masked_mean(iw.filled(np.nan))
        ndbi_m = masked_mean(ib.filled(np.nan))

        dt = signed_item.datetime.isoformat() if signed_item.datetime else None
        return SceneKpis(
            scene_id=signed_item.id,
            datetime=dt,
            ndvi_mean=ndvi_m,
            ndwi_mean=ndwi_m,
            ndbi_mean=ndbi_m,
        )
    except Exception:
        return None
