import { SectionCard } from "../layout/SectionCard";

const PLACEHOLDERS = [
  { label: "Exposure heuristic", value: "—", hint: "Deterministic score once indicators are implemented" },
  { label: "Vegetation signal", value: "—", hint: "e.g. NDVI summary" },
  { label: "Water / moisture signal", value: "—", hint: "e.g. NDWI summary" },
];

export function AnalysisSummarySection() {
  return (
    <SectionCard
      title="Analysis summary"
      subtitle="Concise indicators and narrative risk context — populated after backend analysis exists."
    >
      <ul className="space-y-3">
        {PLACEHOLDERS.map((row) => (
          <li
            key={row.label}
            className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-slate-200">{row.label}</p>
              <p className="text-xs text-slate-500">{row.hint}</p>
            </div>
            <span className="font-mono text-lg text-brand-500">{row.value}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
