"""Hafıza Ajanı — oturumun profil + eşleşmelerini kalıcılaştırır (SCRUM-97).

Diğer ajanlardan farkı `MatchingAgent` ile aynıdır: LLM kullanmaz, saf bir
depolama işidir; bu yüzden `Agent` temelinden türemez ama aynı `run(...)`
tarzı arayüzü sunmaz — burada `load`/`save` daha açıklayıcı.

`repo.get_session`/`repo.save_session` senkron (Supabase REST) çağrılardır;
`asyncio.to_thread` ile sarmalanır — `fastapi.concurrency.run_in_threadpool`
değil, çünkü ajan katmanı API framework'üne bağımlı olmamalı.
"""
import asyncio

from data import repo
from models.orchestration import ProgramMatch
from models.profile import UserProfile
from models.session import SessionState


class MemoryAgent:
    name = "memory"

    async def load(self, session_id: str) -> SessionState | None:
        """Bir oturumun kayıtlı profil + eşleşmelerini getirir; hiç yoksa None döner."""
        return await asyncio.to_thread(repo.get_session, session_id)

    async def save(
        self,
        session_id: str,
        profile: UserProfile,
        matches: list[ProgramMatch],
    ) -> None:
        """Bir oturumun profil + eşleşmelerini kaydeder (üzerine yazar)."""
        state = SessionState(profile=profile, matches=matches)
        await asyncio.to_thread(repo.save_session, session_id, state)
