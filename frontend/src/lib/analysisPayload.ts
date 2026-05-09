import type { AnalysisRunResponse } from "./api";

export type SceneEvaluated = {
  scene_id: string;
  datetime: string | null;
  ndvi_mean: number | null;
  ndwi_mean: number | null;
  ndbi_mean: number | null;
};

/** Parsed from `machine_summary.scenes_evaluated` when present. */
export function scenesEvaluated(result: AnalysisRunResponse): SceneEvaluated[] {
  const raw = result.machine_summary.scenes_evaluated;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const o = row as Record<string, unknown>;
      return {
        scene_id: typeof o.scene_id === "string" ? o.scene_id : "",
      datetime:
          typeof o.datetime === "string"
            ? o.datetime
            : o.datetime === null
              ? null
              : null,
        ndvi_mean: typeof o.ndvi_mean === "number" ? o.ndvi_mean : null,
        ndwi_mean: typeof o.ndwi_mean === "number" ? o.ndwi_mean : null,
        ndbi_mean: typeof o.ndbi_mean === "number" ? o.ndbi_mean : null,
      } satisfies SceneEvaluated;
    })
    .filter((s): s is SceneEvaluated => s !== null && s.scene_id.length > 0);
}
