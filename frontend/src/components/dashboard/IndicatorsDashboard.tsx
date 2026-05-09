import type { AnalysisIndicator, AnalysisRunResponse } from "../../lib/api";

const INDICATOR_ORDER = [
  "ndvi_mean",
  "ndwi_mean",
  "ndbi_mean",
  "ndvi_delta",
  "road_density",
  "waterway_distance",
];

function formatValue(ind: AnalysisIndicator): string {
  if (ind.value === null || ind.value === undefined) return "—";
  const n = ind.value;
  if (ind.unit === "index" || ind.unit === "Δ index") return n.toFixed(4);
  if (ind.unit === "km / km²") return n.toFixed(4);
  if (ind.unit === "km") return n.toFixed(3);
  return String(n);
}

type Props = {
  result: AnalysisRunResponse | null;
  loading: boolean;
  apiOnline: boolean;
  onClearResults: () => void;
};

export function IndicatorsDashboard({ result, loading, apiOnline, onClearResults }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800/90 bg-slate-950/35 p-8 ring-1 ring-white/[0.03]">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
          <div>
            <p className="text-sm font-medium text-slate-200">Computing indicators…</p>
            <p className="mt-1 text-xs text-slate-500">Raster statistics and OSM proximity load over the network.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!apiOnline && !result) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/25 px-6 py-10 text-center ring-1 ring-white/[0.03]">
        <p className="text-sm font-medium text-slate-300">Backend not connected</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
          Start the API locally (see README). Until health checks succeed, validation, STAC search, and analysis stay
          disabled.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/25 px-6 py-10 text-center ring-1 ring-white/[0.03]">
        <p className="text-sm font-medium text-slate-300">No analysis yet</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
          Validate your AOI and run the pipeline. Results appear here as compact, cited metrics — screening support, not a
          forecast.
        </p>
      </div>
    );
  }

  const sorted = [...result.indicators].sort(
    (a, b) => INDICATOR_ORDER.indexOf(a.key) - INDICATOR_ORDER.indexOf(b.key),
  );

  return (
    <div className="space-y-6">
      {!apiOnline ? (
        <p className="rounded-lg border border-amber-900/40 bg-amber-950/25 px-3 py-2 text-xs text-amber-100/90">
          API offline — displaying cached session results only; reconnect to refresh.
        </p>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Decision view</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-50">Indicators</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
            Explainable proxies from Sentinel-2 and OpenStreetMap. Each value maps to a documented definition — hover or
            expand rows on desktop for the full text.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {result.partial_analysis ? (
            <span className="rounded-full border border-amber-800/60 bg-amber-950/40 px-3 py-1 text-xs font-medium text-amber-100/95">
              Partial — check caveats
            </span>
          ) : (
            <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-400">
              Within pipeline limits
            </span>
          )}
          <button
            type="button"
            onClick={onClearResults}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-900/80"
          >
            Clear results
          </button>
        </div>
      </div>

      {/* Risk hero */}
      <div className="grid gap-4 rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-950/80 to-slate-900/40 p-6 ring-1 ring-white/[0.04] sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Heuristic exposure index</p>
          <p className="mt-1 text-xs text-slate-500">Weighted screening score — not calibrated loss probability.</p>
        </div>
        <div className="flex items-baseline gap-2 sm:justify-end">
          <span className="text-4xl font-semibold tabular-nums tracking-tight text-brand-500">
            {result.risk.score_0_100.toFixed(1)}
          </span>
          <span className="text-sm text-slate-500">/ 100</span>
        </div>
        <p className="sm:col-span-2 text-sm leading-relaxed text-slate-300">{result.risk.explanation}</p>
        {result.risk.component_notes.length > 0 ? (
          <ul className="sm:col-span-2 space-y-1 border-t border-slate-800/80 pt-4 text-xs text-slate-500">
            {result.risk.component_notes.map((note) => (
              <li key={note.slice(0, 48)} className="flex gap-2">
                <span className="text-slate-600">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Metric grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((ind) => (
          <details
            key={ind.key}
            className="group rounded-xl border border-slate-800/90 bg-slate-950/45 px-4 py-3 ring-1 ring-white/[0.03] open:ring-brand-500/15"
          >
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{ind.label}</p>
                  <p className="mt-2 font-mono text-lg tabular-nums text-slate-100">
                    {formatValue(ind)}
                    <span className="ml-1.5 text-xs font-sans font-normal text-slate-500">{ind.unit}</span>
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-600 group-open:text-brand-500/90">
                  Info
                </span>
              </div>
            </summary>
            <p className="mt-3 border-t border-slate-800/80 pt-3 text-xs leading-relaxed text-slate-400">
              {ind.definition}
            </p>
            {ind.caveat ? (
              <p className="mt-2 text-xs leading-relaxed text-amber-200/85">Note: {ind.caveat}</p>
            ) : null}
          </details>
        ))}
      </div>

      {/* Caveats */}
      {result.caveats.length > 0 ? (
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/40 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Caveats</p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-400">
            {result.caveats.map((c) => (
              <li key={c.slice(0, 64)} className="flex gap-2">
                <span className="text-slate-600">—</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
