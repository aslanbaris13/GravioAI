"""Başvuru Ajanı — uygun bir program için başvuru paketi taslağı üretir.

Kullanıcının profilini ve seçilen programı alıp programa özel bir iş planı
taslağı (bölümler) ve gerekli belgeler kontrol listesi üretir. Çıktı frontend'in
"Başvuru Hazırlığı" ekranını besler.
"""
from ..models.application import ApplicationDraft
from ..models.profile import UserProfile
from ..models.program import SupportProgram
from .base import Agent
from .eligibility import _profile_brief, _program_brief


class ApplicationAgent(Agent):
    name = "application"
    system_prompt = (
        "Sen GravioAI'nin Başvuru Ajanısın. Bir girişimin profilini ve başvurmak "
        "istediği destek programını alıp, başvuruya hazır bir taslak üretirsin.\n\n"
        "İki şey üret:\n"
        "1) plan_sections: Programa ve profile özel bir iş planı taslağı. Tipik "
        "bölümler: Proje Adı, Özet, Problem ve Çözüm, Pazar ve Hedef Kitle, Ekip, "
        "Talep Edilen Destek. Gövdeler somut, profile dayalı ve Türkçe olsun; "
        "uydurma rakam verme, profilde olmayanı 'belirtilmeli' diye işaretle.\n"
        "2) documents: Bu programa özel gerekli belgeler. Gravio'nun üretebileceği "
        "belgeleri (iş planı, proje özeti, bütçe tablosu, sunum) auto=true; resmi/"
        "kişisel belgeleri (nüfus kaydı, diploma, imza sirküleri) auto=false yap.\n\n"
        "Tüm metinler Türkçe, kısa ve net olsun."
    )

    async def run(
        self, profile: UserProfile, program: SupportProgram
    ) -> ApplicationDraft:
        user_text = (
            "GİRİŞİM PROFİLİ:\n"
            f"{_profile_brief(profile)}\n\n"
            "BAŞVURULACAK PROGRAM:\n"
            f"{_program_brief(program)}"
        )
        return await self._extract(user_text, ApplicationDraft, max_tokens=4096)
