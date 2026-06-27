"""Orkestratör — ajanları zincirleyen beyin.

MVP'de sabit bir pipeline çalıştırır:
    1. Profil Çıkarma   (mesaj + geçmiş → UserProfile)
    2. Eşleştirme       (profil → aday programlar, RAG)
    3. Uygunluk         (her aday için profil+program → EligibilityResult)
    4. Reply üretme     (LLM ile bağlamsal sohbet yanıtı)

Sonuçları uygunluk skoruna göre sıralar ve tek bir AssistResult döner.

İleride niyet-yönlendirmeli (LLM hangi ajanı ne zaman çağıracağına karar verir)
hale getirilebilir; arayüz (run) sabit kalır.
"""
import asyncio

from ..core.llm import LLMMessage
from ..models.orchestration import AssistResult, ConversationTurn, ProgramMatch
from .eligibility import EligibilityAgent
from .matching import MatchingAgent
from .profile_extractor import ProfileExtractor


_REPLY_SYSTEM = (
    "Sen GravioAI asistanısın; Türkiye'deki girişim ve KOBİ'lere devlet/özel "
    "sektör destek programları konusunda yardım edersin. Kısa, samimi ve "
    "Türkçe yanıt ver. Kullanıcıya bulunan programlar hakkında kısa bir özet "
    "sun; programa başvurabilir ya da uygunluğunu kontrol edebilir. "
    "Teknik jargon kullanma."
)


class Orchestrator:
    name = "orchestrator"

    def __init__(self) -> None:
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
        llm_history: list[LLMMessage] = []
        if history:
            for turn in history:
                role = "user" if turn.role == "user" else "assistant"
                llm_history.append(LLMMessage(role=role, content=turn.content))

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
