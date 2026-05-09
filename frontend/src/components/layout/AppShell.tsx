import { useEffect, useState } from "react";
import { fetchHealth, fetchVersion, type VersionPayload } from "../../lib/api";
import { AoiInputSection } from "../sections/AoiInputSection";
import { AnalysisSummarySection } from "../sections/AnalysisSummarySection";
import { LayersSection } from "../sections/LayersSection";
import { MapSection } from "../sections/MapSection";
import { ReportExportSection } from "../sections/ReportExportSection";

export function AppShell() {
  const [version, setVersion] = useState<VersionPayload | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchHealth();
        const v = await fetchVersion();
        if (!cancelled) setVersion(v);
      } catch (e) {
        if (!cancelled) {
          setBackendError(e instanceof Error ? e.message : "Backend unreachable");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 sm:flex-row sm:items-end sm:justify-between lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-500">
              Climate intelligence
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">ClimateRisk Sentinel</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Infrastructure-oriented exposure screening against open climate and map data — heuristic,
              explainable, and built for iterative delivery.
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            {version ? (
              <>
                <p className="font-mono text-slate-300">
                  API {version.api_version} · {version.version}
                </p>
                <p className="mt-1">{version.name}</p>
              </>
            ) : (
              <p>{backendError ?? "Connecting to API…"}</p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <AoiInputSection />
          <LayersSection />
          <div className="lg:col-span-2">
            <MapSection />
          </div>
          <AnalysisSummarySection />
          <ReportExportSection />
        </div>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        Free/open data only · No authentication in skeleton · Map tiles © OpenStreetMap contributors
      </footer>
    </div>
  );
}
