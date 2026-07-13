"""Orkestratör — ajanları niyete göre zincirleyen beyin (SCRUM-96).

Her mesaj önce Niyet Sınıflandırma Ajanı'ndan (`IntentClassifier`) geçer, sonra
niyete göre üç zincirden biri çalışır (bkz. docs/chat-flow/03-prompt-akisi.md):

    - greeting / off_topic  -> sadece LLM ile kısa yanıt (ajan zinciri yok)
    - program_question      -> doğrudan mesaj metniyle eşleştirme (profil
                               çıkarma atlanır), ardından uygunluk + yanıt
    - profile_info / apply_request / belirsiz (confidence düşük)
                            -> tam zincir: Profil Çıkarma -> Eşleştirme ->
                               Uygunluk -> Reply üretme (SCRUM-96 öncesi
                               davranışla birebir aynı)

`Orchestrator.run()` imzası ve `AssistResult` şeması sabit tutulur; frontend
hiçbir değişiklik gerektirmez.
"""
import asyncio
import logging
import time

from ..core.llm import LLMMessage
from ..models.intent import Intent, IntentResult
from ..models.orchestration import AssistResult, ConversationTurn, ProgramMatch
from ..models.profile import UserProfile
from .eligibility import EligibilityAgent
from .intent_classifier import IntentClassifier
from .matching import MatchingAgent
from .profile_extractor import ProfileExtractor

logger = logging.getLogger(__name__)


_REPLY_SYSTEM = (
    "Sen GravioAI asistanısın; Türkiye'deki girişim ve KOBİ'lere devlet/özel "
    "sektör destek programları konusunda yardım edersin. Kısa, samimi ve "
    "Türkçe yanıt ver. Kullanıcıya bulunan programlar hakkında kısa bir özet "
    "sun; programa başvurabilir ya da uygunluğunu kontrol edebilir. "
    "Teknik jargon kullanma."
)

_SMALL_TALK_INSTRUCTIONS = {
    Intent.GREETING: (
        "Kullanıcı seni selamladı veya teşekkür etti, henüz işletmesi hakkında "
        "bilgi vermedi. Kısaca karşıla ve sektör/şehir/ekip büyüklüğü gibi "
        "bilgileri sormaya davet et."
    ),
    Intent.OFF_TOPIC: (
        "Kullanıcının mesajı GravioAI'nin kapsamı (girişim/KOBİ destek "
        "programları) dışında. Nazikçe bunu belirt ve konuyu destek "
        "programlarına yönlendir."
    ),
}

_SMALL_TALK_FALLBACK = (
    "Merhaba! İşletmeni birkaç cümleyle anlatırsan sana uygun destekleri bulabilirim."
)


