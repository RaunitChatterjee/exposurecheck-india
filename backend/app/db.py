"""Aggregate-only usage counters. No emails, domains, IPs or per-user identifiers are ever stored."""
from __future__ import annotations

from datetime import date

from sqlalchemy import Date, Integer, create_engine, select
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column


class Base(DeclarativeBase):
    pass


class DailyStats(Base):
    __tablename__ = "daily_stats"
    day: Mapped[date] = mapped_column(Date, primary_key=True)
    scans: Mapped[int] = mapped_column(Integer, default=0)
    scans_with_breach: Mapped[int] = mapped_column(Integer, default=0)
    breaches_surfaced: Mapped[int] = mapped_column(Integer, default=0)
    domain_scans: Mapped[int] = mapped_column(Integer, default=0)


class StatsStore:
    def __init__(self, url: str):
        if url.startswith("sqlite"):
            kwargs: dict = {"connect_args": {"check_same_thread": False}}
            if url in ("sqlite://", "sqlite:///:memory:"):
                kwargs["poolclass"] = StaticPool  # share one in-memory DB across threads (tests)
        else:
            kwargs = {"pool_pre_ping": True}
        self.engine = create_engine(url, **kwargs)
        Base.metadata.create_all(self.engine)

    def record(self, *, breach_count: int, domain_scanned: bool, today: date | None = None) -> None:
        day = today or date.today()
        with Session(self.engine) as s:
            row = s.get(DailyStats, day)
            if row is None:
                row = DailyStats(day=day, scans=0, scans_with_breach=0, breaches_surfaced=0, domain_scans=0)
                s.add(row)
            row.scans += 1
            row.scans_with_breach += 1 if breach_count else 0
            row.breaches_surfaced += breach_count
            row.domain_scans += 1 if domain_scanned else 0
            s.commit()

    def totals(self) -> dict:
        with Session(self.engine) as s:
            rows = s.scalars(select(DailyStats)).all()
        return {
            "total_scans": sum(r.scans for r in rows),
            "scans_with_breach": sum(r.scans_with_breach for r in rows),
            "breaches_surfaced": sum(r.breaches_surfaced for r in rows),
            "domain_scans": sum(r.domain_scans for r in rows),
            "days_active": len(rows),
        }
