import L from "leaflet";
import { useEffect } from "react";
import { GeoJSON as GeoJsonLayer, MapContainer, TileLayer, useMap } from "react-leaflet";
import type { GeoJsonPolygon } from "../../types/domain";
import { DrawPolygonToolbar } from "../map/DrawPolygonToolbar";

function FitAoi({ geojson }: { geojson: GeoJsonPolygon | null }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    const layer = L.geoJSON(geojson as unknown as GeoJSON.GeoJsonObject);
    const b = layer.getBounds();
    if (b.isValid()) map.fitBounds(b, { padding: [40, 40], maxZoom: 14 });
  }, [geojson, map]);
  return null;
}

type Props = {
  aoiGeometry: GeoJsonPolygon | null;
  onDrawPolygon: (g: GeoJsonPolygon) => void;
  onClearDraw: () => void;
};

export function MapSection({ aoiGeometry, onDrawPolygon, onClearDraw }: Props) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm shadow-slate-950/40">
      <header className="mb-4 border-b border-slate-800 pb-3">
        <h2 className="text-lg font-semibold tracking-tight text-slate-100">Map</h2>
        <p className="mt-1 text-sm text-slate-400">
          Draw an AOI on the map or paste coordinates — geometry is normalized by the API (WGS84).
        </p>
      </header>
      <div className="overflow-hidden rounded-lg ring-1 ring-slate-700">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          className="h-[380px] w-full min-h-[280px]"
          scrollWheelZoom
          worldCopyJump
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitAoi geojson={aoiGeometry} />
          {aoiGeometry ? (
            <GeoJsonLayer
              data={aoiGeometry as unknown as GeoJSON.GeoJsonObject}
              style={{ color: "#22d3ee", weight: 2, fillOpacity: 0.12 }}
            />
          ) : null}
          <DrawPolygonToolbar onPolygonCreated={onDrawPolygon} onLayersCleared={onClearDraw} />
        </MapContainer>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Basemap: OSM · Analysis tiles will layer here as indicators are implemented.
      </p>
    </section>
  );
}
