import type { AnalysisRunResponse } from "./api";

export function buildSummaryText(result: AnalysisRunResponse): string {
  const lines: string[] = [
    "ClimateRisk Sentinel — analysis summary",
    "—",
    "This is a heuristic screening output, not a calibrated hazard or damage forecast.",
    "",
    `Heuristic exposure index: ${result.risk.score_0_100.toFixed(1)} / 100`,
    result.risk.explanation,
    "",
    `AOI area: ${result.area_km2.toFixed(3)} km²`,
    result.partial_analysis ? "Status: partial analysis (see caveats)" : "Status: complete within stated limits",
    "",
    "Caveats:",
    ...(result.caveats.length ? result.caveats.map((c) => `• ${c}`) : ["• None recorded"]),
    "",
    "Indicators:",
    ...result.indicators.map((i) => {
      const v =
        i.value === null || i.value === undefined ? "n/a" : `${i.value}${i.unit ? ` ${i.unit}` : ""}`;
      const tail = i.caveat ? ` — note: ${i.caveat}` : "";
      return `• ${i.label}: ${v}${tail}`;
    }),
    "",
    "Infrastructure (OSM-derived):",
    `• Road length in AOI bbox: ${
      result.infrastructure.roads_length_km != null
        ? `${result.infrastructure.roads_length_km.toFixed(3)} km`
        : "n/a"
    }`,
    `• Nearest mapped waterway: ${
      result.infrastructure.nearest_waterway_km != null
        ? `${result.infrastructure.nearest_waterway_km.toFixed(3)} km`
        : "n/a"
    }`,
    "",
    "Temporal (when two scenes available):",
    typeof result.temporal.summary_sentence === "string"
      ? result.temporal.summary_sentence
      : JSON.stringify(result.temporal),
    "",
    "Narrative:",
    result.narrative_summary,
  ];
  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown): void {
  downloadTextFile(filename, `${JSON.stringify(data, null, 2)}\n`, "application/json;charset=utf-8");
}
