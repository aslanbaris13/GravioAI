"""Profil Çıkarma Ajanı — ajan iskeletinin örnek/referans uygulaması (SCRUM-12).

Kullanıcının serbest metnini yapılandırılmış `UserProfile`'a çevirir.
Yeni ajanlar bu deseni izler: `Agent`'tan türet, `name` + `system_prompt` ver,
`run()` içinde `self._extract(...)` çağır.
"""
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

    async def run(self, message: str) -> UserProfile:
        return await self._extract(message, UserProfile)
