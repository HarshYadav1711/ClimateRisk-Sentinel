type Props = {
  message: string | null;
};

/**
 * Shown when health/version cannot be loaded — avoids silent failures during review demos.
 */
export function BackendStatusBanner({ message }: Props) {
  if (!message) return null;
  return (
    <div className="border-b border-amber-900/45 bg-amber-950/35 px-4 py-3 text-center text-sm text-amber-50/95">
      <span className="font-semibold">API unreachable.</span>{" "}
      <span className="text-amber-100/85">{message}</span>{" "}
      <span className="text-amber-200/70">
        Start the FastAPI server (<code className="rounded bg-amber-950/80 px-1">uv run uvicorn …</code>) and ensure the
        UI proxies <code className="rounded bg-amber-950/80 px-1">/api</code> to port 8000.
      </span>
    </div>
  );
}
