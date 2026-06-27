"""Orkestratör — ajanları zincirleyen beyin.

MVP'de sabit bir pipeline çalıştırır:
    1. Profil Çıkarma   (mesaj -> UserProfile)
    2. Eşleştirme       (profil -> aday programlar, RAG)
    3. Uygunluk         (her aday için profil+program -> EligibilityResult)
Sonuçları uygunluk skoruna göre sıralar ve tek bir AssistResult döner.

İleride niyet-yönlendirmeli (LLM hangi ajanı ne zaman çağıracağına karar verir)
hale getirilebilir; arayüz (run) sabit kalır.
"""
import asyncio

from ..models.orchestration import AssistResult, ProgramMatch
from .eligibility import EligibilityAgent
from .matching import MatchingAgent
from .profile_extractor import ProfileExtractor


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
        match_limit: int = 5,
        eligibility_limit: int = 3,
    ) -> AssistResult:
        # 1) Profil çıkar
        profile = await self._profile_agent.run(message)

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

        return AssistResult(
            profile=profile,
            matches=matches,
            reply=self._compose_reply(matches),
        )

    @staticmethod
    def _compose_reply(matches: list[ProgramMatch]) -> str:
        """Sohbet için kısa, deterministik bir özet üretir."""
        if not matches:
            return (
                "Profilini tam çıkaramadım. İşletmen hakkında biraz daha bilgi "
                "verir misin? (sektör, şehir, ekip büyüklüğü, hedefin)"
            )
        top = matches[0]
        n = len(matches)
        return (
            f"Profiline göre {n} uygun destek buldum. En uygunu "
            f"{top.program.program_name} ({top.eligibility.label}). "
            "Detaylar ve uygunluk koşulları listede."
        )
