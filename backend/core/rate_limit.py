"""Basit, bellek-içi hız sınırlama — LLM çağrısı yapan uçlar için.

İki ayrı sınır uygulanır:
1. IP başına dakikalık limit — kötüye kullanıma/bug'lı istemcilere karşı.
2. Sunucu geneli günlük bütçe — gerçek sağlayıcı kotasını (bkz. Sprint 2'de
   yaşanan Gemini 429 RESOURCE_EXHAUSTED deneyimi) aşmadan önce kullanıcıya
   anlaşılır bir hata vermek için. Varsayılan 0 (sınırsız); `.env`'de
   `DAILY_LLM_BUDGET` ile açılır.

Not: Tek işlemli (single-process) dağıtım için yeterli. Redis/Celery henüz
yok — birden fazla worker ile çalıştırılırsa her worker kendi sayacını tutar;
IP-bazlı koruma için kabul edilebilir ama günlük bütçe garantisi yalnızca tek
worker varsayımıyla tam doğru olur.
"""
import time
from collections import defaultdict, deque
from functools import lru_cache

from fastapi import HTTPException, Request

from .config import get_settings


class SlidingWindowLimiter:
    """Anahtar başına (ör. IP) kayan pencereli istek sayacı."""

    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        """Limit aşıldıysa 429 fırlatır, aşılmadıysa isteği sayaca ekler."""
        if self.max_requests <= 0:
            return  # 0 = sınırsız

        now = time.monotonic()
        hits = self._hits[key]
        cutoff = now - self.window_seconds
        while hits and hits[0] < cutoff:
            hits.popleft()

        if len(hits) >= self.max_requests:
            retry_after = max(1, int(hits[0] + self.window_seconds - now))
            raise HTTPException(
                status_code=429,
                detail=f"Çok fazla istek gönderildi. {retry_after} saniye sonra tekrar dene.",
            )

        hits.append(now)


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@lru_cache
def _per_ip_limiter() -> SlidingWindowLimiter:
    return SlidingWindowLimiter(get_settings().rate_limit_per_minute, window_seconds=60)


@lru_cache
def _daily_budget_limiter() -> SlidingWindowLimiter:
    return SlidingWindowLimiter(get_settings().daily_llm_budget, window_seconds=86400)


async def enforce_llm_rate_limit(request: Request) -> None:
    """FastAPI dependency'si — LLM/embedding çağrısı yapan her route'a eklenir."""
    _per_ip_limiter().check(_client_key(request))
    _daily_budget_limiter().check("global")
