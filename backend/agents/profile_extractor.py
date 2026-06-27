"""Profil Çıkarma Ajanı — ajan iskeletinin örnek/referans uygulaması (SCRUM-12).

Kullanıcının serbest metnini yapılandırılmış `UserProfile`'a çevirir.
Konuşma geçmişi varsa tüm turları birleştirip profili bütünleşik çıkarır;
bu sayede kullanıcı bilgilerini birden fazla turda paylaşabilir.

Yeni ajanlar bu deseni izler: `Agent`'tan türet, `name` + `system_prompt` ver,
`run()` içinde `self._extract(...)` çağır.
"""
from ..core.llm import LLMMessage
from ..models.orchestration import ConversationTurn
from ..models.profile import UserProfile
from .base import Agent


class ProfileExtractor(Agent):
    name = "profile_extractor"
    system_prompt = (
        "Sen GravioAI'nin Profil Çıkarma Ajanısın. Kullanıcının Türkçe mesajından "
        "girişimine dair bilgileri çıkarıp yapılandırırsın. Yalnızca mesajda açıkça "
        "geçen veya güçlü şekilde ima edilen bilgileri doldur; emin olmadığın alanları "
        "null bırak, uydurma. team_size sayıdır; company_exists, women_entrepreneur, "
        "student, in_technopark alanları true/false/null'dır."
    )

    async def run(
        self,
        message: str,
        *,
        history: list[ConversationTurn] | None = None,
    ) -> UserProfile:
        """Kullanıcı mesajından profil çıkarır.

        `history` verilirse önceki konuşma turları da bağlam olarak kullanılır;
        bu sayede kullanıcı bilgilerini birden fazla turda paylaşabilir.
        """
        if not history:
            # Geçmiş yoksa doğrudan tek mesajı gönder
            return await self._extract(message, UserProfile)

        # Geçmiş varsa tüm konuşmayı tek bir bağlam metni olarak birleştir
        context_lines = []
        for turn in history:
            prefix = "Kullanıcı" if turn.role == "user" else "Asistan"
            context_lines.append(f"{prefix}: {turn.content}")
        context_lines.append(f"Kullanıcı (son mesaj): {message}")

        combined = (
            "Aşağıdaki konuşma geçmişinden kullanıcının girişim profilini çıkar. "
            "Tüm turları dikkate al; bilgiler farklı turlara dağılmış olabilir.\n\n"
            + "\n".join(context_lines)
        )
        return await self._extract(combined, UserProfile)
