from unittest.mock import AsyncMock, patch

import pytest

from agents.orchestrator import Orchestrator
from models.eligibility import EligibilityResult, EligibilityState
from models.intent import Intent, IntentResult
from models.profile import UserProfile
from models.program import SupportProgram


def _program(pid: str) -> SupportProgram:
    return SupportProgram(
        program_id=pid,
        title=f"Program {pid}",
        category="Kamu Destekleri",
        source_url="https://example.com",
        body_chunk="Test içerik",
    )


def _eligibility(score: int) -> EligibilityResult:
    return EligibilityResult(state=EligibilityState.PARTIAL, score=score, label="Test", conditions=[])


def _fake_stream(chunks: list[str]):
    """`_chat_stream_with_history`'nin yerine geçecek sahte bir async generator üretir."""

    async def _gen(*args, **kwargs):
        for c in chunks:
            yield c

    return _gen


@pytest.fixture
def orchestrator():
    return Orchestrator()


@pytest.mark.asyncio
async def test_stream_yields_meta_then_tokens_then_done(orchestrator):
    """Doğru event sırası: meta -> token* -> done; token'lar birleşince tam yanıtı vermeli."""
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.PROFILE_INFO, confidence=0.9)),
    ), patch.object(
        orchestrator._profile_agent, "run", new=AsyncMock(return_value=UserProfile(sector="Yazılım")),
    ), patch.object(
        orchestrator._matching_agent, "run", new=AsyncMock(return_value=[_program("p1")]),
    ), patch.object(
        orchestrator._eligibility_agent, "run", new=AsyncMock(return_value=_eligibility(80)),
    ), patch.object(
        orchestrator._profile_agent, "_chat_stream_with_history", new=_fake_stream(["Merhaba", " dünya"]),
    ):
        events = [e async for e in orchestrator.run_stream("mesaj")]

    assert events[0]["type"] == "meta"
    assert events[0]["profile"]["sector"] == "Yazılım"
    assert len(events[0]["matches"]) == 1
    assert [e["type"] for e in events[1:-1]] == ["token", "token"]
    assert "".join(e["text"] for e in events[1:-1]) == "Merhaba dünya"
    assert events[-1] == {"type": "done"}


@pytest.mark.asyncio
async def test_stream_greeting_has_empty_meta_and_skips_agent_chain(orchestrator):
    """greeting'de profil/eşleştirme/uygunluk hiç çalışmamalı — run()'daki davranışla aynı."""
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.GREETING, confidence=0.9)),
    ), patch.object(
        orchestrator._profile_agent, "run", new=AsyncMock(side_effect=AssertionError("çağrılmamalıydı")),
    ), patch.object(
        orchestrator._matching_agent, "run", new=AsyncMock(side_effect=AssertionError("çağrılmamalıydı")),
    ), patch.object(
        orchestrator._profile_agent, "_chat_stream_with_history", new=_fake_stream(["Merhaba!"]),
    ):
        events = [e async for e in orchestrator.run_stream("selam")]

    assert events[0]["type"] == "meta"
    assert events[0]["matches"] == []
    assert events[1] == {"type": "token", "text": "Merhaba!"}
    assert events[-1] == {"type": "done"}


@pytest.mark.asyncio
async def test_stream_apply_request_no_match_yields_single_fixed_token(orchestrator):
    """Aday bulunamazsa LLM'e hiç gitmeden sabit açıklayıcı mesaj tek bir token olarak gelmeli."""
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.APPLY_REQUEST, confidence=0.9)),
    ), patch.object(
        orchestrator._profile_agent, "run", new=AsyncMock(return_value=UserProfile()),
    ), patch.object(
        orchestrator._matching_agent, "run", new=AsyncMock(return_value=[]),
    ):
        events = [e async for e in orchestrator.run_stream("başvurmak istiyorum")]

    tokens = [e for e in events if e["type"] == "token"]
    assert len(tokens) == 1
    assert "anlayamadım" in tokens[0]["text"].lower()
    assert events[-1] == {"type": "done"}


@pytest.mark.asyncio
async def test_stream_error_event_on_failure(orchestrator):
    """Zincir bir hata fırlatırsa akış 'error' event'iyle sonlanmalı, 'done' gelmemeli."""
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.PROFILE_INFO, confidence=0.95)),
    ), patch.object(
        orchestrator._profile_agent, "run", new=AsyncMock(side_effect=RuntimeError("Supabase çöktü")),
    ):
        events = [e async for e in orchestrator.run_stream("mesaj")]

    assert events == [{"type": "error", "message": "Supabase çöktü"}]


@pytest.mark.asyncio
async def test_stream_session_id_triggers_memory_save(orchestrator):
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.GREETING, confidence=0.9)),
    ), patch.object(
        orchestrator._profile_agent, "_chat_stream_with_history", new=_fake_stream(["Merhaba!"]),
    ), patch.object(
        orchestrator._memory_agent, "save", new=AsyncMock(),
    ) as save_mock:
        events = [e async for e in orchestrator.run_stream("selam", session_id="sess-1")]

    save_mock.assert_awaited_once()
    assert events[-1] == {"type": "done"}
