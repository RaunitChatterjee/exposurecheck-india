"""Transparent, rule-based risk score (0-100). Every point is attributable to a listed factor."""
from __future__ import annotations

from datetime import date

from app.models import BreachSection, EmailSecuritySection, RiskFactor, RiskScore
from app.services.hibp import years_since

PASSWORD = {"Passwords", "Historical passwords"}
FINANCIAL = {"Credit cards", "Partial credit card data", "Bank account numbers", "Payment histories",
             "Payment methods", "Financial transactions"}
GOV_ID = {"Government issued IDs", "Passport numbers", "Drivers licenses", "Social security numbers"}


def level_for(score: int) -> str:
    if score >= 70:
        return "Critical"
    if score >= 45:
        return "High"
    if score >= 20:
        return "Moderate"
    return "Low"


def compute_risk(breaches: BreachSection, email_sec: EmailSecuritySection, today: date | None = None) -> RiskScore:
    factors: list[RiskFactor] = []
    partial = breaches.status == "unavailable"

    if breaches.status in ("ok", "demo") and breaches.count:
        n = breaches.count
        factors.append(RiskFactor(label=f"Found in {n} known breach{'es' if n != 1 else ''}", points=min(30, 8 + 4 * (n - 1))))
        classes = set(breaches.data_classes)
        if classes & PASSWORD:
            factors.append(RiskFactor(label="Passwords were exposed", points=25))
        if classes & FINANCIAL:
            factors.append(RiskFactor(label="Financial or card data was exposed", points=15))
        if classes & GOV_ID:
            factors.append(RiskFactor(label="Government ID data was exposed", points=15))
        if "Phone numbers" in classes:
            factors.append(RiskFactor(label="Phone number was exposed (SIM-swap / vishing risk)", points=10))
        if any(b.is_sensitive for b in breaches.breaches):
            factors.append(RiskFactor(label="At least one breach is flagged sensitive", points=5))
        recent = [b for b in breaches.breaches
                  if (y := years_since(b.breach_date, today)) is not None and y <= 2]
        if recent:
            factors.append(RiskFactor(label="A breach occurred within the last 2 years", points=5))

    if email_sec.status == "ok":
        if email_sec.dmarc and email_sec.dmarc.status == "fail":
            factors.append(RiskFactor(label="Domain has no DMARC policy", points=10))
        elif email_sec.dmarc and email_sec.dmarc.status == "warn":
            factors.append(RiskFactor(label="DMARC policy does not enforce", points=5))
        if email_sec.spf and email_sec.spf.status == "fail":
            factors.append(RiskFactor(label="Domain SPF is missing or unsafe", points=8))
        elif email_sec.spf and email_sec.spf.status == "warn":
            factors.append(RiskFactor(label="Domain SPF is not strict", points=3))

    score = min(100, sum(f.points for f in factors))
    return RiskScore(score=score, level=level_for(score), partial=partial, factors=factors)  # type: ignore[arg-type]
