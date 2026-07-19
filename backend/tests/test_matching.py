import asyncio
import time
from unittest.mock import AsyncMock, patch

import pytest

from backend.agents.matching import MatchingAgent
from backend.models.profile import UserProfile
from backend.models.program import SupportProgram
from backend.models.taxonomy import Category


def _program(pid: str) -> SupportProgram:
    return SupportProgram(
        program_id=pid,
        title=f"Program {pid}",
        category="Kamu Destekleri",
        source_url=f"https://example.com/{pid}",
        body_chunk="Test içerik",
    )


@pytest.fixture
def agent():
    return MatchingAgent()


def _mock_embedding_client(vector: list[float]) -> AsyncMock:
    client = AsyncMock()
    client.embed_text = AsyncMock(return_value=vector)
    return client


@pytest.mark.asyncio
async def test_query_text_is_embedded_and_passed_to_repo(agent):
    """Profilden kurulan sorgu metni embed'lenmeli, embedding de match_programs'a gitmeli."""
    profile = UserProfile(summary="Düzce'de yazılım girişimi")
    with patch(
        "backend.agents.matching.get_embedding_client",
        return_value=_mock_embedding_client([0.1, 0.2, 0.3]),
    ) as get_client, patch(
        "backend.data.repo.match_programs", return_value=[_program("p1")]
    ) as match_programs:
        result = await agent.run(profile, limit=3)

    get_client.return_value.embed_text.assert_awaited_once_with(profile.to_query_text())
    match_programs.assert_called_once_with([0.1, 0.2, 0.3], match_count=3, category=None)
    assert [p.program_id for p in result] == ["p1"]


@pytest.mark.asyncio
async def test_empty_profile_returns_empty_without_embedding_call(agent):
    """Boş profilde to_query_text() '' döner — hiç embedding çağrısı yapılmamalı."""
    profile = UserProfile()
    with patch("backend.agents.matching.get_embedding_client") as get_client:
        result = await agent.run(profile)

    get_client.assert_not_called()
    assert result == []


@pytest.mark.asyncio
async def test_category_filter_is_forwarded(agent):
    """category parametresi değişmeden match_programs'a iletilmeli."""
    profile = UserProfile(summary="Ar-Ge hibesi arıyorum")
    with patch(
        "backend.agents.matching.get_embedding_client",
        return_value=_mock_embedding_client([0.5]),
    ), patch("backend.data.repo.match_programs", return_value=[]) as match_programs:
        await agent.run(profile, limit=5, category=Category.KAMU)

    match_programs.assert_called_once_with([0.5], match_count=5, category=Category.KAMU)


@pytest.mark.asyncio
async def test_source_url_preserved_in_results(agent):
    """repo'dan dönen source_url alanı sonuçlarda değişmeden korunmalı."""
    profile = UserProfile(summary="test sorgusu")
    program = _program("bigg")
    with patch(
        "backend.agents.matching.get_embedding_client",
        return_value=_mock_embedding_client([0.1]),
    ), patch("backend.data.repo.match_programs", return_value=[program]):
        result = await agent.run(profile)

    assert result[0].source_url == "https://example.com/bigg"


@pytest.mark.asyncio
async def test_concurrent_matching_calls_do_not_block_each_other(agent):
    """Eşzamanlı çağrılar birbirini bloklamamalı (deadlock/sıralı-blokaj regresyonuna karşı).

    Gerçek performans/yük testi prod veri ve altyapı gerektirir, kapsam dışı;
    burada asıl doğrulanan şey eşzamanlılığın bozulmamış olması.
    """

    async def slow_embed(_text: str) -> list[float]:
        await asyncio.sleep(0.05)
        return [0.1]

    slow_client = AsyncMock()
    slow_client.embed_text = slow_embed

    with patch("backend.agents.matching.get_embedding_client", return_value=slow_client), patch(
        "backend.data.repo.match_programs", return_value=[_program("p1")]
    ):
        profiles = [UserProfile(summary=f"profil {i}") for i in range(10)]
        t0 = time.monotonic()
        results = await asyncio.gather(*(agent.run(p) for p in profiles))
        duration = time.monotonic() - t0

    assert len(results) == 10
    # Sıralı çalışsaydı ~0.5s (10 x 0.05s) sürerdi; eşzamanlı çalışıyorsa çok daha hızlı olmalı.
    assert duration < 0.3
