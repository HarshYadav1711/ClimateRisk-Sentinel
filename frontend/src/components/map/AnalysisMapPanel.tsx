import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, GeoJSON as GeoJsonLayer, MapContainer, TileLayer, useMap } from "react-leaflet";
import type { GeoJsonPolygon } from "../../types/domain";
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
};

type Props = {
  aoiGeometry: GeoJsonPolygon | null;
  centroid: { lon: number; lat: number } | null;
  analysisActive: boolean;
  analysisLoading: boolean;
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
  analysisActive,
  analysisLoading,
  onDrawPolygon,
  onClearDraw,
}: Props) {
  const [basemap, setBasemap] = useState<BasemapId>("neutral");
  const [layers, setLayers] = useState<LayerState>({ aoi: true, centroid: true });

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
            Footprint and validation geometry. Indices are summarized numerically — this view stays honest about what is
            drawn on the map (outline + centroid), not pseudo satellite overlays.
          </p>
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
        <div className="relative overflow-hidden rounded-xl ring-1 ring-slate-800/90">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            className="relative z-0 h-[min(52vh,520px)] w-full min-h-[300px]"
            scrollWheelZoom
            worldCopyJump
          >
            <TileLayer attribution={b.attribution} url={b.url} />
            <FitAoi geojson={aoiGeometry} />
            {aoiGeometry ? (
              <GeoJsonLayer
                data={aoiGeometry as unknown as GeoJSON.GeoJsonObject}
                style={aoiStyle}
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

          {/* Controls above map tiles */}
          <div className="pointer-events-none absolute inset-0 z-[500] flex flex-col justify-between p-3">
            <div className="pointer-events-auto flex max-w-[min(100%,20rem)] flex-col gap-2 rounded-xl border border-slate-800/90 bg-slate-950/85 p-3 text-xs shadow-lg backdrop-blur-md">
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
                <span>Validated centroid</span>
                <input
                  type="checkbox"
                  checked={layers.centroid}
                  disabled={!centroid}
                  onChange={(e) => setLayers((s) => ({ ...s, centroid: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-brand-500/40 disabled:opacity-40"
                />
              </label>
              {!centroid ? (
                <p className="text-[11px] leading-snug text-slate-500">Centroid appears after validation.</p>
              ) : null}
            </div>

            <div className="pointer-events-auto ml-auto mt-auto max-w-[min(100%,17rem)] rounded-xl border border-slate-800/90 bg-slate-950/85 p-3 text-[11px] leading-relaxed text-slate-400 shadow-lg backdrop-blur-md">
              <p className="font-semibold uppercase tracking-wide text-slate-500">Legend</p>
              <ul className="mt-2 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border-2 border-emerald-400 bg-emerald-400/15" />
                  <span>AOI after analysis run</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border-2 border-cyan-400 bg-cyan-400/10" />
                  <span>AOI draft / no analysis yet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300 ring-2 ring-cyan-500/40" />
                  <span>Centroid (validated geometry)</span>
                </li>
              </ul>
            </div>
          </div>

          {analysisLoading ? (
            <div className="pointer-events-none absolute inset-0 z-[600] flex flex-col items-center justify-center gap-3 bg-slate-950/65 backdrop-blur-[2px]">
              <div
                className="h-9 w-9 animate-spin rounded-full border-2 border-slate-600 border-t-brand-500"
                aria-hidden
              />
              <p className="text-sm font-medium text-slate-200">Running analysis…</p>
              <p className="max-w-xs px-6 text-center text-xs text-slate-400">
                Fetching open data and computing AOI statistics — usually under a minute for small areas.
              </p>
            </div>
          ) : null}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Draw tools: top-right on the map. Raster indicators (NDVI / NDWI / NDBI) are computed for the AOI server-side;
          the map shows geographic context only.
        </p>
      </div>
    </section>
  );
}
