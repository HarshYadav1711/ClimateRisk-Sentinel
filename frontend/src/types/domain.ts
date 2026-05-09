/**
 * Frontend shapes aligned with backend domain evolution (AOI, indicators, jobs).
 * Used for typing UI state before APIs are wired.
 */

export type GeoJsonPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export type AnalysisJobStatus = "idle" | "pending" | "running" | "succeeded" | "failed";

export interface IndicatorPreview {
  key: string;
  label: string;
  value: number | null;
  unit: string;
}

export interface LayerToggleState {
  id: string;
  label: string;
  enabled: boolean;
}
