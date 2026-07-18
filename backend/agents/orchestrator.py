"""Orkestratör — ajanları niyete göre zincirleyen beyin (SCRUM-96).

Her mesaj önce Niyet Sınıflandırma Ajanı'ndan (`IntentClassifier`) geçer, sonra
niyete göre dört zincirden biri çalışır (bkz. docs/chat-flow/03-prompt-akisi.md):

    - greeting / off_topic  -> sadece LLM ile kısa yanıt (ajan zinciri yok)
    - program_question      -> doğrudan mesaj metniyle eşleştirme (profil
                               çıkarma atlanır), ardından uygunluk + yanıt
    - apply_request         -> profil çıkar, mesajla en alakalı TEK programı
                               bul, sadece onun için uygunluk değerlendir,
                               başvuru sürecine yönlendiren bir yanıt üret
    - profile_info / belirsiz (confidence düşük)
                            -> tam zincir: Profil Çıkarma -> Eşleştirme ->
                               Uygunluk -> Reply üretme (SCRUM-96 öncesi
                               davranışla birebir aynı)

`Orchestrator.run()` imzası ve `AssistResult` şeması sabit tutulur; frontend
hiçbir değişiklik gerektirmez.
"""
import asyncio
import logging
import time
from typing import AsyncIterator

from ..core.llm import LLMMessage
from ..models.intent import Intent, IntentResult
from ..models.orchestration import AssistResult, ConversationTurn, ProgramMatch
from ..models.profile import UserProfile
from .eligibility import EligibilityAgent
from .intent_classifier import IntentClassifier
from .matching import MatchingAgent
from .memory import MemoryAgent
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

_APPLY_REPLY_SYSTEM = (
    "Sen GravioAI asistanısın. Kullanıcı bir destek/hibe programına nasıl "
    "başvuracağını soruyor. Bulunan en uygun programı kısaca tanıt, başvuru "
    "için genel adımları özetle (uygunluk koşullarını kontrol et, gerekli "
    "belgeleri hazırla) ve arayüzdeki 'Başvuru hazırla' seçeneğini işaret et. "
    "Kısa, samimi ve Türkçe yaz. Teknik jargon kullanma."
)

_APPLY_NO_MATCH_REPLY = (
    "Hangi programa başvurmak istediğini tam anlayamadım. Program adını "
    "veya işletmenle ilgili birkaç detay (sektör, şehir, hedef) paylaşır mısın?"
)


