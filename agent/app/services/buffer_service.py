"""
Redis-backed message buffer.

Aggregates rapid successive messages from the same phone number
into a single batch before passing to the agent, preventing
fragmented responses when users send multiple messages quickly.
"""
import asyncio
import json
from loguru import logger
import redis.asyncio as aioredis
from app.core.config import get_settings

settings = get_settings()

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = await aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


def _key(phone: str) -> str:
    return f"buffer:{phone}"


async def push_message(phone: str, text: str) -> None:
    r = await get_redis()
    key = _key(phone)
    await r.rpush(key, text)
    await r.expire(key, settings.redis_buffer_seconds * 2)


async def wait_and_collect(phone: str) -> list[str]:
    """Wait buffer_seconds then drain all buffered messages."""
    await asyncio.sleep(settings.redis_buffer_seconds)
    r = await get_redis()
    key = _key(phone)
    messages = await r.lrange(key, 0, -1)
    await r.delete(key)
    return messages


async def is_first_in_buffer(phone: str) -> bool:
    """True if this is the first message in the buffer (caller should process)."""
    r = await get_redis()
    length = await r.llen(_key(phone))
    return length == 1


async def close():
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None
