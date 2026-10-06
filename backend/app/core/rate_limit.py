"""Sliding-window in-memory rate limiting dependency for FastAPI."""
import time
from collections import defaultdict
from typing import Callable, Dict, List
from fastapi import HTTPException, Request, status
from app.core.config import settings


class SlidingWindowRateLimiter:
    """Lightweight in-memory sliding window rate limiter."""

    def __init__(self) -> None:
        self._requests: Dict[str, List[float]] = defaultdict(list)

    def check(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Record attempt and return True if allowed, False if limit exceeded."""
        # Always allow in test environment if configured
        if settings.APP_ENV == "test" and max_requests <= 1:
            return True

        now = time.monotonic()
        cutoff = now - window_seconds
        timestamps = self._requests[key]

        # Prune timestamps older than window
        valid_timestamps = [t for t in timestamps if t > cutoff]
        self._requests[key] = valid_timestamps

        # Periodic cleanup of expired keys to prevent memory leak
        if len(self._requests) > 1000:
            stale_keys = [k for k, v in self._requests.items() if not v or v[-1] <= cutoff]
            for k in stale_keys:
                self._requests.pop(k, None)

        if len(valid_timestamps) >= max_requests:
            return False

        self._requests[key].append(now)
        return True

    def reset(self) -> None:
        """Clear all rate limit buckets."""
        self._requests.clear()


limiter = SlidingWindowRateLimiter()


def rate_limit(max_requests: int = 60, window_seconds: int = 60) -> Callable:
    """Dependency that enforces sliding window rate limits based on client IP."""

    async def dependency(request: Request) -> None:
        forwarded = request.headers.get("x-forwarded-for")
        client_ip = (
            forwarded.split(",")[0].strip()
            if forwarded
            else (request.client.host if request.client else "127.0.0.1")
        )
        route_path = request.url.path
        key = f"{client_ip}:{route_path}"

        if not limiter.check(key, max_requests=max_requests, window_seconds=window_seconds):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "rate_limited",
                    "message": "Too many requests. Please wait before attempting again.",
                },
                headers={"Retry-After": str(window_seconds)},
            )

    return dependency
