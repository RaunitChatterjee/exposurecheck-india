"""SPF / DKIM / DMARC checks using plain DNS lookups."""
from __future__ import annotations

import asyncio

import dns.asyncresolver
import dns.exception
import dns.resolver

# DKIM selectors cannot be enumerated from DNS, so we probe common ones. A miss is NOT proof of absence.
COMMON_DKIM_SELECTORS = ("default", "google", "selector1", "selector2", "k1", "k2", "s1", "s2",
                         "mail", "dkim", "mandrill", "smtp", "zoho", "mxvault", "protonmail")


class DomainNotFound(Exception):
    pass


def _resolver() -> dns.asyncresolver.Resolver:
    r = dns.asyncresolver.Resolver()
    r.lifetime = 5.0
    r.timeout = 3.0
    return r


async def query_txt(name: str, resolver: dns.asyncresolver.Resolver | None = None, *, apex: bool = False) -> list[str]:
    r = resolver or _resolver()
    try:
        answer = await r.resolve(name, "TXT")
    except dns.resolver.NXDOMAIN:
        if apex:
            raise DomainNotFound(name)
        return []
    except dns.resolver.NoAnswer:
        return []
    return ["".join(s.decode("utf-8", "replace") for s in rdata.strings) for rdata in answer]


def evaluate_spf(records: list[str]) -> dict:
    spf = [r for r in records if r.lower().startswith("v=spf1")]
    if not spf:
        return {"status": "fail", "record": None, "detail": "No SPF record. Anyone can send email that claims to be from this domain and receivers have no policy to check it against."}
    if len(spf) > 1:
        return {"status": "fail", "record": spf[0], "detail": "Multiple SPF records. This is invalid and many receivers will ignore SPF entirely."}
    rec = spf[0]
    terms = rec.lower().split()
    lookups = sum(1 for t in terms if t.lstrip("+-~?").split(":")[0].split("=")[0] in {"include", "a", "mx", "ptr", "exists", "redirect"})
    if "+all" in terms or "all" in terms:
        return {"status": "fail", "record": rec, "detail": "SPF ends in +all, which authorises every server on the internet to send as this domain."}
    if "?all" in terms:
        return {"status": "fail", "record": rec, "detail": "SPF ends in ?all (neutral), so it gives receivers no basis to reject spoofed mail."}
    if lookups > 10:
        return {"status": "warn", "record": rec, "detail": f"SPF needs about {lookups} DNS lookups; the limit is 10, so evaluation can fail."}
    if "-all" in terms:
        return {"status": "pass", "record": rec, "detail": "SPF is present and ends in -all (hard fail for unauthorised senders)."}
    if "~all" in terms:
        return {"status": "warn", "record": rec, "detail": "SPF ends in ~all (soft fail). Acceptable while rolling out, but -all is stricter."}
    return {"status": "warn", "record": rec, "detail": "SPF is present but has no terminating 'all' mechanism."}


def _parse_tags(record: str) -> dict[str, str]:
    tags = {}
    for part in record.split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            tags[k.strip().lower()] = v.strip()
    return tags


def evaluate_dmarc(records: list[str]) -> dict:
    dm = [r for r in records if r.lower().startswith("v=dmarc1")]
    if not dm:
        return {"status": "fail", "record": None, "detail": "No DMARC record. Spoofed email from this domain is not blocked or reported."}
    rec = dm[0]
    tags = _parse_tags(rec)
    policy = tags.get("p", "").lower()
    if policy == "reject":
        return {"status": "pass", "record": rec, "detail": "DMARC policy is reject: spoofed mail should be refused."}
    if policy == "quarantine":
        return {"status": "pass", "record": rec, "detail": "DMARC policy is quarantine: spoofed mail is sent to spam."}
    if policy == "none":
        return {"status": "warn", "record": rec, "detail": "DMARC policy is none (monitor only). It reports spoofing but does not stop it."}
    return {"status": "warn", "record": rec, "detail": "DMARC record found but its policy (p=) is missing or invalid."}


def evaluate_dkim(found: list[str]) -> dict:
    if found:
        return {"status": "pass", "record": None, "selectors": found,
                "detail": f"DKIM key found for selector(s): {', '.join(found)}."}
    return {"status": "unknown", "record": None, "selectors": [],
            "detail": "No DKIM key found among common selectors. This is inconclusive: DKIM selectors are private to the mail provider, so the domain may still sign mail."}


async def check_email_security(domain: str) -> dict:
    r = _resolver()
    apex = await query_txt(domain, r, apex=True)  # raises DomainNotFound
    dmarc_task = query_txt(f"_dmarc.{domain}", r)
    dkim_tasks = [query_txt(f"{s}._domainkey.{domain}", r) for s in COMMON_DKIM_SELECTORS]
    results = await asyncio.gather(dmarc_task, *dkim_tasks, return_exceptions=True)
    dmarc_records = results[0]
    if isinstance(dmarc_records, BaseException):
        raise dmarc_records
    found = [s for s, res in zip(COMMON_DKIM_SELECTORS, results[1:])
             if isinstance(res, list) and any("p=" in x or "v=dkim1" in x.lower() for x in res)]
    return {"spf": evaluate_spf(apex), "dkim": evaluate_dkim(found), "dmarc": evaluate_dmarc(dmarc_records)}
