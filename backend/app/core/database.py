"""Centralized asyncpg connection pool management for PostgreSQL."""
import asyncio
import logging
from typing import Optional
import asyncpg
from app.core.config import settings

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None


async def get_db_pool() -> asyncpg.Pool:
    """Retrieve or create a shared asyncpg connection pool."""
    global _pool
    current_loop = asyncio.get_running_loop()
    pool_loop = getattr(_pool, "_loop", None) if _pool else None

    if _pool is None or pool_loop is not current_loop or (pool_loop and pool_loop.is_closed()):
        db_url = settings.DATABASE_URL.replace("postgresql+psycopg://", "postgresql://", 1)
        _pool = await asyncpg.create_pool(db_url, min_size=1, max_size=10)
        logger.info("Initialized shared asyncpg database connection pool")
    return _pool


async def close_db_pool() -> None:
    """Close shared asyncpg connection pool during application shutdown."""
    global _pool
    if _pool is not None:
        try:
            await _pool.close()
            logger.info("Closed shared asyncpg database connection pool")
        except Exception as exc:
            logger.warning("Error closing asyncpg pool: %s", exc)
        _pool = None
