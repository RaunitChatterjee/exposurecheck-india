from datetime import date

from app.models import BreachSection, DomainSection, EmailCheck, EmailSecuritySection
from app.services.indian_context import attacker_view, is_india_related
from app.services.mitre import map_techniques
from app.services.remediation import build_remediation
from app.services.report import _breach_section
from app.services.scoring import compute_risk, level_for

NO_MAIL = EmailSecuritySection(status="skipped")
NO_DOM = DomainSection(status="skipped")


def raw(name, domain, classes, date_="2024-01-01", sensitive=False):
    return {"Name": name, "Title": name, "Domain": domain, "BreachDate": date_, "PwnCount": 1,
            "DataClasses": classes, "IsSensitive": sensitive, "IsVerified": True, "Description": "<b>x</b> &amp; y"}


def test_india_tagging():
    assert is_india_related("bigbasket.com")
    assert is_india_related("somebank.co.in")
    assert not is_india_related("adobe.com")
    assert not is_india_related("")


def test_india_breaches_sorted_first_and_description_cleaned():
    sec = _breach_section([raw("Adobe", "adobe.com", ["Passwords"], "2024-05-01"), raw("BB", "bigbasket.com", ["Phone numbers"], "2020-01-01")], "ok")
    assert [b.name for b in sec.breaches] == ["BB", "Adobe"]
    assert sec.breaches[0].description == "x & y"
    assert sec.data_classes == ["Passwords", "Phone numbers"]


def test_clean_email_scores_low():
    sec = _breach_section([], "ok")
    r = compute_risk(sec, NO_MAIL)
    assert r.score == 0 and r.level == "Low" and not r.partial


def test_heavy_exposure_scores_critical_and_is_capped():
    sec = _breach_section([raw(f"B{i}", "x.com", ["Passwords", "Phone numbers", "Credit cards", "Government issued IDs"], "2025-09-01", True) for i in range(6)], "ok")
    r = compute_risk(sec, NO_MAIL, today=date(2026, 1, 1))
    assert r.score == 100 and r.level == "Critical"


def test_unavailable_breach_lookup_is_partial_not_zero_confidence():
    r = compute_risk(BreachSection(status="unavailable"), NO_MAIL)
    assert r.partial and r.score == 0


def test_email_security_adds_points():
    mail = EmailSecuritySection(status="ok", domain="d.com", spf=EmailCheck(status="fail", detail=""),
                                dmarc=EmailCheck(status="fail", detail=""), dkim=EmailCheck(status="unknown", detail=""))
    assert compute_risk(_breach_section([], "ok"), mail).score == 18


def test_levels():
    assert [level_for(s) for s in (0, 19, 20, 44, 45, 69, 70)] == ["Low", "Low", "Moderate", "Moderate", "High", "High", "Critical"]


def test_remediation_is_india_specific_and_prioritised():
    sec = _breach_section([raw("X", "x.com", ["Passwords", "Phone numbers", "Credit cards"])], "ok")
    steps = build_remediation(sec, NO_DOM, NO_MAIL)
    text = " ".join(s.detail for s in steps)
    assert "1930" in text and "cybercrime.gov.in" in text and "Sanchar Saathi" in text
    assert [s.priority for s in steps] == sorted(s.priority for s in steps)
    assert any("cybercrime.gov.in" in l.label for s in steps for l in s.links)


def test_clean_scan_still_gets_guidance():
    steps = build_remediation(_breach_section([], "ok"), NO_DOM, NO_MAIL)
    assert steps[0].title.startswith("No known breaches")


def test_attacker_view_prioritises_passwords():
    assert "credential stuffing" in attacker_view(["Names", "Passwords"])


def test_mitre_mapping():
    ids = [t.id for t in map_techniques(any_breach=True, passwords=True, phone=True, domain_scanned=True,
                                        interesting_subdomains=True, email_spoofable=True)]
    assert {"T1110.004", "T1451", "T1596.003", "T1672"} <= set(ids)
    assert map_techniques(any_breach=False, passwords=False, phone=False, domain_scanned=False,
                          interesting_subdomains=False, email_spoofable=False) == []
