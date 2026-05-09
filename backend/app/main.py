from contextlib import asynccontextmanager
import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
from starlette.requests import Request

from app.api.router import api_router
from app.config import get_settings
from app.db.session import init_db

_log = logging.getLogger("climate_risk_sentinel")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_available = False
    try:
        init_db()
        app.state.db_available = True
        _log.info("PostGIS schema ready.")
    except OperationalError as exc:
        _log.warning(
            "PostgreSQL unavailable (%s). AOI persistence disabled; geometry + STAC search still work.",
            exc.orig if getattr(exc, "orig", None) else exc,
        )
    except Exception:
        _log.exception("Unexpected failure during database initialization.")
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def timing_middleware(request: Request, call_next):
        t0 = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
        if request.url.path.startswith("/api"):
            _log.info("%s %s %.2fms", request.method, request.url.path, elapsed_ms)
        return response

    application.include_router(api_router)
    return application


app = create_app()


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "ClimateRisk Sentinel",
        "docs": "/docs",
        "health": "/api/v1/health",
        "version": "/api/v1/version",
        "aoi_validate": "/api/v1/aoi/validate",
        "aoi_save": "/api/v1/aoi/",
        "datasets_search": "/api/v1/datasets/search",
        "analysis_run": "/api/v1/analysis/run",
    }
