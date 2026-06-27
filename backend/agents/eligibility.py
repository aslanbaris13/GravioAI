"""Uygunluk Ajanı (SCRUM-14/15).

Bir kullanıcı profilini tek bir destek programının koşullarıyla karşılaştırır;
skor + koşul-koşul değerlendirme (karşılandı/aksiyon/eksik) üretir. Çıktı,
frontend'in uygunluk ekranını besleyecek `EligibilityResult` modelidir.
"""
from ..models.eligibility import EligibilityResult
from ..models.profile import UserProfile
from ..models.program import SupportProgram
from .base import Agent


def _profile_brief(p: UserProfile) -> str:
    """Profili LLM için okunaklı bir bloğa dönüştürür."""
    fields = {
        "Sektör": p.sector,
        "Şehir": p.city,
        "Ekip büyüklüğü": p.team_size,
        "Şirket var mı": p.company_exists,
        "Şirket yaşı (yıl)": p.company_age_years,
        "Kadın girişimci": p.women_entrepreneur,
        "Öğrenci": p.student,
        "Teknopark'ta": p.in_technopark,
        "Hedefler": ", ".join(p.goals) if p.goals else None,
        "Özet": p.summary,
    }
    return "\n".join(f"- {k}: {v}" for k, v in fields.items() if v is not None)


def _program_brief(prog: SupportProgram) -> str:
    """Programın uygunlukla ilgili alanlarını LLM için okunaklı bloğa dönüştürür."""
    fields = {
        "Program": prog.program_name,
        "Kurum": prog.institution,
        "Kategori": prog.category,
        "Destek türü": prog.support_type,
        "Açıklama": prog.description,
        "Hedef kitle": prog.target_audience,
        "Sektör": prog.sector,
        "Şirket gerekli": prog.company_required,
        "Min. çalışan": prog.min_employees,
        "Maks. çalışan": prog.max_employees,
        "Yaş sınırı": prog.age_limit,
        "Kadın girişimci odaklı": prog.women_entrepreneur,
        "Öğrenci odaklı": prog.student,
        "Teknopark şartı": prog.technopark,
        "Şehir": prog.city,
    }
    return "\n".join(f"- {k}: {v}" for k, v in fields.items() if v is not None)


class EligibilityAgent(Agent):
    name = "eligibility"
    system_prompt = (
        "Sen GravioAI'nin Uygunluk Ajanısın. Bir girişim profilini, verilen destek "
        "programının koşullarıyla karşılaştırıp gerçekçi bir uygunluk değerlendirmesi "
        "yaparsın.\n\n"
        "Her koşulu tek tek değerlendir ve state ata:\n"
        "- met: koşul profile göre karşılanıyor.\n"
        "- action: küçük/hızlı bir aksiyonla karşılanır (örn. belge hazırlamak, "
        "eğitim sertifikası almak). hint alanına ne yapılacağını kısaca yaz.\n"
        "- unmet: şu an karşılanmıyor ve gerçek bir engel. hint alanına yol göster.\n\n"
        "Genel state:\n"
        "- full: tüm koşullar met (en fazla önemsiz action).\n"
        "- partial: bir/iki action veya ulaşılabilir unmet var.\n"
        "- locked: sert bir koşul (örn. zorunlu lokasyon/şirket) karşılanmıyor.\n\n"
        "score 0-100; full ~85-100, partial ~55-85, locked ~30-55 aralığında olsun. "
        "label kısa olsun ('Tam uygun', '1 koşul eksik' gibi). Profilde bilgi yoksa "
        "varsayım yapma, koşulu temkinli (action/unmet) değerlendir ve hint ver. "
        "Tüm metinler Türkçe."
    )

    async def run(self, profile: UserProfile, program: SupportProgram) -> EligibilityResult:
        user_text = (
            "GİRİŞİM PROFİLİ:\n"
            f"{_profile_brief(profile)}\n\n"
            "DESTEK PROGRAMI:\n"
            f"{_program_brief(program)}"
        )
        return await self._extract(user_text, EligibilityResult, max_tokens=3072)
