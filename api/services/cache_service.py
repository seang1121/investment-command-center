"""Two-tier cache: in-memory (fast) + SQLite (persistent).

Alpha Vantage free tier = 25 req/day, so caching is critical.
"""

import json
import logging
import time
from typing import Any

from api.models.database import db

logger = logging.getLogger(__name__)

# TTL constants (seconds)
TTL_QUOTE = 900          # 15 min for live quotes
TTL_HISTORICAL = 86400   # 24h for daily price history
TTL_DIVIDENDS = 86400    # 24h for dividend data
TTL_FUNDAMENTALS = 604800  # 7 days for company info

# In-memory cache: {key: (data, expires_at)}
_mem_cache: dict[str, tuple[Any, float]] = {}


def _mem_get(key: str) -> Any | None:
    entry = _mem_cache.get(key)
    if entry and entry[1] > time.time():
        return entry[0]
    if entry:
        del _mem_cache[key]
    return None


def _mem_set(key: str, data: Any, ttl: int) -> None:
    _mem_cache[key] = (data, time.time() + ttl)


def cache_get(key: str) -> Any | None:
    """Check in-memory first, then SQLite."""
    result = _mem_get(key)
    if result is not None:
        return result

    row = db.fetchone(
        "SELECT data, fetched_at, ttl_seconds FROM market_cache "
        "WHERE cache_key = ?",
        (key,),
    )
    if not row:
        return None

    age = time.time() - row["fetched_at"]
    if age > row["ttl_seconds"]:
        db.execute("DELETE FROM market_cache WHERE cache_key = ?", (key,))
        db.commit()
        return None

    data = json.loads(row["data"])
    remaining_ttl = int(row["ttl_seconds"] - age)
    _mem_set(key, data, remaining_ttl)
    return data


def cache_set(key: str, data: Any, ttl: int = TTL_HISTORICAL) -> None:
    """Store in both in-memory and SQLite."""
    _mem_set(key, data, ttl)
    db.execute(
        "INSERT OR REPLACE INTO market_cache "
        "(cache_key, data, fetched_at, ttl_seconds) VALUES (?, ?, ?, ?)",
        (key, json.dumps(data, default=str), time.time(), ttl),
    )
    db.commit()
    logger.debug("Cached %s (ttl=%ds)", key, ttl)


def cache_clear(pattern: str | None = None) -> int:
    """Clear cache entries. If pattern given, only matching keys."""
    if pattern:
        db.execute(
            "DELETE FROM market_cache WHERE cache_key LIKE ?",
            (f"%{pattern}%",),
        )
    else:
        db.execute("DELETE FROM market_cache")
    db.commit()
    cleared = len(_mem_cache)
    _mem_cache.clear()
    return cleared
