"""HaveIBeenPwned v3 client (breachedaccount endpoint; requires a paid API key).

The email is sent in the URL path to HIBP only, as their API requires. It is never logged here.
"""
from __future__ import annotations

import html
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import quote

import httpx

HIBP_URL = "https://haveibeenpwned.com/api/v3/breachedaccount/{account}"
_DATA = Path(__file__).resolve().parent.parent / "data"


class HibpError(Exception):
    """Raised when HIBP cannot give a trustworthy answer (bad key, rate limit, outage)."""


async def fetch_breaches(email: str, client: httpx.AsyncClient, api_key: str) -> list[dict]:
    """Return raw HIBP breach objects for the account ([] if none found)."""
    url = HIBP_URL.format(account=quote(email, safe=""))
    try:
        resp = await client.get(
            url,
            params={"truncateResponse": "false"},
            headers={"hibp-api-key": api_key},
            timeout=10.0,
        )
    except httpx.HTTPError as exc:
        raise HibpError("Could not reach the breach database.") from exc
    if resp.status_code == 404:
        return []
    if resp.status_code == 200:
        try:
            data = resp.json()
        except ValueError as exc:
            raise HibpError("Unexpected response from the breach database.") from exc
        return data if isinstance(data, list) else []
    if resp.status_code in (401, 403):
        raise HibpError("The breach database rejected our API key.")
    if resp.status_code == 429:
        raise HibpError("The breach database is rate-limiting us. Please retry in a minute.")
    raise HibpError(f"The breach database returned HTTP {resp.status_code}.")


def load_demo_breaches() -> list[dict]:
    """Fictional sample data for UI development. Never mixed with real results."""
    return json.loads((_DATA / "demo_breaches.json").read_text(encoding="utf-8"))


_TAG_RE = re.compile(r"<[^>]+>")


def clean_description(text: str | None) -> str:
    return html.unescape(_TAG_RE.sub("", text or "")).strip()


def years_since(breach_date: str | None, today: date | None = None) -> float | None:
    if not breach_date:
        return None
    try:
        d = date.fromisoformat(breach_date[:10])
    except ValueError:
        return None
    return ((today or date.today()) - d).days / 365.25
