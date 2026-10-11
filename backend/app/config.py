"""Runtime configuration, read from environment variables."""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


def _flag(name: str, default: bool = False) -> bool:
    return os.getenv(name, "1" if default else "0").strip().lower() in {"1", "true", "yes", "on"}


def _normalise_db_url(url: str) -> str:
    # Render/Railway hand out postgres:// or postgresql:// URLs; SQLAlchemy needs the driver name.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


@dataclass(frozen=True)
class Settings:
    hibp_api_key: str | None
    hibp_demo: bool
    contact: str
    database_url: str
    cors_origins: list[str]
    trust_proxy: bool
    rate_per_minute: int
    rate_per_hour: int
    global_per_minute: int
    breach_provider: str = "auto"

    @property
    def provider(self) -> str:
        """Which breach database to use: explicit BREACH_PROVIDER, else HIBP if a key is set, else XposedOrNot."""
        if self.breach_provider in ("hibp", "xposedornot"):
            return self.breach_provider
        return "hibp" if self.hibp_api_key else "xposedornot"

    @property
    def user_agent(self) -> str:
        return f"ExposureCheck-India/0.1 ({self.contact})"


@lru_cache
def get_settings() -> Settings:
    return Settings(
        hibp_api_key=os.getenv("HIBP_API_KEY") or None,
        hibp_demo=_flag("HIBP_DEMO"),
        contact=os.getenv("APP_CONTACT", "https://github.com/your-username/exposurecheck-india"),
        database_url=_normalise_db_url(os.getenv("DATABASE_URL", "sqlite:///./exposurecheck.db")),
        cors_origins=[o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()],
        trust_proxy=_flag("TRUST_PROXY"),
        rate_per_minute=int(os.getenv("RATE_LIMIT_PER_MINUTE", "5")),
        rate_per_hour=int(os.getenv("RATE_LIMIT_PER_HOUR", "30")),
        global_per_minute=int(os.getenv("GLOBAL_RATE_LIMIT_PER_MINUTE", "8")),
        breach_provider=os.getenv("BREACH_PROVIDER", "auto").strip().lower(),
    )
