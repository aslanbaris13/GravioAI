"""Rapor Yazma Ajanı — bir destek programının resmi başvuru raporunu,
gereksinim şemasındaki (ReportSchema) bölümlere göre, bölüm bölüm üretir.

Tek dev bir prompt yerine bölümlü üretim tercih edildi: her bölümün kendi
sistem promptu + o bölüme özel gereksinimler + kullanıcının o bölüm için
girdiği alan değerleri var. Bu hem kaliteyi (odaklı, kısa promptlar daha
tutarlı çıktı üretir) hem düzenlenebilirliği (kullanıcı tek bir bölümü
"yeniden yaz" diyebilir, tüm raporu değil) artırır.
"""
from ..models.profile import UserProfile
from ..models.report import GeneratedReport, GeneratedReportSection
from ..models.report_schema import ReportSchema, ReportSection
from .base import Agent
from .eligibility import _profile_brief

_SYSTEM = (
    "Sen GravioAI'nin Rapor Yazma Ajanısın. Görevin, bir girişimin devlet destek/hibe "
    "başvurusu için resmi rapor bölümlerini yazmak.\n\n"
    "Kurallar:\n"
    "- Yalnızca sana verilen profil ve kullanıcı girdilerine dayan; uydurma rakam, "
    "tarih veya iddia üretme. Bir bilgi eksikse '[Bu kısım netleştirilmeli: ...]' "
    "şeklinde açıkça işaretle.\n"
    "- Resmi, profesyonel ama akıcı bir Türkçe kullan — bürokratik jargon yığmadan.\n"
    "- Sana verilen karakter limitini (varsa) aşma.\n"
    "- Yalnızca bu bölümün gövde metnini üret; başlığı, diğer bölümleri veya "
    "meta yorum ekleme."
)


def _format_field_values(section: ReportSection, field_values: dict[str, str]) -> str:
    lines = []
    for field in section.required_fields:
        value = field_values.get(field.key, "").strip()
        lines.append(f"- {field.label}: {value or '(kullanıcı bu alanı boş bıraktı)'}")
    return "\n".join(lines)


class ReportWriterAgent(Agent):
    name = "report_writer"
    system_prompt = _SYSTEM

    async def write_section(
        self,
        schema: ReportSchema,
        section: ReportSection,
        profile: UserProfile,
        field_values: dict[str, str],
    ) -> GeneratedReportSection:
        limit_note = (
            f"\nKarakter limiti: en fazla {section.char_limit} karakter." if section.char_limit else ""
        )
        user_text = (
            f"PROGRAM: {schema.program_name} ({schema.institution})\n\n"
            f"GİRİŞİM PROFİLİ:\n{_profile_brief(profile)}\n\n"
            f"BÖLÜM: {section.title}\n"
            f"Bölüm açıklaması: {section.description}{limit_note}\n\n"
            f"KULLANICININ BU BÖLÜM İÇİN VERDİĞİ BİLGİLER:\n{_format_field_values(section, field_values)}\n\n"
            "Bu bölümün gövde metnini yaz."
        )
        max_tokens = max(1024, (section.char_limit or 2000) // 2)
        body = await self._complete(user_text, max_tokens=max_tokens)
        return GeneratedReportSection(section_id=section.id, heading=section.title, body=body.strip())

    async def write_report(
        self,
        schema: ReportSchema,
        profile: UserProfile,
        field_values: dict[str, dict[str, str]],
    ) -> GeneratedReport:
        """`field_values`: section_id -> {field_key: value}."""
        sections: list[GeneratedReportSection] = []
        for section in schema.sections:
            section_values = field_values.get(section.id, {})
            sections.append(await self.write_section(schema, section, profile, section_values))
        return GeneratedReport(
            schema_key=schema.key,
            program_name=schema.program_name,
            title=f"{schema.program_name} — Başvuru Raporu",
            sections=sections,
        )
