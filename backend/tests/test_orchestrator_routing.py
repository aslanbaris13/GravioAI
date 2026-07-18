from unittest.mock import AsyncMock, patch

import pytest

from backend.agents.orchestrator import Orchestrator
from backend.models.eligibility import EligibilityResult, EligibilityState
from backend.models.intent import Intent, IntentResult
from backend.models.profile import UserProfile
from backend.models.program import SupportProgram


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


@pytest.fixture
def orchestrator():
    return Orchestrator()


@pytest.mark.asyncio
async def test_greeting_skips_agent_chain(orchestrator):
    """greeting/off_topic'te profil/eşleştirme/uygunluk hiç çalışmamalı — sadece reply."""
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.GREETING, confidence=0.9)),
    ), patch.object(
        orchestrator._profile_agent, "run", new=AsyncMock(side_effect=AssertionError("çağrılmamalıydı")),
    ), patch.object(
        orchestrator._matching_agent, "run", new=AsyncMock(side_effect=AssertionError("çağrılmamalıydı")),
    ), patch.object(
        orchestrator._profile_agent, "_chat_with_history", new=AsyncMock(return_value="Merhaba!"),
    ):
        result = await orchestrator.run("selam")

    assert result.matches == []
    assert result.reply == "Merhaba!"


@pytest.mark.asyncio
async def test_program_question_skips_profile_extraction(orchestrator):
    """program_question'da ProfileExtractor.run çağrılmamalı; eşleştirme mesaj metniyle yapılmalı."""
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.PROGRAM_QUESTION, confidence=0.9)),
    ), patch.object(
        orchestrator._profile_agent, "run", new=AsyncMock(side_effect=AssertionError("çağrılmamalıydı")),
    ), patch.object(
        orchestrator._matching_agent, "run", new=AsyncMock(return_value=[_program("p1"), _program("p2")]),
    ) as matching_run, patch.object(
        orchestrator._eligibility_agent, "run",
        new=AsyncMock(side_effect=[_eligibility(40), _eligibility(90)]),
    ), patch.object(
        orchestrator._profile_agent, "_chat_with_history", new=AsyncMock(return_value="İşte bulduklarım."),
    ):
        result = await orchestrator.run("Ar-Ge hibesi var mı?")

    # Eşleştirmeye giden profil, mesajın kendisinden kurulmuş olmalı (summary)
    called_profile = matching_run.call_args.args[0]
    assert called_profile.summary == "Ar-Ge hibesi var mı?"

    # En yüksek skor önce gelmeli
    assert [m.eligibility.score for m in result.matches] == [90, 40]


@pytest.mark.asyncio
async def test_profile_info_runs_full_chain_unchanged(orchestrator):
    """profile_info -> Profil Çıkarma + Eşleştirme + Uygunluk tam zinciri (mevcut davranış)."""
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.PROFILE_INFO, confidence=0.95)),
    ), patch.object(
        orchestrator._profile_agent, "run", new=AsyncMock(return_value=UserProfile(sector="Yazılım")),
    ), patch.object(
        orchestrator._matching_agent, "run", new=AsyncMock(return_value=[_program("p3")]),
    ), patch.object(
        orchestrator._eligibility_agent, "run", new=AsyncMock(return_value=_eligibility(70)),
    ), patch.object(
        orchestrator._profile_agent, "_chat_with_history", new=AsyncMock(return_value="Profilin çıkarıldı."),
    ):
        result = await orchestrator.run("Düzce'de yazılım şirketi kurdum, 3 kişiyiz")

    assert result.profile.sector == "Yazılım"
    assert len(result.matches) == 1


@pytest.mark.asyncio
async def test_session_id_triggers_memory_save(orchestrator):
    """session_id verilince tur bitiminde MemoryAgent.save doğru profil/eşleşmelerle çağrılmalı."""
    profile = UserProfile(sector="Yazılım")
    matches = [_program("p3")]
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.PROFILE_INFO, confidence=0.95)),
    ), patch.object(
        orchestrator._profile_agent, "run", new=AsyncMock(return_value=profile),
    ), patch.object(
        orchestrator._matching_agent, "run", new=AsyncMock(return_value=matches),
    ), patch.object(
        orchestrator._eligibility_agent, "run", new=AsyncMock(return_value=_eligibility(70)),
    ), patch.object(
        orchestrator._profile_agent, "_chat_with_history", new=AsyncMock(return_value="Profilin çıkarıldı."),
    ), patch.object(
        orchestrator._memory_agent, "save", new=AsyncMock(),
    ) as save_mock:
        result = await orchestrator.run("Düzce'de yazılım şirketi kurdum", session_id="sess-1")

    save_mock.assert_awaited_once()
    called_session_id, called_profile, called_matches = save_mock.call_args.args
    assert called_session_id == "sess-1"
    assert called_profile.sector == "Yazılım"
    assert [m.program.program_id for m in called_matches] == [m.program.program_id for m in result.matches]


