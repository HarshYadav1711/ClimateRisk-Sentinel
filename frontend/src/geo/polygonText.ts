import type { GeoJsonPolygon } from "../types/domain";

function parseLines(text: string): number[][] {
  const ring: number[][] = [];
  for (const line of text.trim().split(/\n+/)) {
    const parts = line.trim().split(/[\s,]+/).filter(Boolean);
    if (parts.length < 2) continue;
    const a = Number(parts[0]);
    const b = Number(parts[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    ring.push([a, b]);
  }
  return ring;
}

/** Build GeoJSON Polygon from lon/lat vertex lines (WGS84). */
export function polygonFromLonLatText(text: string): GeoJsonPolygon {
  const ring = parseLines(text);
  if (ring.length < 3) {
    throw new Error("Need at least three distinct vertices (longitude latitude per line).");
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  const closed = first[0] === last[0] && first[1] === last[1] ? ring : [...ring, [...first]];
  return {
    type: "Polygon",
    coordinates: [closed],
  };
}

/** Ensure GeoJSON Polygon has a closed exterior ring (client-side convenience). */
export function ensureClosedRing(poly: GeoJsonPolygon): GeoJsonPolygon {
  const ring = poly.coordinates[0];
  if (!ring?.length) throw new Error("Invalid polygon coordinates.");
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return poly;
  return {
    type: "Polygon",
    coordinates: [[...ring, [...first]]],
  };
}
