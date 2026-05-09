import { SectionCard } from "../layout/SectionCard";

export function AoiInputSection() {
  return (
    <SectionCard
      title="Area of interest"
      subtitle="Define a polygon or paste coordinates (WGS84). Wiring to validation API comes next."
    >
      <textarea
        aria-label="AOI coordinates placeholder"
        placeholder={"Longitude latitude pairs, one per line — e.g.\n-104.98 39.74\n-104.88 39.74"}
        disabled
        rows={5}
        className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 font-mono text-sm text-slate-300 placeholder:text-slate-600"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-500"
        >
          Apply AOI (soon)
        </button>
        <span className="self-center text-xs text-slate-500">GeoJSON validation endpoint TBD</span>
      </div>
    </SectionCard>
  );
}
