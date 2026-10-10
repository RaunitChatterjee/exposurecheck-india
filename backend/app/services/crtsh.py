"""Certificate-transparency lookup via crt.sh (public, unauthenticated, occasionally slow)."""
from __future__ import annotations

import re

import httpx

CRTSH_URL = "https://crt.sh/"

# Hostname fragments that often indicate something an attacker would probe first.
INTERESTING = ("admin", "dev", "staging", "stage", "test", "uat", "vpn", "internal", "jenkins",
               "git", "gitlab", "jira", "grafana", "kibana", "phpmyadmin", "backup", "old", "beta", "sso", "mail", "webmail")


class CrtshError(Exception):
    pass


def parse_names(rows: list[dict], domain: str) -> list[str]:
    names: set[str] = set()
    suffix = "." + domain
    for row in rows:
        for raw in str(row.get("name_value", "")).splitlines():
            n = raw.strip().lower().lstrip("*.").rstrip(".")
            if not n or "@" in n:
                continue
            if n == domain or n.endswith(suffix):
                names.add(n)
    return sorted(names)


def flag_interesting(names: list[str], domain: str) -> list[str]:
    flagged = []
    for n in names:
        if n == domain:
            continue
        labels = n[: -(len(domain) + 1)].split(".")
        parts = [p for label in labels for p in re.split(r"[-_]", label)]
        if any(p == k or (p.startswith(k) and p[len(k):].isdigit()) for p in parts for k in INTERESTING):
            flagged.append(n)
    return flagged


async def fetch_subdomains(domain: str, client: httpx.AsyncClient) -> list[str]:
    last: Exception | None = None
    for _ in range(2):  # crt.sh drops requests often; one retry is worth it
        try:
            resp = await client.get(CRTSH_URL, params={"q": f"%.{domain}", "output": "json"}, timeout=20.0)
            if resp.status_code == 200:
                rows = resp.json()
                return parse_names(rows if isinstance(rows, list) else [], domain)
            last = CrtshError(f"crt.sh returned HTTP {resp.status_code}")
        except (httpx.HTTPError, ValueError) as exc:
            last = exc
    raise CrtshError("Certificate transparency logs (crt.sh) are not responding right now.") from last