class Orchestrator:
    name = "orchestrator"

    def __init__(self) -> None:
        self._intent_agent = IntentClassifier()
        self._profile_agent = ProfileExtractor()
        self._matching_agent = MatchingAgent()
        self._eligibility_agent = EligibilityAgent()
        self._memory_agent = MemoryAgent()

    async def run(
        self,
        message: str,
        *,
        history: list[ConversationTurn] | None = None,
        session_id: str | None = None,
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
            elif intent_result.intent == Intent.APPLY_REQUEST:
                logger.info("chain_selected intent=%s chain=apply_request", intent_result.intent.value)
                result = await self._run_apply_request(message, history)
            else:
                logger.info("chain_selected intent=%s chain=full", intent_result.intent.value)
                result = await self._run_full_chain(message, history, match_limit, eligibility_limit)
        except Exception:
            logger.exception("chain_failed intent=%s", intent_result.intent.value)
            raise

        duration_ms = (time.monotonic() - t0) * 1000
        logger.info("chain_completed intent=%s duration_ms=%.0f", intent_result.intent.value, duration_ms)

        if session_id:
            await self._save_memory(session_id, result)

        return result

    async def _save_memory(self, session_id: str, result: AssistResult) -> None:
        """Turu hafızaya kaydeder — başarısız olsa bile kullanıcı yanıtsız kalmamalı."""
        try:
            await self._memory_agent.save(session_id, result.profile, result.matches)
        except Exception:  # noqa: BLE001 — kayıt hatası sohbeti kesmemeli
            logger.exception("memory_save_failed session_id=%s", session_id)

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

    async def _prepare_program_question(
        self,
        message: str,
        match_limit: int,
        eligibility_limit: int,
    ) -> tuple[UserProfile, list[ProgramMatch]]:
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
        return query_profile, matches

    async def _run_program_question(
        self,
        message: str,
        match_limit: int,
        eligibility_limit: int,
    ) -> AssistResult:
        query_profile, matches = await self._prepare_program_question(
            message, match_limit, eligibility_limit
        )
        reply = await self._compose_reply_llm(message, matches, None)
        return AssistResult(profile=query_profile, matches=matches, reply=reply)

    async def _prepare_apply_request(
        self,
        message: str,
        history: list[ConversationTurn] | None,
    ) -> tuple[UserProfile, list[ProgramMatch]]:
        """Kullanıcı bir programa başvurmak istiyor.

        Tam zincirden farkı: 5 aday yerine mesajla en alakalı TEK programı
        bulur ve sadece onun için uygunluk değerlendirir (daha az LLM çağrısı,
        daha odaklı yanıt). Hangi programa başvurulacağı frontend'de zaten
        ayrı bir CTA/`/api/application` çağrısıyla netleşiyor — buradaki amaç
        sohbette doğru yöne işaret etmek. `matches` boşsa aday bulunamamıştır
        (reply seçimi çağırana bırakılır — LLM'siz sabit mesaj mı, yoksa
        stream'lenecek bir başvuru yanıtı mı gerektiği duruma göre değişir).
        """
        profile = await self._profile_agent.run(message, history=history)

        candidates = await self._matching_agent.run(profile, limit=1)
        if not candidates:
            # Profil boşsa (ör. sadece program adı yazıldıysa) mesajın
            # kendisiyle dene — program_question'daki gibi.
            query_profile = UserProfile(summary=message)
            candidates = await self._matching_agent.run(query_profile, limit=1)
            if candidates:
                profile = query_profile

        if not candidates:
            return profile, []

        top = candidates[0]
        eligibility = await self._eligibility_agent.run(profile, top)
        return profile, [ProgramMatch(program=top, eligibility=eligibility)]

    async def _run_apply_request(
        self,
        message: str,
        history: list[ConversationTurn] | None,
    ) -> AssistResult:
        profile, matches = await self._prepare_apply_request(message, history)
        if not matches:
            return AssistResult(profile=profile, matches=[], reply=_APPLY_NO_MATCH_REPLY)

        reply = await self._compose_apply_reply(message, matches[0])
        return AssistResult(profile=profile, matches=matches, reply=reply)

    async def _prepare_full_chain(
        self,
        message: str,
        history: list[ConversationTurn] | None,
        match_limit: int,
        eligibility_limit: int,
    ) -> tuple[UserProfile, list[ProgramMatch]]:
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
        return profile, matches

    async def _run_full_chain(
        self,
        message: str,
        history: list[ConversationTurn] | None,
        match_limit: int,
        eligibility_limit: int,
    ) -> AssistResult:
        profile, matches = await self._prepare_full_chain(
            message, history, match_limit, eligibility_limit
        )
        reply = await self._compose_reply_llm(message, matches, history)
        return AssistResult(profile=profile, matches=matches, reply=reply)

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
                f"{i}. {p.title} ({p.source or ''}) — "
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
                f"En uygunu {top.program.title} ({top.eligibility.label}). "
                "Detaylar ve uygunluk koşulları listede."
            )

    async def _compose_apply_reply(self, message: str, match: ProgramMatch) -> str:
        """apply_request için başvuru sürecine odaklı bir yanıt üretir."""
        user_prompt = (
            f"Kullanıcı mesajı: {message}\n\n"
            f"En uygun program: {match.program.title} ({match.program.source or ''}) — "
            f"{match.eligibility.label} (skor: {match.eligibility.score}/100)\n\n"
            "Kullanıcıya bu programa nasıl başvuracağını kısaca anlat."
        )
        try:
            return await self._profile_agent._chat_with_history(
                [LLMMessage(role="user", content=user_prompt)],
                system=_APPLY_REPLY_SYSTEM,
                max_tokens=400,
            )
        except Exception:  # noqa: BLE001 — reply üretilemezse deterministik fallback
            return (
                f"{match.program.title} programı için uygunluğun: {match.eligibility.label} "
                f"({match.eligibility.score}/100). Başvuru hazırlığı için detay ekranındaki "
                "'Başvuru hazırla' seçeneğini kullanabilirsin."
            )

    # ------------------------------------------------------------------ #
    # Streaming — run() ile aynı yönlendirme/hesaplama, sadece son "reply"    #
    # adımı token token yield edilir. run()'a hiç dokunulmaz.               #
    # ------------------------------------------------------------------ #

    async def run_stream(
        self,
        message: str,
        *,
        history: list[ConversationTurn] | None = None,
        session_id: str | None = None,
        match_limit: int = 5,
        eligibility_limit: int = 3,
    ) -> AsyncIterator[dict]:
        """`run()`'ın streaming karşılığı — `/api/assist/stream` bunu tüketir.

        Sırasıyla yield edilen event'ler:
          {"type": "meta", "profile": {...}, "matches": [...]}  — metin üretimi başlamadan hemen önce
          {"type": "token", "text": "..."}                       — her chunk için
          {"type": "done"}                                       — bitince (session_id varsa hafıza kaydı burada yapılır)
          {"type": "error", "message": "..."}                    — hata olursa
        """
        intent_result = await self._classify_intent(message, history)

        try:
            if intent_result.intent in (Intent.GREETING, Intent.OFF_TOPIC):
                profile, matches = UserProfile(), []
                reply_stream = self._stream_small_talk(message, history, intent_result.intent)
            elif intent_result.intent == Intent.PROGRAM_QUESTION:
                profile, matches = await self._prepare_program_question(
                    message, match_limit, eligibility_limit
                )
                reply_stream = self._stream_reply_llm(message, matches, None)
            elif intent_result.intent == Intent.APPLY_REQUEST:
                profile, matches = await self._prepare_apply_request(message, history)
                reply_stream = (
                    self._single_chunk_stream(_APPLY_NO_MATCH_REPLY)
                    if not matches
                    else self._stream_apply_reply(message, matches[0])
                )
            else:
                profile, matches = await self._prepare_full_chain(
                    message, history, match_limit, eligibility_limit
                )
                reply_stream = self._stream_reply_llm(message, matches, history)

            yield {
                "type": "meta",
                "profile": profile.model_dump(mode="json"),
                "matches": [m.model_dump(mode="json") for m in matches],
            }

            async for chunk in reply_stream:
                yield {"type": "token", "text": chunk}
        except Exception as e:  # noqa: BLE001 — akışı sonlandırmadan önce hatayı bildir
            logger.exception("stream_failed intent=%s", intent_result.intent.value)
            yield {"type": "error", "message": str(e)}
            return

        if session_id:
            await self._save_memory(session_id, AssistResult(profile=profile, matches=matches, reply=""))

        yield {"type": "done"}

    async def _single_chunk_stream(self, text: str) -> AsyncIterator[str]:
        yield text

    async def _stream_small_talk(
        self,
        message: str,
        history: list[ConversationTurn] | None,
        intent: Intent,
    ) -> AsyncIterator[str]:
        llm_history = self._build_llm_history(history)
        instruction = _SMALL_TALK_INSTRUCTIONS[intent]
        llm_history.append(
            LLMMessage(role="user", content=f"{instruction}\n\nKullanıcı mesajı: {message}")
        )
        try:
            async for chunk in self._profile_agent._chat_stream_with_history(
                llm_history, system=_REPLY_SYSTEM, max_tokens=256,
            ):
                yield chunk
        except Exception:  # noqa: BLE001 — reply üretilemezse deterministik fallback
            yield _SMALL_TALK_FALLBACK

    async def _stream_reply_llm(
        self,
        last_message: str,
        matches: list[ProgramMatch],
        history: list[ConversationTurn] | None,
    ) -> AsyncIterator[str]:
        """`_compose_reply_llm`'in streaming karşılığı."""
        if not matches:
            yield (
                "Profilini tam çıkaramadım. İşletmen hakkında biraz daha bilgi "
                "verir misin? (sektör, şehir, ekip büyüklüğü, hedefin)"
            )
            return

        program_lines = []
        for i, m in enumerate(matches, 1):
            p = m.program
            e = m.eligibility
            program_lines.append(
                f"{i}. {p.title} ({p.source or ''}) — "
                f"{e.label} (skor: {e.score}/100)"
            )
        programs_text = "\n".join(program_lines)

        llm_history = self._build_llm_history(history)
        user_prompt = (
            f"Kullanıcı mesajı: {last_message}\n\n"
            f"Bulunan uygun programlar:\n{programs_text}\n\n"
            "Kullanıcıya kısa ve samimi bir yanıt ver; programları özetle, "
            "detay ve uygunluk listesi için arayüzü işaret et."
        )
        llm_history.append(LLMMessage(role="user", content=user_prompt))

        try:
            async for chunk in self._profile_agent._chat_stream_with_history(
                llm_history, system=_REPLY_SYSTEM, max_tokens=512,
            ):
                yield chunk
        except Exception:  # noqa: BLE001 — reply üretilemezse deterministik fallback
            top = matches[0]
            yield (
                f"Profiline göre {len(matches)} uygun destek buldum. "
                f"En uygunu {top.program.title} ({top.eligibility.label}). "
                "Detaylar ve uygunluk koşulları listede."
            )

    async def _stream_apply_reply(self, message: str, match: ProgramMatch) -> AsyncIterator[str]:
        """`_compose_apply_reply`'nin streaming karşılığı."""
        user_prompt = (
            f"Kullanıcı mesajı: {message}\n\n"
            f"En uygun program: {match.program.title} ({match.program.source or ''}) — "
            f"{match.eligibility.label} (skor: {match.eligibility.score}/100)\n\n"
            "Kullanıcıya bu programa nasıl başvuracağını kısaca anlat."
        )
        try:
            async for chunk in self._profile_agent._chat_stream_with_history(
                [LLMMessage(role="user", content=user_prompt)],
                system=_APPLY_REPLY_SYSTEM,
                max_tokens=400,
            ):
                yield chunk
        except Exception:  # noqa: BLE001 — reply üretilemezse deterministik fallback
            yield (
                f"{match.program.title} programı için uygunluğun: {match.eligibility.label} "
                f"({match.eligibility.score}/100). Başvuru hazırlığı için detay ekranındaki "
                "'Başvuru hazırla' seçeneğini kullanabilirsin."
            )
