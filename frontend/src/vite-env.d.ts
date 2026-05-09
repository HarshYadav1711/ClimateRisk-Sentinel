/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public API origin for production builds (no trailing slash). */
  readonly VITE_API_BASE_URL?: string;
  /** Override Vite dev proxy target for `/api` (default `http://127.0.0.1:8000`). */
  readonly VITE_DEV_PROXY_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
