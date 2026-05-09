"""Heuristic exposure combination — transparent weights, not a calibrated hazard model."""

from __future__ import annotations

from dataclasses import dataclass


def _clamp01(x: float | None) -> float:
    if x is None:
        return 0.0
    return max(0.0, min(1.0, float(x)))


@dataclass(frozen=True)
class RiskWeights:
    ndbi: float = 22.0
    road_density: float = 18.0
    water_proximity: float = 15.0
    ndwi_signal: float = 10.0
    vegetation_loss: float = 20.0
    sparse_vegetation: float = 15.0


def explain_heuristic_score(
    *,
    ndbi_mean: float | None,
    road_density_km_per_km2: float | None,
    nearest_waterway_km: float | None,
    ndwi_mean: float | None,
    ndvi_delta: float | None,
    ndvi_mean_latest: float | None,
    area_km2: float,
    weights: RiskWeights | None = None,
) -> tuple[float, str, list[str]]:
    """
    Compute a 0–100 **heuristic exposure index** from normalized sub-indicators.

    This is **not** a prediction of damages or insured losses — only a structured blend of
    surface proxies and mapped vectors for triage.
    """
    w = weights or RiskWeights()
    parts: list[str] = []
    score = 0.0

    if ndbi_mean is not None:
        t = _clamp01((ndbi_mean + 0.15) / 0.85)
        s = t * w.ndbi
        score += s
        parts.append(f"built-up proxy ({s:.1f})")

    if road_density_km_per_km2 is not None and area_km2 > 0:
        t = _clamp01(min(road_density_km_per_km2 / 8.0, 1.0))
        s = t * w.road_density
        score += s
        parts.append(f"mapped road density ({s:.1f})")

    if nearest_waterway_km is not None:
        t = _clamp01(1.0 - min(nearest_waterway_km / 5.0, 1.0))
        s = t * w.water_proximity
        score += s
        parts.append(f"water proximity ({s:.1f})")

    if ndwi_mean is not None:
        t = _clamp01((ndwi_mean + 0.35) / 1.1)
        s = t * w.ndwi_signal
        score += s
        parts.append(f"wetness signal ({s:.1f})")

    if ndvi_delta is not None:
        loss = _clamp01(max(0.0, -ndvi_delta) / 0.25)
        s = loss * w.vegetation_loss
        score += s
        parts.append(f"vegetation cover change ({s:.1f})")

    if ndvi_mean_latest is not None:
        stress = _clamp01(max(0.0, 0.35 - ndvi_mean_latest) / 0.55)
        s = stress * w.sparse_vegetation
        score += s
        parts.append(f"sparse vegetation stress ({s:.1f})")

    score = float(max(0.0, min(100.0, score)))
    explanation = (
        "Heuristic index blends normalized sub-scores (weights sum visually to ~100 max): "
        + "; ".join(parts)
        if parts
        else "Insufficient inputs — score defaulted toward neutral."
    )
    detail_parts = parts.copy()
    return score, explanation, detail_parts
