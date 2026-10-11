import asyncio

import httpx
import pytest

from app.config import Settings
from app.services import xposedornot as xon
from app.services.hibp import HibpError

SAMPLE = {
    "BreachesSummary": {"site": "Adobe;BigBasket"},
    "ExposedBreaches": {"breaches_details": [
        {"breach": "BigBasket", "domain": "bigbasket.com", "xposed_date": "2020", "xposed_records": 20000000,
         "xposed_data": "Email addresses;Phone numbers;Passwords;phone numbers", "verified": "Yes", "details": "d"},
        {"breach": "Odd", "domain": "", "xposed_date": "unknown", "xposed_records": "x", "xposed_data": "", "verified": "No"},
    ]},
}


def run(coro):
    return asyncio.run(coro)


def fetch(handler):
    async def go():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as c:
            return await xon.fetch_breaches("a@b.com", c)
    return run(go())


def test_parse_normalises_and_dedupes_data_classes():
    out = xon.parse_breaches(SAMPLE)
    assert out[0]["DataClasses"] == ["Email addresses", "Phone numbers", "Passwords"]
    assert out[0]["BreachDate"] == "2020" and out[0]["PwnCount"] == 20000000 and out[0]["IsVerified"] is True
    assert out[1]["BreachDate"] is None and out[1]["PwnCount"] is None and out[1]["DataClasses"] == []


def test_not_found_variants_are_clean():
    assert xon.parse_breaches({"ExposedBreaches": None, "BreachesSummary": {"site": ""}}) == []
    assert fetch(lambda r: httpx.Response(404)) == []
    assert fetch(lambda r: httpx.Response(200, json={"ExposedBreaches": None})) == []


def test_success_passes_email_as_query():
    seen = {}

    def handler(req):
        seen["q"] = dict(req.url.params)
        return httpx.Response(200, json=SAMPLE)

    assert len(fetch(handler)) == 2 and seen["q"] == {"email": "a@b.com"}


@pytest.mark.parametrize("code", [429, 500])
def test_errors_are_hibp_compatible(code):
    with pytest.raises(HibpError):
        fetch(lambda r: httpx.Response(code))


def test_provider_selection():
    base = dict(hibp_api_key=None, hibp_demo=False, contact="t", database_url="sqlite://", cors_origins=[],
                trust_proxy=False, rate_per_minute=1, rate_per_hour=1, global_per_minute=1)
    assert Settings(**base).provider == "xposedornot"
    assert Settings(**{**base, "hibp_api_key": "k"}).provider == "hibp"
    assert Settings(**{**base, "hibp_api_key": "k", "breach_provider": "xposedornot"}).provider == "xposedornot"
    assert Settings(**{**base, "breach_provider": "hibp"}).provider == "hibp"
