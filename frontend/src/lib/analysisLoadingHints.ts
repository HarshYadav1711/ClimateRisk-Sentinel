/** Rotating copy for long-running analysis — raster I/O is typically dominant. */

export const ANALYSIS_PROGRESS_HINTS = [
  "Resolving Sentinel-2 scenes via STAC…",
  "Reading cloud-masked COGs inside your AOI — often the slowest step…",
  "Deriving OSM road and waterway context…",
  "Aggregating indicators and screening score…",
] as const;
