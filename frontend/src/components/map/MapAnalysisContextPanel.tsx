import type { AnalysisRunResponse, DatasetSearchResponse } from "../../lib/api";
import { scenesEvaluated } from "../../lib/analysisPayload";

type Props = {
  analysisResult: AnalysisRunResponse | null;
  stacPreview: DatasetSearchResponse | null;
  analysisLoading: boolean;
  aoiValidated: boolean;
  hasAoi: boolean;
};

function formatSceneDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function MapAnalysisContextPanel({
  analysisResult,
  stacPreview,
  analysisLoading,
  aoiValidated,
  hasAoi,
}: Props) {
  const scenes = analysisResult ? scenesEvaluated(analysisResult) : [];
  const latestScene = scenes[0]?.datetime ?? null;
  const firstItem = stacPreview?.items?.[0];
  const cloud =
    firstItem && typeof firstItem.cloud_cover === "number"
      ? `${Number(firstItem.cloud_cover).toFixed(1)}%`
      : firstItem && firstItem.cloud_cover != null
        ? String(firstItem.cloud_cover)
        : "—";

  let analysisStatus: string;
  if (analysisLoading) analysisStatus = "Running…";
  else if (analysisResult) analysisStatus = "Complete";
  else if (!hasAoi) analysisStatus = "No AOI";
  else analysisStatus = "Pending";

  const partialNote =
    analysisResult?.partial_analysis && (analysisResult.caveats?.length ?? 0) > 0
      ? `${analysisResult.caveats.length} caveat${analysisResult.caveats.length === 1 ? "" : "s"}`
      : null;

  return (
    <div className="pointer-events-none max-w-[15rem] rounded-xl border border-slate-700/90 bg-slate-950/92 px-3 py-2.5 text-[11px] shadow-lg backdrop-blur-md transition-opacity duration-200">
      <p className="font-semibold uppercase tracking-[0.14em] text-slate-500">Analysis context</p>
      <dl className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1.5 text-slate-200">
        <dt className="text-slate-500">AOI</dt>
        <dd className="m-0 text-right font-medium text-slate-300">
          {!hasAoi ? "None" : aoiValidated ? "Validated" : "Draft"}
        </dd>
        <dt className="text-slate-500">Pipeline</dt>
        <dd className="m-0 text-right font-medium text-slate-300">{analysisStatus}</dd>
        <dt className="text-slate-500">Latest scene</dt>
        <dd className="m-0 text-right font-mono text-[10px] text-slate-300">{formatSceneDate(latestScene)}</dd>
        <dt className="text-slate-500">STAC · clouds</dt>
        <dd className="m-0 text-right font-mono text-slate-300">{cloud}</dd>
      </dl>
      {analysisResult?.partial_analysis ? (
        <p className="mt-2 rounded-md border border-amber-900/50 bg-amber-950/35 px-2 py-1 text-amber-100/95" role="status">
          Partial analysis{partialNote ? ` · ${partialNote}` : ""}
        </p>
      ) : null}
    </div>
  );
}
