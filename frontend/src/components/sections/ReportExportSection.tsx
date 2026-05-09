import type { AnalysisRunResponse } from "../../lib/api";
import { buildSummaryText, downloadJson, downloadTextFile } from "../../lib/exportAnalysis";

type Props = {
  result: AnalysisRunResponse | null;
};

export function ReportExportSection({ result }: Props) {
  const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  const onJson = () => {
    if (!result) return;
    downloadJson(`climate-risk-sentinel-analysis-${stamp()}.json`, result);
  };

  const onSummary = () => {
    if (!result) return;
    downloadTextFile(`climate-risk-sentinel-summary-${stamp()}.txt`, buildSummaryText(result));
  };

  return (
    <section className="rounded-2xl border border-slate-800/90 bg-slate-950/35 p-6 ring-1 ring-white/[0.03]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Report</p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-50">Export</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
        Download the full JSON payload for tooling, or a plain-language summary for reviewers who prefer a document.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!result}
          onClick={onJson}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Download JSON
        </button>
        <button
          type="button"
          disabled={!result}
          onClick={onSummary}
          className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900/70 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Download summary (.txt)
        </button>
      </div>
      {!result ? (
        <p className="mt-4 text-xs text-slate-500">Run an analysis to enable exports.</p>
      ) : (
        <p className="mt-4 text-xs text-slate-500">
          JSON mirrors the API response including `machine_summary` for dashboards and audits.
        </p>
      )}
    </section>
  );
}
