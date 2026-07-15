import pytest
from fastapi import HTTPException

from backend.core.rate_limit import SlidingWindowLimiter


def test_allows_requests_under_limit():
    limiter = SlidingWindowLimiter(max_requests=3, window_seconds=60)
    limiter.check("client-a")
    limiter.check("client-a")
    limiter.check("client-a")  # 3. istek de geçmeli


def test_blocks_requests_over_limit():
    limiter = SlidingWindowLimiter(max_requests=2, window_seconds=60)
    limiter.check("client-a")
    limiter.check("client-a")
    with pytest.raises(HTTPException) as exc_info:
        limiter.check("client-a")
    assert exc_info.value.status_code == 429


def test_keys_are_independent():
    limiter = SlidingWindowLimiter(max_requests=1, window_seconds=60)
    limiter.check("client-a")
    limiter.check("client-b")  # farklı anahtar, kendi sayacı — patlamamalı


def test_zero_max_requests_means_unlimited():
    limiter = SlidingWindowLimiter(max_requests=0, window_seconds=60)
    for _ in range(50):
        limiter.check("client-a")


def test_window_expiry_resets_limit():
    limiter = SlidingWindowLimiter(max_requests=1, window_seconds=0.05)
    limiter.check("client-a")
    with pytest.raises(HTTPException):
        limiter.check("client-a")

    import time
    time.sleep(0.06)
    limiter.check("client-a")  # pencere geçti, tekrar izin verilmeli
