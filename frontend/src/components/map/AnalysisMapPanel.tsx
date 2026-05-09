import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  GeoJSON as GeoJsonLayer,
  MapContainer,
  Rectangle,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { AnalysisRunResponse, AOIMetadata, DatasetSearchResponse } from "../../lib/api";
import type { GeoJsonPolygon } from "../../types/domain";
import { MapAnalysisContextPanel } from "./MapAnalysisContextPanel";
import {
  aoiMetadataToBounds,
  contextGuideLinesGeoJson,
  stacItemBboxToBounds,
} from "./mapOverlayHelpers";
import { DrawPolygonToolbar } from "./DrawPolygonToolbar";

type BasemapId = "neutral" | "street";

function FitAoi({ geojson }: { geojson: GeoJsonPolygon | null }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    const layer = L.geoJSON(geojson as unknown as GeoJSON.GeoJsonObject);
    const b = layer.getBounds();
    if (b.isValid()) map.fitBounds(b, { padding: [48, 48], maxZoom: 14 });
  }, [geojson, map]);
  return null;
}

type LayerState = {
  aoi: boolean;
  centroid: boolean;
  footprintBbox: boolean;
  heatTint: boolean;
  contextGuides: boolean;
  stacFootprint: boolean;
};

type Props = {
  aoiGeometry: GeoJsonPolygon | null;
  centroid: { lon: number; lat: number } | null;
  metadata: AOIMetadata | null;
  analysisResult: AnalysisRunResponse | null;
  stacPreview: DatasetSearchResponse | null;
  aoiValidated: boolean;
  analysisActive: boolean;
  analysisLoading: boolean;
  apiOnline?: boolean;
  onDrawPolygon: (g: GeoJsonPolygon) => void;
  onClearDraw: () => void;
};

const BASEMAPS: Record<
  BasemapId,
  { url: string; label: string; attribution: string }
