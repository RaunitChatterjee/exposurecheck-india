from app.services.dns_checks import evaluate_dkim, evaluate_dmarc, evaluate_spf


def test_spf_missing():
    assert evaluate_spf(["google-site-verification=abc"])["status"] == "fail"


def test_spf_hardfail_passes():
    assert evaluate_spf(["v=spf1 include:_spf.google.com -all"])["status"] == "pass"


def test_spf_softfail_warns():
    assert evaluate_spf(["v=spf1 include:_spf.google.com ~all"])["status"] == "warn"


def test_spf_plus_all_fails():
    assert evaluate_spf(["v=spf1 +all"])["status"] == "fail"


def test_spf_multiple_records_fail():
    assert evaluate_spf(["v=spf1 -all", "v=spf1 ~all"])["status"] == "fail"


def test_spf_too_many_lookups_warns():
    rec = "v=spf1 " + " ".join(f"include:s{i}.example.com" for i in range(11)) + " -all"
    assert evaluate_spf([rec])["status"] == "warn"


def test_dmarc_policies():
    assert evaluate_dmarc([]) ["status"] == "fail"
    assert evaluate_dmarc(["v=DMARC1; p=none; rua=mailto:a@b.com"])["status"] == "warn"
    assert evaluate_dmarc(["v=DMARC1; p=quarantine"])["status"] == "pass"
    assert evaluate_dmarc(["v=DMARC1; p=reject"])["status"] == "pass"
    assert evaluate_dmarc(["v=DMARC1; rua=mailto:a@b.com"])["status"] == "warn"


def test_dkim_not_found_is_unknown_not_fail():
    assert evaluate_dkim([])["status"] == "unknown"
    assert evaluate_dkim(["google"])["status"] == "pass"
