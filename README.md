# ClimateRisk Sentinel

Monorepo for an infrastructure-oriented **climate / geospatial** product: a **React + Leaflet** analyst UI and a **FastAPI** backend that validates AOIs, persists them to **PostGIS** (optional), and discovers **Sentinel-2 L2A** scenes via the **Microsoft Planetary Computer public STAC API** (no billing).

### Design (short)

```text
frontend/          React · AOI text + map draw · calls REST
backend/app/api/routes   Thin HTTP adapters
backend/app/schemas      Pydantic wire formats
backend/app/domain       AOI concepts (extend freely)
backend/app/services     geometry validation · STAC metadata (+ TTL cache)
backend/app/db           PostGIS persistence (stored AOIs)
```

**Flow:** the UI sends a GeoJSON Polygon (WGS84) → the backend normalizes/repairs with **Shapely**, computes bbox/area, optionally stores geometry → **pystac-client** queries Planetary Computer with **fixed sort/limit/filters** so results are reproducible. Responses can be **cached in-memory** by deterministic keys (bbox + collection + datetime window).

---

## Prerequisites

- Python **3.11+**, [uv](https://docs.astral.sh/uv/) (or pip).
- Node **20+**.
- **Docker** (optional, for PostGIS) — AOI validation + STAC search work **without** Postgres; **saving** an AOI requires the DB.

---

## 1. Database (optional but recommended)

```bash
docker compose up -d
```

Credentials match `.env.example` → copy to `backend/.env`.

---

## 2. Backend

```bash
cd backend
cp ../.env.example .env      # Linux/macOS/Git Bash
copy ..\\.env.example .env    # Windows
uv sync
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Key endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/health` | Liveness + `database` flag |
| POST | `/api/v1/aoi/validate` | Normalize & validate polygon; returns metadata |
| POST | `/api/v1/aoi/` | Persist AOI (503 if DB down) |
| GET | `/api/v1/aoi/{id}` | Fetch stored AOI |
| POST | `/api/v1/datasets/search` | STAC search (`geometry` **xor** `aoi_id`) |
| POST | `/api/v1/analysis/run` | Geospatial indicators + heuristic risk index (`geometry` **xor** `aoi_id`) |

Interactive docs: `/docs`

---

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173` — Vite proxies `/api` to port **8000**.

---

## Data sources

- **AOI footprint:** user-drawn or pasted lon/lat vertices (WGS84).
- **STAC:** [Planetary Computer](https://planetarycomputer.microsoft.com/) `sentinel-2-l2a` metadata (public STAC; asset URLs are accessed via the official signing helpers when you extend downloads).

No paid geocoding, no Earth Engine, no proprietary map APIs — basemap tiles are **OpenStreetMap**.

---

## Limits & behavior

- AOI area capped by `max_aoi_area_km2` (see `backend/app/config.py`).
- **Analysis:** raster-derived proxies (e.g. vegetation / water / built-up indices from Sentinel-2) run only when the AOI is within `analysis_max_aoi_area_km2`; larger AOIs still return vector/OSM metrics where possible with explicit caveats. The composite score is a **transparent heuristic** for decision support — **not** a calibrated damage or flood forecast.
- Invalid polygons return **400** with a clear reason; light repair (`buffer(0)`, ring closing) may emit **warnings**.
- STAC queries use deterministic parameters; identical AOI bbox hit an in-process TTL cache (`metadata_cache_*` settings).

---

## Screenshots

Drop PNGs in `docs/screenshots/` when presenting the UI.
