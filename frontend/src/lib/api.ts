import { fetchJson } from "./http";

/**
 * Split hosting: set `VITE_API_BASE_URL` to the public API origin (no trailing slash), e.g.
 * `https://climate-risk-api.onrender.com`. Omit or leave empty for local dev — requests use
 * relative `/api/...` and the Vite dev proxy.
 */
function apiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw == null || typeof raw !== "string") return "";
  const t = raw.trim();
  if (!t) return "";
  return t.replace(/\/+$/, "");
}

const API_BASE = apiBaseUrl();

export type HealthPayload = {
  status: string;
  service: string;
  database?: boolean;
};

export type VersionPayload = {
  name: string;
  version: string;
  api_version: string;
};

export type AOIMetadata = {
  bbox: Record<string, number>;
  centroid: Record<string, number>;
  area_km2: number;
  vertex_count_exterior: number;
};

export type ValidateAOIResponse = {
  normalized_geometry: GeoJSON.Polygon;
  metadata: AOIMetadata;
  warnings: string[];
};

export type AOICreatedResponse = {
  id: string;
  normalized_geometry: GeoJSON.Polygon;
  metadata: AOIMetadata;
  warnings: string[];
};

export type DatasetSearchResponse = {
  catalog_url: string;
  collection: string;
  bbox: Record<string, number>;
  datetime_range: string;
  items: Array<Record<string, unknown>>;
  cache: string;
};

export async function fetchHealth(): Promise<HealthPayload> {
  return fetchJson<HealthPayload>(`${API_BASE}/api/v1/health`);
}

export async function fetchVersion(): Promise<VersionPayload> {
  return fetchJson<VersionPayload>(`${API_BASE}/api/v1/version`);
}

export async function validateAoiGeometry(geometry: GeoJSON.Polygon): Promise<ValidateAOIResponse> {
  return fetchJson<ValidateAOIResponse>(`${API_BASE}/api/v1/aoi/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ geometry }),
  });
}

export async function saveAoi(geometry: GeoJSON.Polygon, label?: string): Promise<AOICreatedResponse> {
  return fetchJson<AOICreatedResponse>(`${API_BASE}/api/v1/aoi/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ geometry, label }),
  });
}

export async function searchDatasets(params: {
  geometry?: GeoJSON.Polygon;
  aoiId?: string;
}): Promise<DatasetSearchResponse> {
  const body =
    params.aoiId != null
      ? { aoi_id: params.aoiId }
      : { geometry: params.geometry };
  return fetchJson<DatasetSearchResponse>(`${API_BASE}/api/v1/datasets/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type AnalysisIndicator = {
  key: string;
  label: string;
  definition: string;
  value: number | null;
  unit: string;
  caveat: string | null;
};

/** Mirrors backend `temporal` — dates are fixed by the pipeline (not user-selectable). */
export type AnalysisTemporal = {
  ndvi_delta?: number | null;
  newer_scene_id?: string;
  older_scene_id?: string;
  summary_sentence?: string;
};

export type AnalysisRunResponse = {
  partial_analysis: boolean;
  caveats: string[];
  area_km2: number;
  indicators: AnalysisIndicator[];
  infrastructure: { roads_length_km: number | null; nearest_waterway_km: number | null };
  temporal: AnalysisTemporal & Record<string, unknown>;
  risk: { score_0_100: number; explanation: string; component_notes: string[] };
  narrative_summary: string;
  machine_summary: Record<string, unknown>;
};

/** Raster + network work — avoid hanging forever on slow responses. */
const ANALYSIS_TIMEOUT_MS = 120_000;

export async function runAnalysis(params: {
  geometry?: GeoJSON.Polygon;
  aoiId?: string;
}): Promise<AnalysisRunResponse> {
  const body = params.aoiId != null ? { aoi_id: params.aoiId } : { geometry: params.geometry };
  return fetchJson<AnalysisRunResponse>(`${API_BASE}/api/v1/analysis/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeoutMs: ANALYSIS_TIMEOUT_MS,
  });
}
