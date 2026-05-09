import type { AnalysisRunResponse } from "../../lib/api";
import { SectionCard } from "../layout/SectionCard";

type Props = {
  result: AnalysisRunResponse | null;
  loading: boolean;
};

export function AnalysisResultsSection({ result, loading }: Props) {
  return (
    <SectionCard
      title="Geospatial analysis engine"
      subtitle="Heuristic exposure index + interpretable indicators — not a predictive damage model."
    >
      {loading ? (
        <p className="animate-pulse text-sm text-slate-500">Running raster + vector pipeline…</p>
      ) : result ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-xs uppercase text-slate-500">Heuristic index</span>
            <span className="text-3xl font-semibold text-brand-500">{result.risk.score_0_100.toFixed(1)}</span>
            <span className="text-xs text-slate-500">/ 100</span>
            {result.partial_analysis ? (
              <span className="rounded bg-amber-950/60 px-2 py-0.5 text-xs text-amber-100">
                Partial analysis — see caveats
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{result.risk.explanation}</p>
          <ul className="list-inside list-disc text-xs text-slate-500">
            {result.caveats.map((c) => (
              <li key={c.slice(0, 40)}>{c}</li>
            ))}
          </ul>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs leading-relaxed text-slate-400">
            {result.narrative_summary}
          </div>
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer text-slate-400">Machine-readable summary (JSON)</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-950 p-2 font-mono text-[11px]">
              {JSON.stringify(result.machine_summary, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Click “Run analysis pipeline” after defining an AOI (validation recommended). Large AOIs may skip rasters
          server-side.
        </p>
      )}
    </SectionCard>
  );
}
