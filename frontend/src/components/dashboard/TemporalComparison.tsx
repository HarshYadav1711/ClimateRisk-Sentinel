import type { AnalysisRunResponse } from "../../lib/api";
import { scenesEvaluated } from "../../lib/analysisPayload";

function shortId(id: string): string {
  if (id.length <= 18) return id;
  return `${id.slice(0, 10)}…${id.slice(-6)}`;
}

function formatIso(iso: string | null): string {
  if (!iso) return "Date unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Props = {
  result: AnalysisRunResponse | null;
  /** True while a new analysis run is in flight (first load or refresh). */
  loading?: boolean;
};

export function TemporalComparison({ result, loading = false }: Props) {
  if (!result && loading) {
    return (
      <div className="rounded-2xl border border-slate-800/90 bg-slate-950/25 px-5 py-8 ring-1 ring-white/[0.03] transition-opacity duration-300">
        <div className="h-3 w-24 rounded bg-slate-800/90 animate-pulse" />
        <div className="mt-4 h-6 w-48 rounded bg-slate-800/70 animate-pulse" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="h-24 rounded-xl bg-slate-900/50 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-900/50 animate-pulse" />
        </div>
        <p className="mt-5 text-xs text-slate-500">Loading temporal context…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/20 px-5 py-8 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Temporal</p>
        <p className="mt-2 text-sm text-slate-500">Run analysis to see acquisition dates and ΔNDVI when available.</p>
      </div>
    );
  }

  const scenes = scenesEvaluated(result);
  const delta = result.temporal.ndvi_delta;
  const hasDelta = typeof delta === "number";

  return (
    <div
      className={`rounded-2xl border border-slate-800/90 bg-slate-950/35 p-5 ring-1 ring-white/[0.03] transition-opacity duration-300 ${
        loading ? "relative opacity-95 ring-brand-500/15" : ""
      }`}
    >
      {loading ? (
        <p className="mb-4 rounded-lg border border-brand-500/25 bg-brand-950/30 px-3 py-2 text-xs text-brand-100/95" role="status">
          Updating temporal block…
        </p>
      ) : null}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Temporal</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-50">Change window</h3>
        </div>
        <p className="max-w-xl text-xs leading-relaxed text-slate-500">
          Dates come from the pipeline’s two latest usable Sentinel-2 acquisitions — not a user-selectable time slider.
        </p>
      </div>

      {scenes.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No scene statistics returned — raster step may have been skipped or failed. See caveats.
        </p>
      ) : scenes.length === 1 ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2 font-mono text-xs text-slate-200">
            {formatIso(scenes[0].datetime)}
          </span>
          <span className="text-xs text-slate-500">
            One usable acquisition — ΔNDVI needs two distinct dates with valid NDVI means.
          </span>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
            <div className="flex flex-1 flex-col rounded-xl border border-slate-800/90 bg-slate-950/50 px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Newer</span>
              <span className="mt-2 font-mono text-sm text-slate-100">{formatIso(scenes[0].datetime)}</span>
              <span className="mt-2 font-mono text-[10px] text-slate-500">{shortId(scenes[0].scene_id)}</span>
            </div>
            <div className="hidden items-center justify-center text-slate-600 sm:flex" aria-hidden>
              →
            </div>
            <div className="flex flex-1 flex-col rounded-xl border border-slate-800/90 bg-slate-950/50 px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Older</span>
              <span className="mt-2 font-mono text-sm text-slate-100">{formatIso(scenes[scenes.length - 1].datetime)}</span>
              <span className="mt-2 font-mono text-[10px] text-slate-500">
                {shortId(scenes[scenes.length - 1].scene_id)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 rounded-xl border border-slate-800/80 bg-slate-900/30 px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">ΔNDVI</span>
            <span className="font-mono text-lg tabular-nums text-slate-100">
              {hasDelta ? delta.toFixed(4) : "—"}
            </span>
            <span className="text-xs text-slate-500">newer − older (dimensionless)</span>
          </div>
        </div>
      )}

      {typeof result.temporal.summary_sentence === "string" ? (
        <p className="mt-4 text-xs leading-relaxed text-slate-400">{result.temporal.summary_sentence}</p>
      ) : null}
    </div>
  );
}