@pytest.mark.asyncio
async def test_no_session_id_skips_memory_save(orchestrator):
    """session_id verilmezse hafızaya hiç yazılmamalı (ör. geriye dönük uyumlu çağrılar)."""
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.GREETING, confidence=0.9)),
    ), patch.object(
        orchestrator._profile_agent, "_chat_with_history", new=AsyncMock(return_value="Merhaba!"),
    ), patch.object(
        orchestrator._memory_agent, "save", new=AsyncMock(),
    ) as save_mock:
        await orchestrator.run("selam")

    save_mock.assert_not_awaited()


@pytest.mark.asyncio
async def test_memory_save_failure_does_not_break_reply(orchestrator):
    """Hafıza kaydı hata fırlatsa bile kullanıcı yine de yanıt almalı."""
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.GREETING, confidence=0.9)),
    ), patch.object(
        orchestrator._profile_agent, "_chat_with_history", new=AsyncMock(return_value="Merhaba!"),
    ), patch.object(
        orchestrator._memory_agent, "save", new=AsyncMock(side_effect=RuntimeError("Supabase çöktü")),
    ):
        result = await orchestrator.run("selam", session_id="sess-2")

    assert result.reply == "Merhaba!"


@pytest.mark.asyncio
async def test_apply_request_uses_single_targeted_match(orchestrator):
    """apply_request -> profil çıkarılır, sadece 1 aday eşleştirilir ve
    değerlendirilir (tam zincirdeki 5 aday/3 değerlendirme yerine)."""
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.APPLY_REQUEST, confidence=0.9)),
    ), patch.object(
        orchestrator._profile_agent, "run", new=AsyncMock(return_value=UserProfile(sector="Yazılım")),
    ), patch.object(
        orchestrator._matching_agent, "run", new=AsyncMock(return_value=[_program("bigg")]),
    ) as matching_run, patch.object(
        orchestrator._eligibility_agent, "run", new=AsyncMock(return_value=_eligibility(85)),
    ) as eligibility_run, patch.object(
        orchestrator._profile_agent, "_chat_with_history", new=AsyncMock(return_value="Başvuru için..."),
    ):
        result = await orchestrator.run("BİGG'e nasıl başvururum?")

    matching_run.assert_awaited_once()
    assert matching_run.call_args.kwargs.get("limit") == 1
    eligibility_run.assert_awaited_once()  # tam zincirdeki gibi birden fazla değil
    assert len(result.matches) == 1
    assert result.matches[0].program.program_id == "bigg"


@pytest.mark.asyncio
async def test_apply_request_falls_back_to_message_query_when_profile_yields_nothing(orchestrator):
    """Profil-bazlı eşleştirme boş dönerse, mesajın kendisiyle tekrar denenmeli."""
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.APPLY_REQUEST, confidence=0.9)),
    ), patch.object(
        orchestrator._profile_agent, "run", new=AsyncMock(return_value=UserProfile()),
    ), patch.object(
        orchestrator._matching_agent, "run",
        new=AsyncMock(side_effect=[[], [_program("marka")]]),
    ) as matching_run, patch.object(
        orchestrator._eligibility_agent, "run", new=AsyncMock(return_value=_eligibility(60)),
    ), patch.object(
        orchestrator._profile_agent, "_chat_with_history", new=AsyncMock(return_value="Başvuru için..."),
    ):
        result = await orchestrator.run("MARKA'ya başvurmak istiyorum")

    assert matching_run.await_count == 2
    assert len(result.matches) == 1
    assert result.matches[0].program.program_id == "marka"


@pytest.mark.asyncio
async def test_apply_request_no_candidates_returns_clarifying_reply(orchestrator):
    """Hiç aday bulunamazsa çökmemeli, açıklayıcı bir yanıt dönmeli."""
    with patch.object(
        orchestrator._intent_agent, "run",
        new=AsyncMock(return_value=IntentResult(intent=Intent.APPLY_REQUEST, confidence=0.9)),
    ), patch.object(
        orchestrator._profile_agent, "run", new=AsyncMock(return_value=UserProfile()),
    ), patch.object(
        orchestrator._matching_agent, "run", new=AsyncMock(return_value=[]),
    ):
        result = await orchestrator.run("başvurmak istiyorum")

    assert result.matches == []
    assert "anlayamadım" in result.reply.lower()


@pytest.mark.asyncio
async def test_intent_classifier_failure_falls_back_safely(orchestrator):
    """Sınıflandırıcı çökerse kullanıcı yanıtsız kalmamalı — tam zincire düşülmeli.

    Eşleştirme boş döndüğünde `_compose_reply_llm` zaten deterministik bir mesajla
    erken döner (LLM'e hiç gitmez) — bu, sınıflandırıcının çökmesinden bağımsız,
    var olan bir davranış; burada asıl doğrulanan şey tam zincirin (profil +
    eşleştirme) yine de çalışmış olması.
    """
    with patch.object(
        orchestrator._intent_agent, "run", new=AsyncMock(side_effect=RuntimeError("LLM çöktü")),
    ), patch.object(
        orchestrator._profile_agent, "run", new=AsyncMock(return_value=UserProfile()),
    ) as profile_run, patch.object(
        orchestrator._matching_agent, "run", new=AsyncMock(return_value=[]),
    ) as matching_run:
        result = await orchestrator.run("garip bir mesaj")

    profile_run.assert_awaited_once()
    matching_run.assert_awaited_once()
    assert result.matches == []
    assert "biraz daha bilgi" in result.reply.lower()
