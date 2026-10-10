"""Input validation. Kept dependency-free and strict: we only ever query public data."""
from __future__ import annotations

import ipaddress
import re

_EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-']{1,64}@([A-Za-z0-9\-]{1,63}(?:\.[A-Za-z0-9\-]{1,63})+)$")
_LABEL_RE = re.compile(r"^(?!-)[a-z0-9\-]{1,63}(?<!-)$")


class ValidationError(ValueError):
    pass


def normalise_domain(raw: str) -> str:
    """Return a lowercase registrable-looking hostname or raise ValidationError."""
    d = raw.strip().lower().rstrip(".")
    for prefix in ("http://", "https://"):
        if d.startswith(prefix):
            d = d[len(prefix):]
    d = d.split("/")[0]
    if not d or len(d) > 253:
        raise ValidationError("Enter a valid domain such as example.com.")
    try:
        ipaddress.ip_address(d)
        raise ValidationError("Enter a domain name, not an IP address.")
    except ValueError as exc:
        if isinstance(exc, ValidationError):
            raise
    labels = d.split(".")
    if len(labels) < 2 or not all(_LABEL_RE.match(label) for label in labels):
        raise ValidationError("Enter a valid domain such as example.com.")
    if labels[-1] in {"local", "localhost", "internal", "lan", "test", "invalid", "example"}:
        raise ValidationError("Enter a public domain name.")
    if labels[-1].isdigit():
        raise ValidationError("Enter a valid domain such as example.com.")
    return d


def normalise_email(raw: str) -> str:
    e = raw.strip()
    if len(e) > 254 or not _EMAIL_RE.match(e):
        raise ValidationError("Enter a valid email address.")
    local, domain = e.rsplit("@", 1)
    return f"{local}@{domain.lower()}"
