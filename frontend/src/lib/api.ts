const API_BASE = "";

function parseFastApiDetail(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Request failed";
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "object" && item && "msg" in item
          ? String((item as { msg?: unknown }).msg)
          : JSON.stringify(item),
      )
      .join("; ");
  }
  return "Request failed";
}

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
  const res = await fetch(`${API_BASE}/api/v1/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json() as Promise<HealthPayload>;
}

export async function fetchVersion(): Promise<VersionPayload> {
  const res = await fetch(`${API_BASE}/api/v1/version`);
  if (!res.ok) throw new Error(`Version check failed: ${res.status}`);
  return res.json() as Promise<VersionPayload>;
}

export async function validateAoiGeometry(geometry: GeoJSON.Polygon): Promise<ValidateAOIResponse> {
  const res = await fetch(`${API_BASE}/api/v1/aoi/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ geometry }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseFastApiDetail(err) || res.statusText);
  }
  return res.json() as Promise<ValidateAOIResponse>;
}

export async function saveAoi(geometry: GeoJSON.Polygon, label?: string): Promise<AOICreatedResponse> {
  const res = await fetch(`${API_BASE}/api/v1/aoi/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ geometry, label }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseFastApiDetail(err) || res.statusText);
  }
  return res.json() as Promise<AOICreatedResponse>;
}

export async function searchDatasets(params: {
  geometry?: GeoJSON.Polygon;
  aoiId?: string;
}): Promise<DatasetSearchResponse> {
  const body =
    params.aoiId != null
      ? { aoi_id: params.aoiId }
      : { geometry: params.geometry };
  const res = await fetch(`${API_BASE}/api/v1/datasets/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseFastApiDetail(err) || res.statusText);
  }
  return res.json() as Promise<DatasetSearchResponse>;
}
