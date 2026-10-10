"""Week-1 command-line harness: python -m app.cli you@example.com [--domain example.com]"""
from __future__ import annotations

import argparse
import asyncio
import json

import httpx

from app.config import get_settings
from app.services.report import run_scan
from app.validation import normalise_domain, normalise_email


async def _main(email: str, domain: str | None) -> None:
    s = get_settings()
    async with httpx.AsyncClient(headers={"User-Agent": s.user_agent}) as client:
        report = await run_scan(normalise_email(email), normalise_domain(domain) if domain else None, client, s)
    print(json.dumps(report.model_dump(), indent=2))


def main() -> None:
    p = argparse.ArgumentParser(description="Run an ExposureCheck scan from the terminal.")
    p.add_argument("email")
    p.add_argument("--domain")
    a = p.parse_args()
    asyncio.run(_main(a.email, a.domain))


if __name__ == "__main__":
    main()
