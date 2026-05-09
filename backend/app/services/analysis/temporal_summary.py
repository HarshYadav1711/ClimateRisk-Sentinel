"""Temporal comparison helpers — deterministic deltas between scene KPI rows."""

from __future__ import annotations

from typing import Any

from app.services.analysis.raster_readout import SceneKpis


def ndvi_delta_between_scenes(newer: SceneKpis | None, older: SceneKpis | None) -> tuple[float | None, str]:
    """
    ΔNDVI = mean NDVI(newer) − mean NDVI(older).

    Negative values indicate lower vegetation index on the more recent acquisition
    **within this AOI** — not a forecast.
    """
    if newer is None or older is None:
        return None, "Need two successful scene summaries to compute ΔNDVI."
    if newer.ndvi_mean is None or older.ndvi_mean is None:
        return None, "NDVI mean unavailable for one or both scenes (cloud/saturated pixels)."
    delta = float(newer.ndvi_mean - older.ndvi_mean)
    return delta, (
        f"ΔNDVI between acquisitions ({older.datetime} → {newer.datetime}): {delta:.4f}. "
        "Interpret as relative greenness change inside the AOI, not a damage estimate."
    )


def temporal_block(
    scenes: list[SceneKpis],
) -> dict[str, Any]:
    if len(scenes) < 2:
        return {
            "ndvi_delta": None,
            "summary_sentence": (
                "Temporal change summary requires two distinct low-cloud acquisitions; "
                "only one usable summary was produced."
                if len(scenes) == 1
                else "No raster scene statistics available for temporal comparison."
            ),
        }
    newer, older = scenes[0], scenes[-1]
    delta, note = ndvi_delta_between_scenes(newer, older)
    return {
        "ndvi_delta": delta,
        "newer_scene_id": newer.scene_id,
        "older_scene_id": older.scene_id,
        "summary_sentence": note,
    }
