import { MapContainer, TileLayer } from "react-leaflet";
import { SectionCard } from "../layout/SectionCard";

export function MapSection() {
  return (
    <SectionCard
      title="Map"
      subtitle="Interactive viewport — OpenStreetMap tiles (no proprietary providers)."
    >
      <div className="overflow-hidden rounded-lg ring-1 ring-slate-700">
        <MapContainer
          center={[39.74, -104.93]}
          zoom={10}
          className="h-[320px] w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        AOI overlays, draw tools, and raster layers will mount here alongside the analysis pipeline.
      </p>
    </SectionCard>
  );
}
