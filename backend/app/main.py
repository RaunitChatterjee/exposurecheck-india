"""ExposureCheck India: FastAPI application."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from app.config import Settings, get_settings
from app.db import StatsStore
from app.models import Report, ScanRequest
from app.ratelimit import SlidingWindowLimiter
from app.services.report import run_scan
from app.validation import ValidationError, normalise_domain, normalise_email

log = logging.getLogger("exposurecheck")


def create_app(settings: Settings | None = None) -> FastAPI:
    s = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.http = httpx.AsyncClient(headers={"User-Agent": s.user_agent}, follow_redirects=False)
        app.state.stats = StatsStore(s.database_url)
        yield
        await app.state.http.aclose()

    app = FastAPI(title="ExposureCheck India", version="0.1.0", lifespan=lifespan,
                  docs_url="/api/docs", openapi_url="/api/openapi.json", redoc_url=None)
    app.add_middleware(CORSMiddleware, allow_origins=s.cors_origins, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])

    per_min = SlidingWindowLimiter(s.rate_per_minute, 60)
    per_hour = SlidingWindowLimiter(s.rate_per_hour, 3600)
    global_min = SlidingWindowLimiter(s.global_per_minute, 60)

    def client_ip(request: Request) -> str:
        if s.trust_proxy:
            fwd = request.headers.get("x-forwarded-for")
            if fwd:
                return fwd.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        resp = await call_next(request)
        resp.headers["Cache-Control"] = "no-store"
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["Referrer-Policy"] = "no-referrer"
        return resp

    @app.get("/api/health")
    async def health():
        return {"status": "ok", "breach_lookup": "demo" if s.hibp_demo else ("configured" if s.hibp_api_key else "not_configured")}

    @app.get("/api/stats")
    async def stats():
        return await run_in_threadpool(app.state.stats.totals)

    @app.post("/api/scan", response_model=Report)
    async def scan(req: ScanRequest, request: Request):
        ip = client_ip(request)
        wait = max(per_min.check(ip), per_hour.check(ip), global_min.check("*"))
        if wait:
            raise HTTPException(429, "Too many scans right now. Please wait a moment and try again.",
                                headers={"Retry-After": str(int(wait))})
        try:
            email = normalise_email(req.email)
            domain = normalise_domain(req.domain) if req.domain and req.domain.strip() else None
        except ValidationError as exc:
            raise HTTPException(422, str(exc)) from exc
        try:
            report = await run_scan(email, domain, app.state.http, s)
        except Exception:  # never include the email in logs
            log.exception("scan failed")
            raise HTTPException(500, "Something went wrong while scanning. Please try again.")
        try:
            await run_in_threadpool(app.state.stats.record, breach_count=report.breaches.count if report.breaches.status in ("ok", "demo") else 0,
                                    domain_scanned=domain is not None)
        except Exception:
            log.exception("stats write failed")
        return report

    @app.exception_handler(HTTPException)
    async def http_exc(_: Request, exc: HTTPException):
        return JSONResponse({"error": exc.detail}, status_code=exc.status_code, headers=getattr(exc, "headers", None))

    return app


app = create_app()