class Orchestrator:
    name = "orchestrator"

    def __init__(self) -> None:
        self._intent_agent = IntentClassifier()
        self._profile_agent = ProfileExtractor()
        self._matching_agent = MatchingAgent()
        self._eligibility_agent = EligibilityAgent()

    async def run(
        self,
        message: str,
        *,
        history: list[ConversationTurn] | None = None,
        match_limit: int = 5,
        eligibility_limit: int = 3,
    ) -> AssistResult:
        t0 = time.monotonic()
        intent_result = await self._classify_intent(message, history)

        try:
            if intent_result.intent in (Intent.GREETING, Intent.OFF_TOPIC):
                logger.info("chain_selected intent=%s chain=small_talk", intent_result.intent.value)
                result = await self._run_small_talk(message, history, intent_result.intent)
            elif intent_result.intent == Intent.PROGRAM_QUESTION:
                logger.info("chain_selected intent=%s chain=program_question", intent_result.intent.value)
                result = await self._run_program_question(message, match_limit, eligibility_limit)
            else:
                logger.info("chain_selected intent=%s chain=full", intent_result.intent.value)
                result = await self._run_full_chain(message, history, match_limit, eligibility_limit)
        except Exception:
            logger.exception("chain_failed intent=%s", intent_result.intent.value)
            raise

        duration_ms = (time.monotonic() - t0) * 1000
        logger.info("chain_completed intent=%s duration_ms=%.0f", intent_result.intent.value, duration_ms)
        return result

    async def _classify_intent(
        self, message: str, history: list[ConversationTurn] | None
    ) -> IntentResult:
        try:
            result = await self._intent_agent.run(message, history=history)
        except Exception:
            # Sınıflandırıcı çökerse en güvenli varsayılana düş (tam zincir) —
            # kullanıcı hiçbir durumda yanıtsız kalmamalı.
            logger.exception("intent_classification_failed")
            return IntentResult(intent=Intent.PROFILE_INFO, confidence=0.0)
        logger.info(
            "intent_classified intent=%s confidence=%.2f message_len=%d",
            result.intent.value, result.confidence, len(message),
        )
        return result

    async def _run_small_talk(
        self,
        message: str,
        history: list[ConversationTurn] | None,
        intent: Intent,
    ) -> AssistResult:
        """Ajan zinciri çalıştırmadan (profil/eşleştirme/uygunluk yok) kısa yanıt üretir."""
        llm_history = self._build_llm_history(history)
        instruction = _SMALL_TALK_INSTRUCTIONS[intent]
        llm_history.append(
            LLMMessage(role="user", content=f"{instruction}\n\nKullanıcı mesajı: {message}")
        )
        try:
            reply = await self._profile_agent._chat_with_history(
                llm_history, system=_REPLY_SYSTEM, max_tokens=256,
            )
        except Exception:  # noqa: BLE001 — reply üretilemezse deterministik fallback
            reply = _SMALL_TALK_FALLBACK
        return AssistResult(profile=UserProfile(), matches=[], reply=reply)

    async def _run_program_question(
        self,
        message: str,
        match_limit: int,
        eligibility_limit: int,
    ) -> AssistResult:
        """Profil çıkarmadan, doğrudan mesaj metniyle eşleştirme yapar.

        Kullanıcı henüz kendi profilini paylaşmadığı için uygunluk
        değerlendirmesi boş bir profille yapılır; `EligibilityAgent`'ın
        prompt'u zaten "bilgi yoksa varsayım yapma, temkinli değerlendir"
        talimatını içerir, bu yüzden ayrı bir "unscored" durumu gerekmez.
        """
        query_profile = UserProfile(summary=message)
        candidates = await self._matching_agent.run(
            query_profile, limit=min(match_limit, 3)
        )

        scored = candidates[:eligibility_limit]
        evaluations = await asyncio.gather(
            *(self._eligibility_agent.run(query_profile, p) for p in scored)
        )
        matches = [
            ProgramMatch(program=p, eligibility=e)
            for p, e in zip(scored, evaluations)
        ]
        matches.sort(key=lambda m: m.eligibility.score, reverse=True)

        reply = await self._compose_reply_llm(message, matches, None)
        return AssistResult(profile=query_profile, matches=matches, reply=reply)

    async def _run_full_chain(
        self,
        message: str,
        history: list[ConversationTurn] | None,
        match_limit: int,
        eligibility_limit: int,
    ) -> AssistResult:
        """Bugüne kadarki (niyet ayrımı öncesi) tam zincir: değişmedi."""
        # 1) Profil çıkar — geçmiş bağlamıyla
        profile = await self._profile_agent.run(message, history=history)

        # 2) Aday programları getir
        candidates = await self._matching_agent.run(profile, limit=match_limit)

        # 3) En iyi adaylar için uygunluğu paralel değerlendir
        scored = candidates[:eligibility_limit]
        evaluations = await asyncio.gather(
            *(self._eligibility_agent.run(profile, p) for p in scored)
        )
        matches = [
            ProgramMatch(program=p, eligibility=e)
            for p, e in zip(scored, evaluations)
        ]
        matches.sort(key=lambda m: m.eligibility.score, reverse=True)

        # 4) LLM ile bağlamsal reply üret
        reply = await self._compose_reply_llm(message, matches, history)

        return AssistResult(
            profile=profile,
            matches=matches,
            reply=reply,
        )

    def _build_llm_history(
        self, history: list[ConversationTurn] | None
    ) -> list[LLMMessage]:
        llm_history: list[LLMMessage] = []
        if history:
            for turn in history:
                role = "user" if turn.role == "user" else "assistant"
                llm_history.append(LLMMessage(role=role, content=turn.content))
        return llm_history

    async def _compose_reply_llm(
        self,
        last_message: str,
        matches: list[ProgramMatch],
        history: list[ConversationTurn] | None,
    ) -> str:
        """LLM ile bağlamsal sohbet yanıtı üretir.

        Konuşma geçmişi + eşleşen programların özeti birleştirilerek
        kullanıcıya yönelik doğal dilde bir yanıt oluşturulur.
        """
        if not matches:
            return (
                "Profilini tam çıkaramadım. İşletmen hakkında biraz daha bilgi "
                "verir misin? (sektör, şehir, ekip büyüklüğü, hedefin)"
            )

        # Eşleşen programların kısa özetini hazırla
        program_lines = []
        for i, m in enumerate(matches, 1):
            p = m.program
            e = m.eligibility
            program_lines.append(
                f"{i}. {p.program_name} ({getattr(p, 'institution', '') or ''}) — "
                f"{e.label} (skor: {e.score}/100)"
            )
        programs_text = "\n".join(program_lines)

        # LLM'e gönderilecek mesaj geçmişini oluştur
        llm_history = self._build_llm_history(history)

        # Son kullanıcı mesajına program bilgisini ekle
        user_prompt = (
            f"Kullanıcı mesajı: {last_message}\n\n"
            f"Bulunan uygun programlar:\n{programs_text}\n\n"
            "Kullanıcıya kısa ve samimi bir yanıt ver; programları özetle, "
            "detay ve uygunluk listesi için arayüzü işaret et."
        )
        llm_history.append(LLMMessage(role="user", content=user_prompt))

        try:
            return await self._profile_agent._chat_with_history(
                llm_history,
                system=_REPLY_SYSTEM,
                max_tokens=512,
            )
        except Exception:  # noqa: BLE001 — reply üretilemezse deterministik fallback
            top = matches[0]
            return (
                f"Profiline göre {len(matches)} uygun destek buldum. "
                f"En uygunu {top.program.program_name} ({top.eligibility.label}). "
                "Detaylar ve uygunluk koşulları listede."
            )
