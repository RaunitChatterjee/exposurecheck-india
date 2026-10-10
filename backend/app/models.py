"""API request/response schemas."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

SectionStatus = Literal["ok", "unavailable", "skipped", "demo"]
CheckStatus = Literal["pass", "warn", "fail", "unknown"]


class ScanRequest(BaseModel):
    email: str = Field(..., max_length=254)
    domain: str | None = Field(default=None, max_length=253)


class Breach(BaseModel):
    name: str
    title: str
    domain: str
    breach_date: str | None
    pwn_count: int | None
    data_classes: list[str]
    is_india_related: bool
    is_sensitive: bool
    is_verified: bool
    description: str
    attacker_view: str


class BreachSection(BaseModel):
    status: SectionStatus
    message: str | None = None
    count: int = 0
    breaches: list[Breach] = []
    data_classes: list[str] = []


class DomainSection(BaseModel):
    status: SectionStatus
    message: str | None = None
    domain: str | None = None
    total: int = 0
    subdomains: list[str] = []
    interesting: list[str] = []
    truncated: bool = False


class EmailCheck(BaseModel):
    status: CheckStatus
    detail: str
    record: str | None = None
    selectors: list[str] = []


class EmailSecuritySection(BaseModel):
    status: SectionStatus
    message: str | None = None
    domain: str | None = None
    spf: EmailCheck | None = None
    dkim: EmailCheck | None = None
    dmarc: EmailCheck | None = None


class RiskFactor(BaseModel):
    label: str
    points: int


class RiskScore(BaseModel):
    score: int
    level: Literal["Low", "Moderate", "High", "Critical"]
    partial: bool
    factors: list[RiskFactor]


class Link(BaseModel):
    label: str
    url: str


class RemediationStep(BaseModel):
    priority: int
    title: str
    detail: str
    links: list[Link] = []


class MitreTechnique(BaseModel):
    id: str
    name: str
    url: str
    why: str


class Report(BaseModel):
    generated_at: str
    breaches: BreachSection
    domain_exposure: DomainSection
    email_security: EmailSecuritySection
    risk: RiskScore
    remediation: list[RemediationStep]
    mitre: list[MitreTechnique]
    storage_note: str
