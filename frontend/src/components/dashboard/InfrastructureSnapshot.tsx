import type { AnalysisRunResponse } from "../../lib/api";

type Props = {
  result: AnalysisRunResponse | null;
  /** Prior results stay visible while a refresh runs — subtle dim + ring. */
  analysisRefreshing?: boolean;
};

export function InfrastructureSnapshot({ result, analysisRefreshing = false }: Props) {
  if (!result) return null;

  const rd = result.infrastructure.roads_length_km;
  const ww = result.infrastructure.nearest_waterway_km;

  return (
    <div
      className={`rounded-xl border border-slate-800/90 bg-slate-950/40 px-4 py-3 ring-1 ring-white/[0.03] transition-opacity duration-300 ${
        analysisRefreshing ? "opacity-75 ring-brand-500/20" : ""
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Infrastructure (OSM)</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">Road length (bbox query)</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-slate-200">{rd != null ? `${rd.toFixed(3)} km` : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Nearest linear waterway</dt>
          <dd className="mt-0.5 font-mono text-sm tabular-nums text-slate-200">{ww != null ? `${ww.toFixed(3)} km` : "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
