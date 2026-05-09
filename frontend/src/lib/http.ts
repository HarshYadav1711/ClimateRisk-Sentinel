/**
 * Small fetch helpers for a single API origin. Surfaces network failures as clear, actionable errors.
 */

const DEFAULT_TIMEOUT_MESSAGE =
  "Request timed out. The AOI may be large, the network slow, or the API busy — try again or use a smaller area.";

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

export type FetchJsonOptions = RequestInit & {
  /** AbortController timeout in ms (browser fetch). */
  timeoutMs?: number;
};

/**
 * JSON request with optional timeout. Throws human-readable Errors on network and HTTP failures.
 */
export async function fetchJson<T>(url: string, init?: FetchJsonOptions): Promise<T> {
  const { timeoutMs, signal: outerSignal, ...rest } = init ?? {};
  const controller = new AbortController();
  if (outerSignal) {
    if (outerSignal.aborted) controller.abort();
    else outerSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (timeoutMs != null && timeoutMs > 0) {
    timer = setTimeout(() => controller.abort(), timeoutMs);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...rest, signal: controller.signal });
  } catch (e) {
    if (isAbortError(e)) {
      throw new Error(timeoutMs != null ? DEFAULT_TIMEOUT_MESSAGE : "Request was cancelled.");
    }
    if (e instanceof TypeError) {
      throw new Error(
        "Cannot reach the API. Start the backend (see README), ensure it listens on port 8000, and that the Vite dev proxy is enabled.",
      );
    }
    throw e instanceof Error ? e : new Error("Network request failed.");
  } finally {
    if (timer) clearTimeout(timer);
  }

  let payload: unknown = {};
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = { detail: text.slice(0, 400) };
    }
  }

  if (!res.ok) {
    throw new Error(parseFastApiDetail(payload) || `Request failed (${res.status}).`);
  }
  return payload as T;
}

export function parseFastApiDetail(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Request failed";
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "object" && item && "msg" in item) {
          const o = item as { msg?: unknown; loc?: unknown[] };
          const loc = Array.isArray(o.loc) ? o.loc.filter((x) => x !== "body").join(".") : "";
          const msg = String(o.msg ?? "");
          return loc ? `${loc}: ${msg}` : msg;
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }
  return "Request failed";
}
