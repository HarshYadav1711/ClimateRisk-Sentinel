import L from "leaflet";
import { useMemo } from "react";
import { ImageOverlay } from "react-leaflet";

import type { GeoJsonPolygon } from "../../types/domain";
import { buildNdviContextDataUrl, type NdviVisualPaintKind } from "./ndviContextCanvas";

type Props = {
  geometry: GeoJsonPolygon | null;
  visible: boolean;
  ndviMean: number | null;
  analysisLoading: boolean;
  hasAnalysisResult: boolean;
};

function resolvePaintKind(
  analysisLoading: boolean,
  hasAnalysisResult: boolean,
  ndviMean: number | null,
): NdviVisualPaintKind {
  if (analysisLoading) return "pipeline_loading";
  if (!hasAnalysisResult) return "awaiting";
  if (ndviMean != null && Number.isFinite(ndviMean)) return "vegetation";
  return "nodata";
}

export function NdviContextOverlay({
  geometry,
  visible,
  ndviMean,
  analysisLoading,
  hasAnalysisResult,
}: Props) {
  const payload = useMemo(() => {
    if (!visible || !geometry?.coordinates?.[0]?.length) return null;
    const ring = geometry.coordinates[0];
    const lngs = ring.map((c) => c[0]);
    const lats = ring.map((c) => c[1]);
    const west = Math.min(...lngs);
    const east = Math.max(...lngs);
    const south = Math.min(...lats);
    const north = Math.max(...lats);
    const bounds = L.latLngBounds(L.latLng(south, west), L.latLng(north, east));

    const kind = resolvePaintKind(analysisLoading, hasAnalysisResult, ndviMean);
    const ndvi =
      kind === "vegetation" && ndviMean != null && Number.isFinite(ndviMean) ? ndviMean : undefined;
    const url = buildNdviContextDataUrl(ring, kind, ndvi);
    if (!url) return null;
    return { bounds, url };
  }, [visible, geometry, analysisLoading, hasAnalysisResult, ndviMean]);

  if (!payload) return null;

  return (
    <ImageOverlay url={payload.url} bounds={payload.bounds} opacity={1} interactive={false} alt="" />
  );
}
