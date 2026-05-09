import { BackendStatusBanner } from "./BackendStatusBanner";
import { InfrastructureSnapshot } from "../dashboard/InfrastructureSnapshot";
import { IndicatorsDashboard } from "../dashboard/IndicatorsDashboard";
import { NarrativeBrief } from "../dashboard/NarrativeBrief";
import { TemporalComparison } from "../dashboard/TemporalComparison";
import { AnalysisMapPanel } from "../map/AnalysisMapPanel";
import { AoiInputSection } from "../sections/AoiInputSection";
import { AnalysisSummarySection } from "../sections/AnalysisSummarySection";
import { ReportExportSection } from "../sections/ReportExportSection";
import { StacPreviewSection } from "../sections/StacPreviewSection";
import { useClimateRiskWorkflow } from "../../hooks/useClimateRiskWorkflow";

export function AppShell() {
  const w = useClimateRiskWorkflow();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(34,211,238,0.07),transparent)] bg-slate-950">
      <header className="border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-500/95">
                Climate & infrastructure intelligence
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                ClimateRisk Sentinel
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-400">
                Screen a geographic area of interest with open geospatial data: AOI validation, Sentinel-2 surface
                proxies, OSM infrastructure context, and a transparent heuristic index — for orientation and triage, not
                insured loss prediction.
              </p>
              <p className="mt-5 inline-flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                <span>Open data</span>
                <span className="text-slate-700">·</span>
                <span>Reproducible queries</span>
                <span className="text-slate-700">·</span>
                <span>Honest limitations</span>
              </p>
            </div>
            <div className="shrink-0 text-left text-xs text-slate-500 lg:text-right">
              {w.version ? (
                <>
                  <p className="font-mono text-sm text-slate-300">
                    API {w.version.api_version} · {w.version.version}
                  </p>
                  <p className="mt-2">{w.version.name}</p>
                </>
              ) : (
                <p className="text-slate-400">{w.backendError ?? "Connecting to API…"}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <BackendStatusBanner message={w.version ? null : w.backendError} />

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-10">
        <div className="space-y-12">
          <AnalysisMapPanel
            aoiGeometry={w.aoiGeometry}
            centroid={w.centroid}
            analysisActive={w.analysisResult !== null}
            analysisLoading={w.analysisLoading}
            apiOnline={w.apiOnline}
            onDrawPolygon={w.onDrawPolygon}
            onClearDraw={w.onClearDraw}
          />

          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-8 lg:col-span-5">
              <AoiInputSection
                coordsText={w.coordsText}
                onCoordsChange={w.setCoordsText}
                onApplyText={w.applyTextCoords}
                onValidate={w.runValidate}
                onSave={w.runSave}
                onSearchStac={w.runStacSearch}
                onRunAnalysis={w.runAnalysisPipeline}
                busy={w.busy || w.stacLoading || w.analysisLoading}
                error={w.error}
                dbAvailable={w.dbAvailable}
                savedAoiId={w.savedAoiId}
                apiOnline={w.apiOnline}
              />
              <AnalysisSummarySection metadata={w.metadata} warnings={w.warnings} />
              <StacPreviewSection
                datasetPreview={w.stacPreview}
                loading={w.stacLoading}
                apiOnline={w.apiOnline}
              />
            </div>

            <div className="space-y-8 lg:col-span-7">
              <IndicatorsDashboard
                result={w.analysisResult}
                loading={w.analysisLoading}
                apiOnline={w.apiOnline}
                onClearResults={w.clearAnalysis}
              />

              <InfrastructureSnapshot result={w.analysisResult} />

              <TemporalComparison result={w.analysisResult} />

              <NarrativeBrief narrative={w.analysisResult?.narrative_summary ?? null} />

              <ReportExportSection result={w.analysisResult} />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/90 py-10 text-center text-xs leading-relaxed text-slate-600">
        <p>
          Microsoft Planetary Computer (STAC) · OpenStreetMap · ClimateRisk Sentinel — infrastructure & climate context
        </p>
      </footer>
    </div>
  );
}
