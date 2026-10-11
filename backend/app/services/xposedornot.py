"""XposedOrNot breach-analytics client (free tier needs no API key, but is limited to personal / low-volume use).

Free-tier limits documented by the provider: 2 requests/second, 25/hour and 100/day per IP address.
Results are converted to the same dict shape the HIBP client returns so the rest of the pipeline is shared.
The email is sent as a query parameter to the provider only and is never logged here.
"""
from __future__ import annotations

import httpx

from app.services.hibp import HibpError

XON_URL = "https://api.xposedornot.com/v1/breach-analytics"

# Map the provider's data-type labels onto the canonical names the scoring/remediation code uses.
_CANON = {
    "email addresses": "Email addresses", "email": "Email addresses", "emails": "Email addresses",
    "passwords": "Passwords", "password": "Passwords",
    "phone numbers": "Phone numbers", "phone": "Phone numbers", "phone number": "Phone numbers",
    "physical addresses": "Physical addresses", "addresses": "Physical addresses", "address": "Physical addresses",
    "names": "Names", "name": "Names", "usernames": "Usernames", "username": "Usernames",
    "ip addresses": "IP addresses", "dates of birth": "Dates of birth", "date of birth": "Dates of birth",
    "credit cards": "Credit cards", "credit card": "Credit cards",
    "partial credit card data": "Partial credit card data",
    "bank account numbers": "Bank account numbers", "payment histories": "Payment histories",
    "government issued ids": "Government issued IDs", "passport numbers": "Passport numbers",
    "security questions and answers": "Security questions and answers", "auth tokens": "Auth tokens",
}


class XonError(HibpError):
    """Breach lookup failed (rate limit, outage). Subclasses HibpError so callers handle both providers alike."""


def parse_breaches(payload: dict) -> list[dict]:
    exposed = (payload or {}).get("ExposedBreaches") or {}
    out: list[dict] = []
    for b in exposed.get("breaches_details") or []:
        classes = []
        for token in str(b.get("xposed_data") or "").split(";"):
            t = token.strip()
            if t:
                canon = _CANON.get(t.lower(), t)
                if canon not in classes:
                    classes.append(canon)
        year = str(b.get("xposed_date") or "").strip()
        records = b.get("xposed_records")
        out.append({
            "Name": b.get("breach") or "Unknown",
            "Title": b.get("breach") or "Unknown",
            "Domain": b.get("domain") or "",
            "BreachDate": year if year.isdigit() and len(year) == 4 else None,
            "PwnCount": records if isinstance(records, int) else None,
            "DataClasses": classes,
            "IsVerified": str(b.get("verified", "")).lower() == "yes",
            "IsSensitive": False,
            "Description": b.get("details") or "",
        })
    return out


async def fetch_breaches(email: str, client: httpx.AsyncClient, api_key: str | None = None) -> list[dict]:
    headers = {"x-api-key": api_key} if api_key else {}
    try:
        resp = await client.get(XON_URL, params={"email": email}, headers=headers, timeout=15.0)
    except httpx.HTTPError as exc:
        raise XonError("Could not reach the breach database.") from exc
    if resp.status_code == 404:
        return []
    if resp.status_code == 429:
        raise XonError("The free breach database has hit its usage limit for now. Try again later.")
    if resp.status_code != 200:
        raise XonError(f"The breach database returned HTTP {resp.status_code}.")
    try:
        return parse_breaches(resp.json())
    except ValueError as exc:
        raise XonError("Unexpected response from the breach database.") from exc
