"""Sunum Ajanı'nın ürettiği çıktı — sabit slayt iskeleti, özelleştirilmiş içerik."""
from pydantic import BaseModel, Field


class PresentationSlide(BaseModel):
    slide_id: str
    heading: str
    bullets: list[str] = Field(default_factory=list)


class GeneratedPresentation(BaseModel):
    title: str
    subtitle: str = ""
    slides: list[PresentationSlide] = Field(default_factory=list)


class PresentationSlideSpec(BaseModel):
    """Sabit sunum iskeletindeki bir slaydın tanımı — içerik promptu için."""

    id: str
    heading: str
    prompt: str = Field(..., description="Bu slaytta ne anlatılması gerektiğine dair yönerge")


PRESENTATION_SKELETON: list[PresentationSlideSpec] = [
    PresentationSlideSpec(id="kapak", heading="Kapak", prompt="Şirket adı, kısa slogan/değer önermesi."),
    PresentationSlideSpec(id="problem", heading="Problem", prompt="Hedef kitlenin yaşadığı somut problem."),
    PresentationSlideSpec(id="cozum", heading="Çözüm", prompt="Şirketin bu probleme sunduğu çözüm."),
    PresentationSlideSpec(
        id="neden_simdi",
        heading="Neden Şimdi?",
        prompt="Bu çözümün tam olarak şimdi neden mümkün/gerekli olduğu — teknolojik, düzenleyici veya "
        "pazar davranışındaki bir değişim (Sequoia'nın pitch deck çerçevesinde önerdiği ayırt edici slayt).",
    ),
    PresentationSlideSpec(id="urun", heading="Ürün", prompt="Ürün/hizmetin ne olduğu, temel özellikleri."),
    PresentationSlideSpec(id="pazar", heading="Pazar", prompt="Hedef pazar büyüklüğü ve müşteri kitlesi."),
    PresentationSlideSpec(
        id="traksiyon",
        heading="Traksiyon / Doğrulama",
        prompt="Ürünün/fikrin çalıştığına dair somut kanıt: erken kullanıcılar, büyüme metrikleri, "
        "müşteri geri bildirimi, basın/referanslar (yatırımcıların en çok aradığı slaytlardan biri).",
    ),
    PresentationSlideSpec(
        id="rekabet",
        heading="Rekabet",
        prompt="Bu problemi kimler nasıl çözüyor ve şirketin onlardan somut farkı/üstünlüğü ne.",
    ),
    PresentationSlideSpec(id="is_modeli", heading="İş Modeli", prompt="Gelir modeli, fiyatlandırma stratejisi."),
    PresentationSlideSpec(id="ekip", heading="Ekip", prompt="Kurucu/ekip yetkinlikleri (varsa isimler)."),
    PresentationSlideSpec(id="finansal", heading="Finansal Projeksiyon", prompt="Beklenen büyüme/gelir projeksiyonu, varsayımlarıyla."),
    PresentationSlideSpec(id="yol_haritasi", heading="Yol Haritası", prompt="Önümüzdeki 6-12 ayın kilometre taşları."),
    PresentationSlideSpec(id="kapanis", heading="Kapanış / Çağrı", prompt="Ne isteniyor (yatırım/ortaklık/pilot) ve iletişim bilgisi."),
]
