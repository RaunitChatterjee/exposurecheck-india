"""Small in-memory sliding-window limiter. Keys live only in process memory (never persisted)."""
from __future__ import annotations

import time
from collections import defaultdict, deque


class SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: float):
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, now: float | None = None) -> float:
        """Record a hit. Returns 0 if allowed, else seconds until a slot frees up."""
        now = time.monotonic() if now is None else now
        q = self._hits[key]
        while q and q[0] <= now - self.window:
            q.popleft()
        if len(q) >= self.limit:
            return max(1.0, q[0] + self.window - now)
        q.append(now)
        return 0.0

    def prune(self, now: float | None = None) -> None:
        now = time.monotonic() if now is None else now
        for k in [k for k, q in self._hits.items() if not q or q[-1] <= now - self.window]:
            del self._hits[k]
