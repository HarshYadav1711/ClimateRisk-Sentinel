import { SectionCard } from "../layout/SectionCard";

export function ReportExportSection() {
  return (
    <SectionCard
      title="Report export"
      subtitle="Download JSON/PDF summaries for auditors — connects to report generation API."
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-500"
        >
          Download JSON
        </button>
        <button
          type="button"
          disabled
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-500"
        >
          Download PDF
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Export buttons activate once an analysis run exists and the report route is implemented.
      </p>
    </SectionCard>
  );
}
