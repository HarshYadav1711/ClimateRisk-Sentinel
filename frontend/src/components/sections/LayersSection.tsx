import { SectionCard } from "../layout/SectionCard";

const LAYERS = [
  { id: "aoi", label: "AOI outline" },
  { id: "indicator_ndvi", label: "Vegetation index (future)" },
  { id: "indicator_water", label: "Water proximity (future)" },
];

export function LayersSection() {
  return (
    <SectionCard
      title="Layers"
      subtitle="Toggle analytical overlays as they become available from the processing service."
    >
      <ul className="space-y-2">
        {LAYERS.map((layer) => (
          <li key={layer.id} className="flex items-center gap-3">
            <input
              id={layer.id}
              type="checkbox"
              disabled
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-brand-500"
            />
            <label htmlFor={layer.id} className="text-sm text-slate-400">
              {layer.label}
            </label>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
