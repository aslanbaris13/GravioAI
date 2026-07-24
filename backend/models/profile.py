"""Kullanıcı (girişim) profili — ajanlar arası ortak veri yapısı.

Profil Çıkarma Ajanı bunu serbest metinden üretir; Eşleştirme Ajanı bundan
arama sorgusu kurar; Uygunluk Ajanı bunu program koşullarıyla karşılaştırır.
Alan açıklamaları (description) LLM'e şema üzerinden ipucu olarak da geçer.
"""
from pydantic import BaseModel, Field, model_validator


class UserProfile(BaseModel):
    """Kullanıcının destek aramasıyla ilgili yapılandırılmış profili."""

    company_name: str | None = Field(default=None, description="Şirket/girişim adı, örn. 'Nova AI Yazılım'")
    website: str | None = Field(default=None, description="Şirket web sitesi, örn. 'https://nova-ai.com'")
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

    @model_validator(mode="after")
    def _normalize_inconsistent_fields(self) -> "UserProfile":
        """LLM çıktısındaki tutarsız/anlamsız alan kombinasyonlarını sessizce
        temizler — hata fırlatmaz, çünkü bu alanlar zaten opsiyonel ve `null`
        bırakılması "emin değilse uydurma" felsefesiyle tutarlı bir sonuç.
        """
        if self.team_size is not None and self.team_size < 0:
            self.team_size = None
        if self.company_age_years is not None and self.company_age_years < 0:
            self.company_age_years = None
        if self.company_exists is False:
            # Kurulu şirket yoksa "şirket yaşı" anlamsız.
            self.company_age_years = None
        return self

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


def merge_profile(prev: "UserProfile", next_: "UserProfile") -> "UserProfile":
    """`prev` (daha önce bilinen/kayıtlı) ile `next_` (bu turda çıkarılan) profili
    alan bazında birleştirir. `next_`'te dolu olan alan kazanır; boşsa `prev`
    korunur. Bazı intent'ler (PROGRAM_QUESTION, APPLY_REQUEST) neredeyse boş bir
    `UserProfile(summary=message)` üretir — bu olmasaydı hafızaya kaydedilirken
    önceki turlarda çıkarılan gerçek profili silerdi.
    """
    data = prev.model_dump()
    next_data = next_.model_dump()
    for field in (
        "company_name",
        "website",
        "sector",
        "city",
        "team_size",
        "company_exists",
        "company_age_years",
        "women_entrepreneur",
        "student",
        "in_technopark",
        "summary",
    ):
        if next_data[field] is not None:
            data[field] = next_data[field]
    if next_data["goals"]:
        data["goals"] = next_data["goals"]
    return UserProfile.model_validate(data)
