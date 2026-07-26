"""Sunum Ajanı — sabit slayt iskeleti (PRESENTATION_SKELETON) üzerinden,
şirket/profil verisiyle özelleştirilmiş bir yatırımcı/müşteri sunumu üretir.

Rapor Yazma Ajanı'yla aynı desen: her slayt ayrı bir LLM çağrısı, kısa ve
odaklı bir promptla — tek dev bir "tüm sunumu yaz" çağrısı yerine.
"""
import json

from models.presentation import PRESENTATION_SKELETON, GeneratedPresentation, PresentationSlide
from models.profile import UserProfile
from .base import Agent
from .eligibility import _profile_brief

_SYSTEM = (
    "Sen GravioAI'nin Sunum Ajanısın. Görevin, bir girişimin yatırımcı/müşteri sunumu "
    "için TEK BİR slaydın başlığını ve madde işaretli (bullet point) içeriğini üretmek.\n\n"
    "Kurallar:\n"
    "- 3-5 kısa madde üret; her madde tek cümle veya kısa bir ifade olsun (slayt "
    "maddesi, paragraf değil).\n"
    "- Yalnızca sana verilen profile dayan; uydurma rakam/iddia üretme. Kritik bir "
    "bilgi eksikse maddeyi '[Netleştirilmeli: ...]' şeklinde işaretle.\n"
    "- Profesyonel ama çekici bir Türkçe kullan.\n"
    "- Yanıtını YALNIZCA JSON olarak ver: {\"bullets\": [\"...\", \"...\"]}"
)


class PresentationWriterAgent(Agent):
    name = "presentation_writer"
    system_prompt = _SYSTEM

    async def write_slide(
        self, spec_id: str, heading: str, prompt: str, profile: UserProfile, extra_context: str
    ) -> PresentationSlide:
        user_text = (
            f"GİRİŞİM PROFİLİ:\n{_profile_brief(profile)}\n\n"
            f"EK BAĞLAM (kullanıcının verdiği): {extra_context or '(verilmedi)'}\n\n"
            f"SLAYT: {heading}\n"
            f"Bu slaytta anlatılması gereken: {prompt}\n\n"
            "Bu slayt için 3-5 madde üret."
        )
        raw = await self._chat(user_text, system=self.system_prompt, max_tokens=512)
        bullets = self._parse_bullets(raw)
        return PresentationSlide(slide_id=spec_id, heading=heading, bullets=bullets)

    def _parse_bullets(self, raw: str) -> list[str]:
        text = raw.strip()
        if text.startswith("```"):
            text = text.strip("`").removeprefix("json").strip()
        try:
            data = json.loads(text)
            bullets = data.get("bullets", [])
            if isinstance(bullets, list) and bullets:
                return [str(b).strip() for b in bullets if str(b).strip()]
        except (json.JSONDecodeError, AttributeError):
            pass
        # LLM JSON dışında bir şey döndürdüyse, satır satır ayır (zarif düşüş)
        lines = [line.strip("-• ").strip() for line in text.splitlines() if line.strip()]
        return lines[:5] if lines else ["[İçerik üretilemedi]"]

    async def write_presentation(
        self, profile: UserProfile, company_name: str, extra_context: str
    ) -> GeneratedPresentation:
        slides: list[PresentationSlide] = []
        for spec in PRESENTATION_SKELETON:
            slides.append(
                await self.write_slide(spec.id, spec.heading, spec.prompt, profile, extra_context)
            )
        return GeneratedPresentation(
            title=company_name or "Şirket Sunumu",
            subtitle=profile.sector or "",
            slides=slides,
        )
