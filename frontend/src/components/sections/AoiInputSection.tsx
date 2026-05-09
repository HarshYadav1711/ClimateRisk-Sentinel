import { SectionCard } from "../layout/SectionCard";

type Props = {
  coordsText: string;
  onCoordsChange: (v: string) => void;
  onApplyText: () => void;
  onValidate: () => void;
  onSave: () => void;
  onSearchStac: () => void;
  busy: boolean;
  error: string | null;
  dbAvailable: boolean | null;
  savedAoiId: string | null;
};

export function AoiInputSection({
  coordsText,
  onCoordsChange,
  onApplyText,
  onValidate,
  onSave,
  onSearchStac,
  busy,
  error,
  dbAvailable,
  savedAoiId,
}: Props) {
  return (
    <SectionCard
      title="Area of interest"
      subtitle="Longitude / latitude pairs (one per line), or draw on the map. Server validates WGS84 polygons."
    >
      <textarea
        aria-label="AOI vertices as longitude latitude pairs"
        value={coordsText}
        onChange={(e) => onCoordsChange(e.target.value)}
        placeholder={"Example:\n-104.98 39.74\n-104.88 39.74\n-104.88 39.82\n-104.98 39.82"}
        rows={6}
        className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 font-mono text-sm text-slate-200 placeholder:text-slate-600"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onApplyText}
          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
        >
          Apply text to map
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onValidate}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-100 hover:border-brand-500 disabled:opacity-40"
        >
          Validate with API
        </button>
        <button
          type="button"
          disabled={busy || dbAvailable === false}
          title={dbAvailable === false ? "Start Postgres (docker compose) to persist AOIs" : undefined}
          onClick={onSave}
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-brand-500 disabled:opacity-40"
        >
          Save AOI
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onSearchStac}
          className="rounded-lg border border-brand-700/50 px-3 py-2 text-sm font-medium text-brand-200 hover:bg-brand-950/40 disabled:opacity-40"
        >
          Search Sentinel-2 (STAC)
        </button>
      </div>
      {dbAvailable === false ? (
        <p className="mt-2 text-xs text-amber-300/90">
          PostGIS offline — validation and STAC search still work; saving AOI requires{" "}
          <code className="rounded bg-slate-800 px-1">docker compose up -d</code>.
        </p>
      ) : null}
      {savedAoiId ? (
        <p className="mt-2 font-mono text-xs text-emerald-400">Saved AOI id: {savedAoiId}</p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
    </SectionCard>
  );
}
