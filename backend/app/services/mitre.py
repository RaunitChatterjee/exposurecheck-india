"""MITRE ATT&CK mapping: which adversary techniques the findings make easier."""
from __future__ import annotations

from app.models import MitreTechnique

_BASE = "https://attack.mitre.org/techniques/"


def _t(tid: str, name: str, why: str) -> MitreTechnique:
    return MitreTechnique(id=tid, name=name, url=_BASE + tid.replace(".", "/") + "/", why=why)


def map_techniques(*, any_breach: bool, passwords: bool, phone: bool, domain_scanned: bool,
                   interesting_subdomains: bool, email_spoofable: bool) -> list[MitreTechnique]:
    out: list[MitreTechnique] = []
    if any_breach:
        out.append(_t("T1589.002", "Gather Victim Identity Information: Email Addresses",
                      "Breach data is a ready-made source of live email addresses for targeting."))
        out.append(_t("T1566", "Phishing", "Exposed identity details make phishing messages more convincing."))
    if passwords:
        out.append(_t("T1110.004", "Brute Force: Credential Stuffing",
                      "Leaked passwords are replayed against other services where you may have reused them."))
        out.append(_t("T1078", "Valid Accounts", "A reused password gives an attacker a legitimate login."))
    if phone:
        out.append(_t("T1451", "SIM Card Swap", "A leaked phone number is the starting point for SIM-swap fraud (mobile ATT&CK)."))
    if domain_scanned:
        out.append(_t("T1596.003", "Search Open Technical Databases: Digital Certificates",
                      "Certificate transparency logs reveal your hostnames to anyone, including attackers."))
    if interesting_subdomains:
        out.append(_t("T1590.002", "Gather Victim Network Information: DNS",
                      "Hostnames like admin/dev/staging hint at internal services worth probing."))
    if email_spoofable:
        out.append(_t("T1672", "Email Spoofing",
                      "Without enforced SPF/DMARC, attackers can send mail that appears to come from your domain."))
    return out
