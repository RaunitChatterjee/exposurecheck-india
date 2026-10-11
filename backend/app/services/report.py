"""Orchestrates the checks and assembles the final report."""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import dns.exception
import httpx

from app.config import Settings
from app.models import (Breach, BreachSection, DomainSection, EmailCheck, EmailSecuritySection, Report)
from app.services import crtsh, dns_checks, hibp, xposedornot
from app.services.indian_context import attacker_view, is_india_related
from app.services.mitre import map_techniques
from app.services.remediation import build_remediation
from app.services.scoring import PASSWORD, compute_risk

MAX_SUBDOMAINS_RETURNED = 100
STORAGE_NOTE = ("Your email address and domain were used for this scan only and were not stored. "
                "We keep only anonymous daily totals (scan count, breaches found).")


def _to_breach(raw: dict) -> Breach:
    classes = list(raw.get("DataClasses") or [])
    domain = raw.get("Domain") or ""
    return Breach(
        name=raw.get("Name", ""), title=raw.get("Title") or raw.get("Name", ""), domain=domain,
        breach_date=raw.get("BreachDate"), pwn_count=raw.get("PwnCount"), data_classes=classes,
        is_india_related=is_india_related(domain), is_sensitive=bool(raw.get("IsSensitive")),
        is_verified=bool(raw.get("IsVerified")), description=hibp.clean_description(raw.get("Description")),
        attacker_view=attacker_view(classes))


def _breach_section(raws: list[dict], status: str, message: str | None = None, source: str | None = None) -> BreachSection:
    breaches = sorted((_to_breach(r) for r in raws), key=lambda b: b.breach_date or "", reverse=True)
    # India-related breaches first, then newest
    breaches.sort(key=lambda b: not b.is_india_related)
    classes = sorted({c for b in breaches for c in b.data_classes})
    return BreachSection(status=status, message=message, source=source, count=len(breaches), breaches=breaches, data_classes=classes)  # type: ignore[arg-type]


async def _breaches(email: str, client: httpx.AsyncClient, s: Settings) -> BreachSection:
    if s.hibp_demo:
        return _breach_section(hibp.load_demo_breaches(), "demo",
                               "DEMO MODE: these are fictional sample records, not real results for this email.",
                               source="Demo data")
    try:
        if s.provider == "hibp":
            if not s.hibp_api_key:
                return BreachSection(status="unavailable", message="Breach lookup is not configured on this server (no HIBP API key).")
            return _breach_section(await hibp.fetch_breaches(email, client, s.hibp_api_key), "ok", source="HaveIBeenPwned")
        return _breach_section(await xposedornot.fetch_breaches(email, client), "ok", source="XposedOrNot")
    except hibp.HibpError as exc:  # XonError subclasses HibpError
        return BreachSection(status="unavailable", message=str(exc))


async def _domain_exposure(domain: str | None, client: httpx.AsyncClient) -> DomainSection:
    if not domain:
        return DomainSection(status="skipped", message="No domain provided.")
    try:
        names = await crtsh.fetch_subdomains(domain, client)
    except crtsh.CrtshError as exc:
        return DomainSection(status="unavailable", domain=domain, message=str(exc))
    return DomainSection(status="ok", domain=domain, total=len(names), subdomains=names[:MAX_SUBDOMAINS_RETURNED],
                         interesting=crtsh.flag_interesting(names, domain)[:20], truncated=len(names) > MAX_SUBDOMAINS_RETURNED)


async def _email_security(domain: str | None) -> EmailSecuritySection:
    if not domain:
        return EmailSecuritySection(status="skipped", message="No domain provided.")
    try:
        res = await dns_checks.check_email_security(domain)
    except dns_checks.DomainNotFound:
        return EmailSecuritySection(status="unavailable", domain=domain, message="This domain does not exist in DNS.")
    except (dns.exception.DNSException, OSError):
        return EmailSecuritySection(status="unavailable", domain=domain, message="DNS lookup failed or timed out.")
    return EmailSecuritySection(status="ok", domain=domain, **{k: EmailCheck(**v) for k, v in res.items()})


async def run_scan(email: str, domain: str | None, client: httpx.AsyncClient, settings: Settings) -> Report:
    breaches, dom, mail = await asyncio.gather(
        _breaches(email, client, settings), _domain_exposure(domain, client), _email_security(domain))
    risk = compute_risk(breaches, mail)
    classes = set(breaches.data_classes)
    spoofable = bool(mail.status == "ok" and mail.dmarc and mail.dmarc.status in ("fail", "warn"))
    mitre = map_techniques(
        any_breach=breaches.count > 0, passwords=bool(classes & PASSWORD), phone="Phone numbers" in classes,
        domain_scanned=dom.status == "ok", interesting_subdomains=bool(dom.interesting), email_spoofable=spoofable)
    return Report(generated_at=datetime.now(timezone.utc).isoformat(timespec="seconds"), breaches=breaches,
                  domain_exposure=dom, email_security=mail, risk=risk,
                  remediation=build_remediation(breaches, dom, mail), mitre=mitre, storage_note=STORAGE_NOTE)
