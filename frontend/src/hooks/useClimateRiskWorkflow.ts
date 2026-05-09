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
} from "../lib/api";
import { ensureClosedRing, polygonFromLonLatText } from "../geo/polygonText";
import type { GeoJsonPolygon } from "../types/domain";

export function useClimateRiskWorkflow() {
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
          setBackendError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setBackendError(e instanceof Error ? e.message : "Backend unreachable.");
          setVersion(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const apiOnline = version !== null;

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
    try {
      const poly = ensureClosedRing(g);
      setAoiGeometry(poly);
      setValidatedGeometry(null);
      setMetadata(null);
      setWarnings([]);
      setStacPreview(null);
      setSavedAoiId(null);
      setAnalysisResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid drawn geometry.");
    }
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
    if (!apiOnline) {
      setError("API is offline — start the backend before validating.");
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
  }, [aoiGeometry, apiOnline]);

  const runSave = useCallback(async () => {
    const geom = validatedGeometry ?? aoiGeometry;
    if (!geom) {
      setError("Nothing to save — validate or draw an AOI first.");
      return;
    }
    if (!apiOnline) {
      setError("API is offline — cannot save.");
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
  }, [aoiGeometry, validatedGeometry, apiOnline]);

  const runStacSearch = useCallback(async () => {
    setError(null);
    if (!apiOnline) {
      setError("API is offline — cannot search STAC.");
      return;
    }
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
  }, [aoiGeometry, validatedGeometry, savedAoiId, apiOnline]);

  const runAnalysisPipeline = useCallback(async () => {
    setError(null);
    if (!apiOnline) {
      setError("API is offline — cannot run analysis.");
      return;
    }
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
  }, [aoiGeometry, validatedGeometry, savedAoiId, apiOnline]);

  const centroid =
    metadata?.centroid != null &&
    typeof metadata.centroid.lon === "number" &&
    typeof metadata.centroid.lat === "number"
      ? { lon: metadata.centroid.lon, lat: metadata.centroid.lat }
      : null;

  return {
    version,
    backendError,
    dbAvailable,
    apiOnline,
    coordsText,
    setCoordsText,
    aoiGeometry,
    validatedGeometry,
    metadata,
    warnings,
    savedAoiId,
    stacPreview,
    analysisResult,
    busy,
    stacLoading,
    analysisLoading,
    error,
    centroid,
    clearAnalysis,
    applyTextCoords,
    onDrawPolygon,
    onClearDraw,
    runValidate,
    runSave,
    runStacSearch,
    runAnalysisPipeline,
  };
}
