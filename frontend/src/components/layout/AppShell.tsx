import { useCallback, useEffect, useState } from "react";
import {
  fetchHealth,
  fetchVersion,
  runAnalysis,
  saveAoi,
  searchDatasets,
  validateAoiGeometry,
  type AOIMetadata,
  type AnalysisRunResponse,
  type DatasetSearchResponse,
  type VersionPayload,
} from "../../lib/api";
import { ensureClosedRing, polygonFromLonLatText } from "../../geo/polygonText";
import type { GeoJsonPolygon } from "../../types/domain";
import { InfrastructureSnapshot } from "../dashboard/InfrastructureSnapshot";
import { IndicatorsDashboard } from "../dashboard/IndicatorsDashboard";
import { NarrativeBrief } from "../dashboard/NarrativeBrief";
import { TemporalComparison } from "../dashboard/TemporalComparison";
import { AnalysisMapPanel } from "../map/AnalysisMapPanel";
import { AoiInputSection } from "../sections/AoiInputSection";
import { AnalysisSummarySection } from "../sections/AnalysisSummarySection";
import { ReportExportSection } from "../sections/ReportExportSection";
import { StacPreviewSection } from "../sections/StacPreviewSection";

export function AppShell() {
  const [version, setVersion] = useState<VersionPayload | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(null);

  const [coordsText, setCoordsText] = useState("");
  const [aoiGeometry, setAoiGeometry] = useState<GeoJsonPolygon | null>(null);
  const [validatedGeometry, setValidatedGeometry] = useState<GeoJsonPolygon | null>(null);
  const [metadata, setMetadata] = useState<AOIMetadata | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [savedAoiId, setSavedAoiId] = useState<string | null>(null);
  const [stacPreview, setStacPreview] = useState<DatasetSearchResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisRunResponse | null>(null);

  const [busy, setBusy] = useState(false);
  const [stacLoading, setStacLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const h = await fetchHealth();
        const v = await fetchVersion();
        if (!cancelled) {
          setVersion(v);
          setDbAvailable(h.database ?? false);
        }
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

  const clearAnalysis = useCallback(() => {
    setAnalysisResult(null);
  }, []);

  const applyTextCoords = useCallback(() => {
    setError(null);
    try {
      const poly = ensureClosedRing(polygonFromLonLatText(coordsText));
      setAoiGeometry(poly);
      setValidatedGeometry(null);
      setMetadata(null);
      setWarnings([]);
      setStacPreview(null);
      setSavedAoiId(null);
      setAnalysisResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse coordinates.");
    }
  }, [coordsText]);

  const onDrawPolygon = useCallback((g: GeoJsonPolygon) => {
    setError(null);
    const poly = ensureClosedRing(g);
    setAoiGeometry(poly);
    setValidatedGeometry(null);
    setMetadata(null);
    setWarnings([]);
    setStacPreview(null);
    setSavedAoiId(null);
    setAnalysisResult(null);
  }, []);

  const onClearDraw = useCallback(() => {
    setAoiGeometry(null);
    setValidatedGeometry(null);
    setMetadata(null);
    setWarnings([]);
    setStacPreview(null);
    setAnalysisResult(null);
  }, []);

  const runValidate = useCallback(async () => {
    if (!aoiGeometry) {
      setError("Define an AOI by drawing or pasting coordinates.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await validateAoiGeometry(aoiGeometry);
      setValidatedGeometry(res.normalized_geometry as GeoJsonPolygon);
      setAoiGeometry(res.normalized_geometry as GeoJsonPolygon);
      setMetadata(res.metadata);
      setWarnings(res.warnings);
      setAnalysisResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validation failed.");
    } finally {
      setBusy(false);
    }
  }, [aoiGeometry]);

  const runSave = useCallback(async () => {
    const geom = validatedGeometry ?? aoiGeometry;
    if (!geom) {
      setError("Nothing to save — validate or draw an AOI first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await saveAoi(geom);
      setSavedAoiId(res.id);
      setValidatedGeometry(res.normalized_geometry as GeoJsonPolygon);
      setMetadata(res.metadata);
      setWarnings(res.warnings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }, [aoiGeometry, validatedGeometry]);

  const runStacSearch = useCallback(async () => {
    setError(null);
    const geom = validatedGeometry ?? aoiGeometry;
    if (geom) {
      setStacLoading(true);
      try {
        const res = await searchDatasets({ geometry: geom });
        setStacPreview(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "STAC search failed.");
      } finally {
        setStacLoading(false);
      }
      return;
    }
    if (savedAoiId) {
      setStacLoading(true);
      try {
        const res = await searchDatasets({ aoiId: savedAoiId });
        setStacPreview(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "STAC search failed.");
      } finally {
        setStacLoading(false);
      }
      return;
    }
    setError("Draw or paste an AOI (or save one), then search STAC.");
  }, [aoiGeometry, validatedGeometry, savedAoiId]);

  const runAnalysisPipeline = useCallback(async () => {
    setError(null);
    const geom = validatedGeometry ?? aoiGeometry;
    if (geom) {
      setAnalysisLoading(true);
      try {
        const res = await runAnalysis({ geometry: geom });
        setAnalysisResult(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed.");
      } finally {
        setAnalysisLoading(false);
      }
      return;
    }
    if (savedAoiId) {
      setAnalysisLoading(true);
      try {
        const res = await runAnalysis({ aoiId: savedAoiId });
        setAnalysisResult(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed.");
      } finally {
        setAnalysisLoading(false);
      }
      return;
    }
    setError("Validate or draw an AOI first, or save an AOI to analyze by id.");
  }, [aoiGeometry, validatedGeometry, savedAoiId]);

  const centroid =
    metadata?.centroid != null &&
    typeof metadata.centroid.lon === "number" &&
    typeof metadata.centroid.lat === "number"
      ? { lon: metadata.centroid.lon, lat: metadata.centroid.lat }
      : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(34,211,238,0.07),transparent)] bg-slate-950">
      <header className="border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-500/95">
                Climate intelligence
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                ClimateRisk Sentinel
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-400">
                Define an area once — validate it, screen it with open data, and read an explainable summary. Built for
                fast orientation, not hidden models.
              </p>
              <p className="mt-5 inline-flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                <span>Open data sources</span>
                <span className="text-slate-700">·</span>
                <span>Heuristic indices</span>
                <span className="text-slate-700">·</span>
                <span>Not a damage forecast</span>
              </p>
            </div>
            <div className="shrink-0 text-left text-xs text-slate-500 lg:text-right">
              {version ? (
                <>
                  <p className="font-mono text-sm text-slate-300">
                    API {version.api_version} · {version.version}
                  </p>
                  <p className="mt-2">{version.name}</p>
                </>
              ) : (
                <p className="text-slate-400">{backendError ?? "Connecting to API…"}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-10">
        <div className="space-y-12">
          <AnalysisMapPanel
            aoiGeometry={aoiGeometry}
            centroid={centroid}
            analysisActive={analysisResult !== null}
            analysisLoading={analysisLoading}
            onDrawPolygon={onDrawPolygon}
            onClearDraw={onClearDraw}
          />

          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-8 lg:col-span-5">
              <AoiInputSection
                coordsText={coordsText}
                onCoordsChange={setCoordsText}
                onApplyText={applyTextCoords}
                onValidate={runValidate}
                onSave={runSave}
                onSearchStac={runStacSearch}
                onRunAnalysis={runAnalysisPipeline}
                busy={busy || stacLoading || analysisLoading}
                error={error}
                dbAvailable={dbAvailable}
                savedAoiId={savedAoiId}
              />
              <AnalysisSummarySection metadata={metadata} warnings={warnings} />
              <StacPreviewSection datasetPreview={stacPreview} loading={stacLoading} />
            </div>

            <div className="space-y-8 lg:col-span-7">
              <IndicatorsDashboard
                result={analysisResult}
                loading={analysisLoading}
                onClearResults={clearAnalysis}
              />

              <InfrastructureSnapshot result={analysisResult} />

              <TemporalComparison result={analysisResult} />

              <NarrativeBrief narrative={analysisResult?.narrative_summary ?? null} />

              <ReportExportSection result={analysisResult} />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/90 py-10 text-center text-xs leading-relaxed text-slate-600">
        <p>Planetary Computer STAC · OpenStreetMap · Map tiles © OpenStreetMap contributors</p>
      </footer>
    </div>
  );
}