> = {
  neutral: {
    label: "Neutral basemap",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  street: {
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
};

export function AnalysisMapPanel({
  aoiGeometry,
  centroid,
  metadata,
  analysisResult,
  stacPreview,
  aoiValidated,
  analysisActive,
  analysisLoading,
  apiOnline = true,
  onDrawPolygon,
  onClearDraw,
}: Props) {
  const [basemap, setBasemap] = useState<BasemapId>("neutral");
  const [layers, setLayers] = useState<LayerState>({
    aoi: true,
    centroid: true,
    footprintBbox: true,
    heatTint: false,
    contextGuides: true,
    stacFootprint: false,
  });

  const ndviMean = useMemo(() => {
    const row = analysisResult?.indicators?.find((i) => i.key === "ndvi_mean");
    return typeof row?.value === "number" ? row.value : null;
  }, [analysisResult]);

  const heatStyle = useMemo(() => {
    const base = { color: "#10b981", weight: 5, opacity: 0.22, fillColor: "#34d399", fillOpacity: 0.1 };
    if (ndviMean == null || Number.isNaN(ndviMean)) return base;
    const t = Math.max(0, Math.min(1, (ndviMean + 1) / 2));
    return {
      color: "#34d399",
      weight: 4 + t * 4,
      opacity: 0.15 + t * 0.2,
      fillColor: "#10b981",
      fillOpacity: 0.06 + t * 0.14,
    };
  }, [ndviMean]);

  const stacBounds = useMemo(() => {
    const first = stacPreview?.items?.[0];
    if (!first || typeof first !== "object") return null;
    return stacItemBboxToBounds(first as Record<string, unknown>);
  }, [stacPreview]);

  const guideGeoJson = useMemo(() => {
    if (!metadata?.bbox || !centroid) return null;
    return contextGuideLinesGeoJson(metadata.bbox, centroid);
  }, [metadata, centroid]);

  const aoiStyle = useMemo(() => {
    if (!layers.aoi) return { opacity: 0, fillOpacity: 0, weight: 0, color: "#000", fillColor: "#000" };
    if (analysisActive) {
      return {
        color: "#34d399",
        weight: 3,
        fillColor: "#34d399",
        fillOpacity: 0.14,
      };
    }
    return {
      color: "#22d3ee",
      weight: 2,
      fillColor: "#22d3ee",
      fillOpacity: 0.08,
    };
  }, [analysisActive, layers.aoi]);

  const b = BASEMAPS[basemap];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950/40 shadow-sm ring-1 ring-white/[0.04]">
      <div className="flex flex-col gap-4 border-b border-slate-800/90 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Map</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-50">AOI & context</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            Footprint, footprint bbox, and optional scene/STAC overlays — raster KPIs remain server-computed.
          </p>
          {!apiOnline ? (
            <p className="mt-3 max-w-xl text-xs leading-relaxed text-amber-200/85">
              API offline — you can still sketch an AOI locally; connect the backend to validate and analyze.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <select
            aria-label="Basemap"
            value={basemap}
            onChange={(e) => setBasemap(e.target.value as BasemapId)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none ring-brand-500/0 transition hover:border-slate-600 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="neutral">{BASEMAPS.neutral.label}</option>
            <option value="street">{BASEMAPS.street.label}</option>
          </select>
        </div>
      </div>

      <div className="relative px-5 pb-5 pt-4">
        <div className="relative overflow-hidden rounded-xl ring-1 ring-slate-800/90 transition-opacity duration-300">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            className="relative z-0 h-[min(52vh,520px)] w-full min-h-[300px]"
            scrollWheelZoom
            worldCopyJump
          >
            <TileLayer attribution={b.attribution} url={b.url} />
            <FitAoi geojson={aoiGeometry} />
            {metadata?.bbox && layers.footprintBbox ? (
              <Rectangle
                bounds={aoiMetadataToBounds(metadata.bbox)}
                pathOptions={{
                  color: "#64748b",
                  weight: 1,
                  opacity: 0.9,
                  fillOpacity: 0,
                  dashArray: "6 10",
                }}
              />
            ) : null}
            {layers.stacFootprint && stacBounds ? (
              <Rectangle
                bounds={stacBounds}
                pathOptions={{
                  color: "#22d3ee",
                  weight: 1,
                  opacity: 0.55,
                  fillColor: "#22d3ee",
                  fillOpacity: 0.05,
                  dashArray: "3 5",
                }}
              />
            ) : null}
            {layers.heatTint && aoiGeometry ? (
              <GeoJsonLayer
                data={aoiGeometry as unknown as GeoJSON.GeoJsonObject}
                style={heatStyle}
              />
            ) : null}
            {aoiGeometry ? (
              <GeoJsonLayer
                data={aoiGeometry as unknown as GeoJSON.GeoJsonObject}
                style={aoiStyle}
              />
            ) : null}
            {layers.contextGuides && guideGeoJson ? (
              <GeoJsonLayer
                data={guideGeoJson as unknown as GeoJSON.GeoJsonObject}
                style={{
                  color: "#475569",
                  weight: 1,
                  opacity: 0.7,
                  dashArray: "4 6",
                }}
              />
            ) : null}
            {centroid && layers.centroid ? (
              <CircleMarker
                center={[centroid.lat, centroid.lon]}
                radius={6}
                pathOptions={{
                  color: analysisActive ? "#a7f3d0" : "#67e8f9",
                  weight: 2,
                  fillColor: analysisActive ? "#34d399" : "#22d3ee",
                  fillOpacity: 0.85,
                }}
              />
            ) : null}
            <DrawPolygonToolbar onPolygonCreated={onDrawPolygon} onLayersCleared={onClearDraw} />
          </MapContainer>

          <div className="pointer-events-none absolute inset-0 z-[500] flex flex-col justify-between p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="pointer-events-auto flex max-w-[min(100%,20rem)] flex-col gap-2 rounded-xl border border-slate-800/90 bg-slate-950/85 p-3 text-xs shadow-lg backdrop-blur-md transition-colors duration-200">
                <p className="font-medium uppercase tracking-wide text-slate-500">Layers</p>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-slate-300">
                  <span>AOI polygon</span>
                  <input
                    type="checkbox"
                    checked={layers.aoi}
                    onChange={(e) => setLayers((s) => ({ ...s, aoi: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-brand-500/40"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-slate-300">
                  <span>Footprint bbox</span>
                  <input
                    type="checkbox"
                    checked={layers.footprintBbox}
                    disabled={!metadata?.bbox}
                    onChange={(e) => setLayers((s) => ({ ...s, footprintBbox: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-brand-500/40 disabled:opacity-40"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-slate-300">
                  <span>Index halo (NDVI proxy)</span>
                  <input
                    type="checkbox"
                    checked={layers.heatTint}
                    disabled={!aoiGeometry}
                    onChange={(e) => setLayers((s) => ({ ...s, heatTint: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-brand-500/40 disabled:opacity-40"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-slate-300">
                  <span>Context guides</span>
                  <input
                    type="checkbox"
                    checked={layers.contextGuides}
                    disabled={!metadata?.bbox || !centroid}
                    onChange={(e) => setLayers((s) => ({ ...s, contextGuides: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-brand-500/40 disabled:opacity-40"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-slate-300">
                  <span>STAC scene bbox</span>
                  <input
                    type="checkbox"
                    checked={layers.stacFootprint}
                    disabled={!stacBounds}
                    onChange={(e) => setLayers((s) => ({ ...s, stacFootprint: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-brand-500/40 disabled:opacity-40"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-slate-300">
                  <span>Validated centroid</span>
                  <input
                    type="checkbox"
                    checked={layers.centroid}
                    disabled={!centroid}
                    onChange={(e) => setLayers((s) => ({ ...s, centroid: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-brand-500/40 disabled:opacity-40"
                  />
                </label>
                {!metadata?.bbox ? (
                  <p className="text-[11px] leading-snug text-slate-500">BBox overlays require validated AOI metadata.</p>
                ) : null}
              </div>

              <MapAnalysisContextPanel
                analysisResult={analysisResult}
                stacPreview={stacPreview}
                analysisLoading={analysisLoading}
                aoiValidated={aoiValidated}
                hasAoi={aoiGeometry !== null}
              />
            </div>

            <div className="pointer-events-auto ml-auto mt-auto max-w-[min(100%,17rem)] rounded-xl border border-slate-800/90 bg-slate-950/85 p-3 text-[11px] leading-relaxed text-slate-400 shadow-lg backdrop-blur-md transition-colors duration-200">
              <p className="font-semibold uppercase tracking-wide text-slate-500">Legend</p>
              <ul className="mt-2 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border-2 border-emerald-400 bg-emerald-400/15" />
                  <span>AOI after analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border-2 border-cyan-400 bg-cyan-400/10" />
                  <span>AOI draft</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-3 w-8 shrink-0 border border-dashed border-slate-500" />
                  <span>Footprint bbox</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-3 w-8 shrink-0 border border-dashed border-cyan-600/60" />
                  <span>STAC item bbox (first hit)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300 ring-2 ring-cyan-500/40" />
                  <span>Centroid</span>
                </li>
              </ul>
            </div>
          </div>

          {analysisLoading ? (
            <div className="pointer-events-none absolute inset-0 z-[600] flex flex-col items-center justify-center gap-4 bg-slate-950/40 backdrop-blur-[1px] transition-opacity duration-300">
              <div className="flex w-full max-w-xs flex-col gap-2 px-6">
                <div className="h-2.5 w-full rounded bg-slate-700/90 animate-pulse" />
                <div className="h-2.5 w-4/5 rounded bg-slate-700/70 animate-pulse" />
                <div className="h-2.5 w-3/5 rounded bg-slate-700/60 animate-pulse" />
              </div>
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-brand-500"
                aria-hidden
              />
              <p className="text-xs font-medium text-slate-300">Running analysis…</p>
              <p className="max-w-xs px-6 text-center text-[11px] text-slate-500">
                Map stays usable — pipeline runs server-side.
              </p>
            </div>
          ) : null}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Draw tools: top-right on the map. Toggle overlays to relate footprint, catalog bbox, and NDVI-weighted halo to
          tabular results.
        </p>
      </div>
    </section>
  );
}
