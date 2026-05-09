import type { AOIMetadata } from "../../lib/api";
import { SectionCard } from "../layout/SectionCard";

type Props = {
  metadata: AOIMetadata | null;
  warnings: string[];
};

export function AnalysisSummarySection({ metadata, warnings }: Props) {
  return (
    <SectionCard
      title="Analysis summary"
      subtitle="Bounding box and footprint metrics after validation — indicators plug in here later."
    >
      {metadata ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Area</dt>
            <dd className="font-mono text-lg text-slate-100">{metadata.area_km2.toFixed(3)} km²</dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Vertices (exterior)</dt>
            <dd className="font-mono text-lg text-slate-100">{metadata.vertex_count_exterior}</dd>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-slate-500">BBox (WGS84)</dt>
            <dd className="mt-1 font-mono text-xs text-slate-300">
              [{metadata.bbox.min_lon?.toFixed(4)}, {metadata.bbox.min_lat?.toFixed(4)}] → [
              {metadata.bbox.max_lon?.toFixed(4)}, {metadata.bbox.max_lat?.toFixed(4)}]
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-slate-500">Run Validate to compute AOI metadata.</p>
      )}
      {warnings.length > 0 ? (
        <ul className="mt-3 list-inside list-disc text-xs text-amber-200/90">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
    </SectionCard>
  );
}
