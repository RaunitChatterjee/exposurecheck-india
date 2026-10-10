"""Prioritised, India-specific remediation steps."""
from __future__ import annotations

from app.models import BreachSection, DomainSection, EmailSecuritySection, Link, RemediationStep
from app.services.indian_context import CYBER_HELPLINE, LINKS
from app.services.scoring import FINANCIAL, GOV_ID, PASSWORD


def _link(key: str) -> Link:
    return Link(**LINKS[key])


def build_remediation(breaches: BreachSection, domain: DomainSection, email_sec: EmailSecuritySection) -> list[RemediationStep]:
    steps: list[RemediationStep] = []
    classes = set(breaches.data_classes)
    found = breaches.status in ("ok", "demo") and breaches.count > 0

    if found and classes & FINANCIAL:
        steps.append(RemediationStep(
            priority=1, title="Watch your bank and UPI activity today",
            detail=("Card or payment details appeared in a breach. Turn on transaction alerts with your bank and UPI apps, "
                    "lower UPI daily limits if you can, and treat any call from a 'bank agent' as suspicious. "
                    f"If money has already gone, call {CYBER_HELPLINE} immediately and file a report at cybercrime.gov.in; fast reporting improves the chance of a freeze."),
            links=[_link("cybercrime")]))
    if found and classes & PASSWORD:
        steps.append(RemediationStep(
            priority=1, title="Change the exposed password everywhere you reused it",
            detail=("Start with email, banking and UPI apps. Use a different password for each site, ideally from a password manager. "
                    "Then turn on two-factor authentication, preferring an authenticator app over SMS codes.")))
    if found and "Phone numbers" in classes:
        steps.append(RemediationStep(
            priority=2, title="Protect your phone number from SIM-swap and OTP scams",
            detail=("Never read out an OTP to anyone who calls you, whatever they claim. Ask your mobile operator about a SIM/port-out lock, "
                    "and check which mobile connections are registered in your name on Sanchar Saathi."),
            links=[_link("sanchar")]))
    if found and classes & GOV_ID:
        steps.append(RemediationStep(
            priority=2, title="Guard against identity misuse",
            detail=("Government ID data was exposed. Be alert to loan, SIM or KYC requests you did not make, check your credit report "
                    "for unfamiliar enquiries, and report misuse at cybercrime.gov.in."),
            links=[_link("cybercrime")]))
    if found:
        steps.append(RemediationStep(
            priority=3, title="Expect more convincing phishing, and verify before you click",
            detail=("Scammers use breach data to sound legitimate. Do not act on links or calls about KYC, parcels, refunds or 'account blocked' alerts; "
                    "open the official app or website yourself and check there.")))
    if domain.status == "ok" and domain.interesting:
        steps.append(RemediationStep(
            priority=3, title="Review publicly visible hostnames on your domain",
            detail=(f"Certificate logs show names like {', '.join(domain.interesting[:3])}. Make sure admin, dev and staging hosts "
                    "are not exposed to the internet without authentication, and retire ones you no longer use.")))
    if email_sec.status == "ok":
        if email_sec.dmarc and email_sec.dmarc.status in ("fail", "warn"):
            steps.append(RemediationStep(
                priority=3, title="Publish and enforce a DMARC policy",
                detail="Add a _dmarc TXT record, start with p=none and reporting, then move to p=quarantine and p=reject so spoofed mail from your domain is blocked."))
        if email_sec.spf and email_sec.spf.status in ("fail", "warn"):
            steps.append(RemediationStep(
                priority=3, title="Fix your SPF record",
                detail="Publish one SPF TXT record listing only your real mail senders and ending in -all (or ~all while testing)."))
    steps.append(RemediationStep(
        priority=4, title="Know where to report",
        detail=(f"Cyber fraud: call {CYBER_HELPLINE} and report at cybercrime.gov.in. Incidents affecting an organisation's systems can be reported to CERT-In. "
                "Also tell your bank directly using the number printed on your card or passbook."),
        links=[_link("cybercrime"), _link("cert_in")]))
    if not found and breaches.status in ("ok", "demo"):
        steps.insert(0, RemediationStep(
            priority=3, title="No known breaches found: keep it that way",
            detail=("Absence from known breach lists is good news, not a guarantee. Use unique passwords, an authenticator app for 2FA, "
                    "and never share OTPs.")))
    steps.sort(key=lambda s: s.priority)
    return steps
