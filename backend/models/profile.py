"""Kullanıcı (girişim) profili — ajanlar arası ortak veri yapısı.

Profil Çıkarma Ajanı bunu serbest metinden üretir; Eşleştirme Ajanı bundan
arama sorgusu kurar; Uygunluk Ajanı bunu program koşullarıyla karşılaştırır.
Alan açıklamaları (description) LLM'e şema üzerinden ipucu olarak da geçer.
"""
from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    """Kullanıcının destek aramasıyla ilgili yapılandırılmış profili."""

    sector: str | None = Field(default=None, description="Faaliyet sektörü, örn. 'AI / Yazılım'")
    city: str | None = Field(default=None, description="İl / şehir, örn. 'Düzce'")
    team_size: int | None = Field(default=None, description="Çalışan / ekip sayısı")
    company_exists: bool | None = Field(
        default=None, description="Kurulu bir şirket var mı (yoksa fikir/kurulacak aşamada mı)"
    )
    company_age_years: float | None = Field(
        default=None, description="Şirket yaşı (yıl); kurulu değilse null"
    )
    women_entrepreneur: bool | None = Field(default=None, description="Kadın girişimci mi")
    student: bool | None = Field(default=None, description="Öğrenci mi")
    in_technopark: bool | None = Field(default=None, description="Teknopark/TGB'de mi")
    goals: list[str] = Field(
        default_factory=list,
        description="Hedefler/ihtiyaçlar, örn. ['Ar-Ge hibesi', 'bulut altyapısı', 'istihdam']",
    )
    summary: str | None = Field(
        default=None, description="Profilin kısa serbest-metin özeti (arama/eşleştirme için)"
    )

    def to_query_text(self) -> str:
        """Eşleştirme (RAG) için embed'lenecek metni üretir."""
        parts: list[str] = []
        if self.summary:
            parts.append(self.summary)
        if self.sector:
            parts.append(f"Sektör: {self.sector}")
        if self.city:
            parts.append(f"Şehir: {self.city}")
        if self.goals:
            parts.append("Hedefler: " + ", ".join(self.goals))
        return " — ".join(parts) if parts else ""
