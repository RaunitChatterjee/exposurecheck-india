import asyncio

import httpx
import pytest

from app.services import crtsh, hibp


def run(coro):
    return asyncio.run(coro)


def client_for(handler):
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def test_hibp_found_sends_key_and_encoded_email():
    seen = {}

    def handler(req: httpx.Request):
        seen["key"] = req.headers.get("hibp-api-key")
        seen["path"] = req.url.raw_path.decode()
        return httpx.Response(200, json=[{"Name": "X"}])

    async def go():
        async with client_for(handler) as c:
            return await hibp.fetch_breaches("a+b@example.com", c, "K")

    assert run(go()) == [{"Name": "X"}]
    assert seen["key"] == "K"
    assert "a%2Bb%40example.com" in seen["path"]


def test_hibp_404_means_clean():
    async def go():
        async with client_for(lambda r: httpx.Response(404)) as c:
            return await hibp.fetch_breaches("a@b.com", c, "K")
    assert run(go()) == []


@pytest.mark.parametrize("code", [401, 429, 500])
def test_hibp_errors_raise(code):
    async def go():
        async with client_for(lambda r: httpx.Response(code)) as c:
            return await hibp.fetch_breaches("a@b.com", c, "K")
    with pytest.raises(hibp.HibpError):
        run(go())


def test_crtsh_parse_dedupes_wildcards_and_filters():
    rows = [{"name_value": "*.example.com\nwww.example.com"}, {"name_value": "example.com\nother.org\nadmin@example.com"},
            {"name_value": "WWW.example.com"}]
    assert crtsh.parse_names(rows, "example.com") == ["example.com", "www.example.com"]


def test_crtsh_flags_interesting():
    names = ["example.com", "www.example.com", "admin.example.com", "dev-api.example.com", "staging2.example.com", "shop.example.com"]
    assert crtsh.flag_interesting(names, "example.com") == ["admin.example.com", "dev-api.example.com", "staging2.example.com"]


def test_crtsh_retries_then_errors():
    calls = []

    def handler(req):
        calls.append(1)
        return httpx.Response(502)

    async def go():
        async with client_for(handler) as c:
            return await crtsh.fetch_subdomains("example.com", c)

    with pytest.raises(crtsh.CrtshError):
        run(go())
    assert len(calls) == 2
