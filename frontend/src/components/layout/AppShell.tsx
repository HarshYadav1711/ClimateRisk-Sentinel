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
import { AoiInputSection } from "../sections/AoiInputSection";
import { AnalysisResultsSection } from "../sections/AnalysisResultsSection";
import { AnalysisSummarySection } from "../sections/AnalysisSummarySection";
import { LayersSection } from "../sections/LayersSection";
import { MapSection } from "../sections/MapSection";
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
              AOI ingestion, validation, and Planetary Computer STAC discovery — open data only, reproducible
              queries.
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
          <LayersSection />
          <div className="lg:col-span-2">
            <MapSection
              aoiGeometry={aoiGeometry}
              onDrawPolygon={onDrawPolygon}
              onClearDraw={onClearDraw}
            />
          </div>
          <AnalysisSummarySection metadata={metadata} warnings={warnings} />
          <StacPreviewSection
            datasetPreview={stacPreview}
            loading={stacLoading}
          />
          <AnalysisResultsSection result={analysisResult} loading={analysisLoading} />
          <ReportExportSection />
        </div>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        AOI pipeline · Microsoft Planetary Computer STAC · Map tiles © OpenStreetMap contributors
      </footer>
    </div>
  );
}
