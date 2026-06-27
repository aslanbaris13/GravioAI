"""Eşleştirme Ajanı — kullanıcı profilini destek programlarıyla eşler (RAG).

Diğer ajanlardan farkı: LLM kullanmaz. Saf getirme (retrieval) işidir —
profilden bir arama metni kurar, embed'ler ve pgvector'da en yakın programları
bulur. Bu yüzden LLM-merkezli `Agent` temelinden türemez; ama aynı `run(...)`
arayüzünü sunar ki orkestratör tüm ajanları tek tip çağırabilsin.
"""
from ..core.embeddings import embed_text
from ..data import repo
from ..models import Category, SupportProgram, UserProfile


class MatchingAgent:
    name = "matching"

    async def run(
        self,
        profile: UserProfile,
        *,
        limit: int = 5,
        category: Category | None = None,
    ) -> list[SupportProgram]:
        """Profile en uygun programları döner (kosinüs benzerliği)."""
        query = profile.to_query_text()
        if not query:
            return []
        embedding = embed_text(query)
        return repo.match_programs(embedding, match_count=limit, category=category)
