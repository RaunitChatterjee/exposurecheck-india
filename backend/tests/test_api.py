import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.ratelimit import SlidingWindowLimiter


def settings(**kw):
    base = dict(hibp_api_key=None, hibp_demo=True, contact="test", database_url="sqlite://", cors_origins=["http://localhost:5173"],
                trust_proxy=False, rate_per_minute=100, rate_per_hour=100, global_per_minute=100)
    base.update(kw)
    return Settings(**base)


def test_demo_scan_end_to_end():
    with TestClient(create_app(settings())) as c:
        r = c.post("/api/scan", json={"email": "someone@example.com"})
        assert r.status_code == 200
        body = r.json()
        assert body["breaches"]["status"] == "demo" and body["breaches"]["count"] == 2
        assert body["breaches"]["breaches"][0]["is_india_related"] is True
        assert body["domain_exposure"]["status"] == "skipped"
        assert body["risk"]["score"] > 0 and body["remediation"] and body["mitre"]
        assert "someone@example.com" not in r.text
        assert c.get("/api/stats").json()["total_scans"] == 1


def test_unconfigured_hibp_degrades_gracefully():
    with TestClient(create_app(settings(hibp_demo=False))) as c:
        body = c.post("/api/scan", json={"email": "a@example.com"}).json()
        assert body["breaches"]["status"] == "unavailable"
        assert body["risk"]["partial"] is True


def test_invalid_input_rejected():
    with TestClient(create_app(settings())) as c:
        assert c.post("/api/scan", json={"email": "nope"}).status_code == 422
        assert c.post("/api/scan", json={"email": "a@b.com", "domain": "10.0.0.1"}).status_code == 422


def test_rate_limit_returns_429_with_retry_after():
    with TestClient(create_app(settings(rate_per_minute=1))) as c:
        assert c.post("/api/scan", json={"email": "a@example.com"}).status_code == 200
        r = c.post("/api/scan", json={"email": "a@example.com"})
        assert r.status_code == 429 and "retry-after" in r.headers


def test_limiter_window_expires():
    lim = SlidingWindowLimiter(2, 10)
    assert lim.check("k", now=0) == 0 and lim.check("k", now=1) == 0
    assert lim.check("k", now=2) > 0
    assert lim.check("k", now=11) == 0
