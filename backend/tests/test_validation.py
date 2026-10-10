import pytest

from app.validation import ValidationError, normalise_domain, normalise_email


def test_email_ok_and_lowercases_domain():
    assert normalise_email(" Raunit.C@Example.COM ") == "Raunit.C@example.com"


@pytest.mark.parametrize("bad", ["", "a@b", "no-at.com", "a@@b.com", "a b@c.com", "x" * 300 + "@a.com"])
def test_email_rejects(bad):
    with pytest.raises(ValidationError):
        normalise_email(bad)


def test_domain_strips_scheme_and_path():
    assert normalise_domain("https://Example.com/path?x=1") == "example.com"


@pytest.mark.parametrize("bad", ["localhost", "10.0.0.1", "intranet.local", "a", "-bad.com", "foo.123", ""])
def test_domain_rejects(bad):
    with pytest.raises(ValidationError):
        normalise_domain(bad)
