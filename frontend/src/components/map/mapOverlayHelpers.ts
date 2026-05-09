import type { AOIMetadata } from "../../lib/api";

/** AOI footprint bbox → Leaflet [[south, west], [north, east]]. */
export function aoiMetadataToBounds(bbox: AOIMetadata["bbox"]): [[number, number], [number, number]] {
  return [
    [bbox.min_lat, bbox.min_lon],
    [bbox.max_lat, bbox.max_lon],
  ];
}

/** STAC item bbox is typically [west, south, east, north] in EPSG:4326. */
export function stacItemBboxToBounds(item: Record<string, unknown>): [[number, number], [number, number]] | null {
  const b = item.bbox;
  if (!Array.isArray(b) || b.length < 4) return null;
  const w = Number(b[0]);
  const s = Number(b[1]);
  const e = Number(b[2]);
  const n = Number(b[3]);
  if (![w, s, e, n].every(Number.isFinite)) return null;
  return [
    [s, w],
    [n, e],
  ];
}

/** Short reference segments from AOI bbox edge midpoints toward centroid (visual context — not OSM vectors). */
export function contextGuideLinesGeoJson(
  bbox: AOIMetadata["bbox"],
  centroid: { lon: number; lat: number },
): GeoJSON.FeatureCollection {
  const { min_lon, min_lat, max_lon, max_lat } = bbox;
  const midLon = (min_lon + max_lon) / 2;
  const midLat = (min_lat + max_lat) / 2;
  const t = 0.35;
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const lines: GeoJSON.Feature[] = [
    {
      type: "Feature",
      properties: { kind: "context-guide" },
      geometry: {
        type: "LineString",
        coordinates: [
          [midLon, min_lat],
          [lerp(midLon, centroid.lon), lerp(min_lat, centroid.lat)],
        ],
      },
    },
    {
      type: "Feature",
      properties: { kind: "context-guide" },
      geometry: {
        type: "LineString",
        coordinates: [
          [midLon, max_lat],
          [lerp(midLon, centroid.lon), lerp(max_lat, centroid.lat)],
        ],
      },
    },
    {
      type: "Feature",
      properties: { kind: "context-guide" },
      geometry: {
        type: "LineString",
        coordinates: [
          [min_lon, midLat],
          [lerp(min_lon, centroid.lon), lerp(midLat, centroid.lat)],
        ],
      },
    },
    {
      type: "Feature",
      properties: { kind: "context-guide" },
      geometry: {
        type: "LineString",
        coordinates: [
          [max_lon, midLat],
          [lerp(max_lon, centroid.lon), lerp(midLat, centroid.lat)],
        ],
      },
    },
  ];
  return { type: "FeatureCollection", features: lines };
}
