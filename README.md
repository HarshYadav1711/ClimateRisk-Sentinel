# ClimateRisk Sentinel

**ClimateRisk Sentinel** is a monorepo for a climate / infrastructure geospatial product: a **React** analyst UI and a **FastAPI** service that will orchestrate open-data ingestion, spatial analysis, and reporting. This repository ships as a **runnable skeleton**—clean boundaries, strict typing, and placeholder domain models so features can land without refactors.

### System design (short)

```text
┌─────────────────────────────────────────────────────────────┐
│  frontend/     React + TypeScript + Tailwind + Leaflet      │
│                UI shells → future hooks into REST APIs        │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTP (/api/v1/…)
┌───────────────────────────────▼─────────────────────────────┐
│  backend/app                                                │
│    api/routes     HTTP adapters only                        │
│    schemas        Pydantic I/O contracts                    │
│    domain         Pure AOI / indicator concepts             │
│    services       Future STAC, raster, vector, scoring      │
│    utils          Shared helpers                            │
└─────────────────────────────────────────────────────────────┘
```

**Principles:** routes stay thin; **schemas** define wire formats; **domain** holds analysis concepts independent of FastAPI; **services** will encapsulate IO and algorithms (STAC, Rasterio, GeoPandas, PostGIS, etc.) as you extend. No paid APIs, no proprietary map SDKs in this baseline—the map uses **OpenStreetMap** raster tiles.

---

## Repository layout

| Path | Role |
|------|------|
| `frontend/` | Vite + React SPA: landing shell (AOI, map, summary, layers, export placeholders). |
| `backend/` | FastAPI app: `GET /api/v1/health`, `GET /api/v1/version`; expandable routers. |
| `.env.example` | Copy to `backend/.env` — optional `CORS_ORIGINS` for extra dev origins. |

---

## Local development

### Prerequisites

- **Python** 3.11+
- **Node.js** 20+ (LTS recommended)
- **[uv](https://docs.astral.sh/uv/)** for Python env management (or use `pip install -e ".[dev]"` inside `backend/`).

### Backend

```bash
cd backend
cp ../.env.example .env          # Linux / macOS / Git Bash
copy ..\.env.example .env      # Windows PowerShell
uv sync
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Docs: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/api/v1/health`
- Version: `http://127.0.0.1:8000/api/v1/version`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The dev server **proxies `/api`** to `http://127.0.0.1:8000` (see `vite.config.ts`).

### Production build (frontend)

```bash
cd frontend
npm run build
npm run preview   # optional local check of dist/
```

---

## Constraints (baseline)

- No authentication, payments, or opaque “AI” features in this skeleton.
- No Google Earth Engine; no Mapbox or other proprietary map APIs.
- Dependencies are **stable, mainstream** releases (see `backend/pyproject.toml` and `frontend/package.json`).

---

## Next extension points

1. **Routes:** Add `api/routes/aoi.py`, `analysis.py`, etc., and register them in `api/router.py`.
2. **Services:** Implement `services/geospatial_analysis.py` (STAC + Rasterio + validation).
3. **Persistence:** Introduce PostgreSQL/PostGIS behind SQLAlchemy or async drivers when needed.
4. **Frontend:** Replace disabled controls with forms that call new endpoints; layer AOI GeoJSON on the Leaflet map.

---

## License note

Map attribution: © OpenStreetMap contributors. Use tile servers in line with [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).
