const API_BASE = "";

export type HealthPayload = {
  status: string;
  service: string;
};

export type VersionPayload = {
  name: string;
  version: string;
  api_version: string;
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
