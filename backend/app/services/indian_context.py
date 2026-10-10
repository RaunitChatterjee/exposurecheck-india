"""India-specific breach tagging, plain-language attacker explanations, and helpline links."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_DATA = Path(__file__).resolve().parent.parent / "data" / "india_breaches.json"


@lru_cache
def _india() -> dict:
    return json.loads(_DATA.read_text(encoding="utf-8"))


def is_india_related(domain: str | None) -> bool:
    d = (domain or "").lower().strip()
    if not d:
        return False
    cfg = _india()
    if d in cfg["domains"]:
        return True
    return any(d.endswith(sfx) for sfx in cfg["tld_suffixes"])


# What an attacker can actually do with each kind of leaked data.
ATTACKER_VIEW: dict[str, str] = {
    "Passwords": "Attackers try the leaked password on your other accounts (credential stuffing). If you reused it anywhere, they walk straight in.",
    "Historical passwords": "Old passwords reveal your habits; attackers guess your current password from the pattern.",
    "Phone numbers": "Your number can be used for SIM-swap attempts, OTP-phishing calls (fake bank or courier staff) and targeted SMS scams.",
    "Physical addresses": "Lets scammers make fake-delivery and fake-KYC messages sound legitimate and personal.",
    "Names": "Pairing your name with your email makes phishing messages far more convincing.",
    "Dates of birth": "A common identity-verification answer; combined with other data it helps attackers pass account-recovery checks.",
    "Credit cards": "Card numbers can be sold or used for fraudulent online purchases.",
    "Partial credit card data": "Last digits plus your name and phone let a fake 'bank agent' sound authentic on a call.",
    "Bank account numbers": "Enables convincing 'your account will be blocked' vishing calls.",
    "Payment histories": "Shows who you pay and when, which fraudsters use to craft believable payment-request scams.",
    "Government issued IDs": "Government ID details support identity fraud such as SIM or loan fraud in your name.",
    "Security questions and answers": "Leaked answers let attackers reset passwords on other sites that use the same questions.",
    "Auth tokens": "Tokens can sometimes be replayed to access an account without a password.",
    "IP addresses": "Reveals approximate location and ISP; mostly useful to attackers for profiling.",
    "Usernames": "Reusing a username across sites lets attackers link your accounts.",
    "Email addresses": "Confirms your address is live and in use, so it is added to phishing target lists.",
}
_PRIORITY = ["Passwords", "Government issued IDs", "Bank account numbers", "Credit cards", "Partial credit card data",
             "Phone numbers", "Security questions and answers", "Auth tokens", "Physical addresses", "Dates of birth",
             "Names", "Payment histories", "Historical passwords", "Usernames", "IP addresses", "Email addresses"]


def attacker_view(data_classes: list[str], limit: int = 2) -> str:
    present = set(data_classes)
    lines = [ATTACKER_VIEW[c] for c in _PRIORITY if c in present][:limit]
    return " ".join(lines) or "Your email was exposed, which adds it to phishing and spam target lists."


LINKS = {
    "cybercrime": {"label": "National Cyber Crime Reporting Portal (cybercrime.gov.in)", "url": "https://cybercrime.gov.in"},
    "cert_in": {"label": "CERT-In: report an incident", "url": "https://www.cert-in.org.in"},
    "sanchar": {"label": "Sanchar Saathi (check mobile connections in your name)", "url": "https://sancharsaathi.gov.in"},
    "hibp": {"label": "HaveIBeenPwned", "url": "https://haveibeenpwned.com"},
}
CYBER_HELPLINE = "1930"
