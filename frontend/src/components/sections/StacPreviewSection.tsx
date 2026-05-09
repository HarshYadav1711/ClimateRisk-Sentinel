import { SectionCard } from "../layout/SectionCard";

type Props = {
  datasetPreview: {
    cache: string;
    items: Array<Record<string, unknown>>;
    datetime_range: string;
  } | null;
  loading: boolean;
  apiOnline: boolean;
};

export function StacPreviewSection({ datasetPreview, loading, apiOnline }: Props) {
  return (
    <SectionCard
      title="Planetary Computer (STAC)"
      subtitle="Sentinel-2 L2A scene metadata — deterministic query parameters on the server."
    >
      {!apiOnline ? (
        <p className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-400">
          Connect the API to search the catalog.
        </p>
      ) : loading ? (
        <p className="animate-pulse text-sm text-slate-500">Searching catalog…</p>
      ) : datasetPreview ? (
        <>
          <p className="text-xs text-slate-500">
            Cache: <span className="text-slate-300">{datasetPreview.cache}</span> · Range:{" "}
            {datasetPreview.datetime_range}
          </p>
          <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-xs">
            {datasetPreview.items.slice(0, 12).map((it) => (
              <li
                key={String(it.id)}
                className="rounded border border-slate-800 bg-slate-950/50 px-2 py-1 font-mono text-slate-400"
              >
                {String(it.id).slice(0, 56)}… · clouds{" "}
                {it.cloud_cover != null ? Number(it.cloud_cover).toFixed(1) : "?"}%
              </li>
            ))}
          </ul>
          {datasetPreview.items.length === 0 ? (
            <p className="mt-2 text-sm text-amber-200/90">
              No scenes matched filters — try another AOI or adjust cloud/date settings on the API.
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-slate-500">Click “Search Sentinel-2 (STAC)” after defining an AOI.</p>
      )}
    </SectionCard>
  );
}
