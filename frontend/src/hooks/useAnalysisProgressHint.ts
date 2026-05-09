import { useEffect, useState } from "react";

import { ANALYSIS_PROGRESS_HINTS } from "../lib/analysisLoadingHints";

const N = ANALYSIS_PROGRESS_HINTS.length;

/**
 * Cycles hints while `active` — reduces perceived stall during raster-heavy runs.
 */
export function useAnalysisProgressHint(active: boolean, rotateMs = 6500) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    setIndex(0);
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % N);
    }, rotateMs);
    return () => window.clearInterval(id);
  }, [active, rotateMs]);

  const hint = active ? ANALYSIS_PROGRESS_HINTS[index] : "";
  return { hint, index };
}
