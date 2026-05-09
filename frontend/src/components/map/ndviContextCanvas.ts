/**
 * Builds a data URL for an AOI-shaped NDVI *visual context* tint (not per-pixel truth).
 * Uses linear bbox projection — credible for small AOIs; intentionally illustrative.
 */

export type NdviVisualPaintKind = "vegetation" | "pipeline_loading" | "awaiting" | "nodata";

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Piecewise ramp: stressed/soil-like → sparse → lush (display-only). */
function ndviDisplayRgb(t: number): [number, number, number] {
  const x = clamp01(t);
  if (x < 0.5) {
    const u = x / 0.5;
    return [
      Math.round(118 + (168 - 118) * u),
      Math.round(72 + (145 - 72) * u),
      Math.round(46 + (85 - 46) * u),
    ];
  }
  const u = (x - 0.5) / 0.5;
  return [
    Math.round(168 + (13 - 168) * u),
    Math.round(145 + (148 - 145) * u),
    Math.round(85 + (115 - 85) * u),
  ];
}

function drawDiagonalStripes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stroke: string,
  spacing: number,
): void {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = spacing * 0.45;
  for (let i = -h; i < w + h; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + spacing * 3, h);
    ctx.stroke();
  }
  ctx.restore();
}

export function buildNdviContextDataUrl(
  exteriorRing: number[][],
  kind: NdviVisualPaintKind,
  ndviMean?: number,
): string | null {
  if (!exteriorRing?.length || exteriorRing.length < 3) return null;

  const lngs = exteriorRing.map((c) => c[0]);
  const lats = exteriorRing.map((c) => c[1]);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const dx = east - west || 1e-9;
  const dy = north - south || 1e-9;
  const aspect = dx / dy;
  const base = 512;
  const w = aspect >= 1 ? base : Math.max(64, Math.round(base * aspect));
  const h = aspect >= 1 ? Math.max(64, Math.round(base / aspect)) : base;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const project = (lng: number, lat: number): [number, number] => [
    ((lng - west) / dx) * w,
    ((north - lat) / dy) * h,
  ];

  ctx.beginPath();
  for (let i = 0; i < exteriorRing.length; i++) {
    const [x, y] = project(exteriorRing[i][0], exteriorRing[i][1]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.clip();

  if (kind === "vegetation" && ndviMean != null && Number.isFinite(ndviMean)) {
    const t = clamp01((ndviMean + 1) / 2);
    const [r0, g0, b0] = ndviDisplayRgb(Math.max(0, t - 0.22));
    const [r1, g1, b1] = ndviDisplayRgb(Math.min(1, t + 0.22));
    const [r2, g2, b2] = ndviDisplayRgb(t);
    const grd = ctx.createLinearGradient(0, h, w, 0);
    grd.addColorStop(0, `rgba(${r0},${g0},${b0},0.42)`);
    grd.addColorStop(0.55, `rgba(${r2},${g2},${b2},0.48)`);
    grd.addColorStop(1, `rgba(${r1},${g1},${b1},0.38)`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  } else if (kind === "pipeline_loading") {
    ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
    ctx.fillRect(0, 0, w, h);
    drawDiagonalStripes(ctx, w, h, "rgba(148, 163, 184, 0.28)", 14);
  } else if (kind === "awaiting") {
    ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
    ctx.fillRect(0, 0, w, h);
    drawDiagonalStripes(ctx, w, h, "rgba(100, 116, 139, 0.2)", 18);
  } else {
    ctx.fillStyle = "rgba(30, 41, 59, 0.32)";
    ctx.fillRect(0, 0, w, h);
    drawDiagonalStripes(ctx, w, h, "rgba(251, 191, 36, 0.14)", 16);
  }

  return canvas.toDataURL("image/png");
}
