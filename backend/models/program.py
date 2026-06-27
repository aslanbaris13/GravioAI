"""Destek programı domain modeli.

Alan adları veri bilimi ekibinin şemasıyla (Türkçe anahtarlar) `alias` üzerinden
birebir eşleşir; kod içinde İngilizce snake_case kullanılır. Veri dosyaları (JSON)
Türkçe anahtarları kullanır, bu model onları doğrular.
"""
from datetime import date
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .taxonomy import Category


class SupportType(str, Enum):
    HIBE = "Hibe"
    KREDI = "Kredi"
    YATIRIM = "Yatırım"
    VERGI_AVANTAJI = "Vergi Avantajı"
    BULUT_KREDISI = "Bulut Kredisi"
    HIZLANDIRICI = "Hızlandırıcı"
    YARISMA = "Yarışma"
    DIGER = "Diğer"


class ApplicationStatus(str, Enum):
    ACIK = "Açık"
    KAPALI = "Kapalı"
    SUREKLI = "Sürekli"


class Currency(str, Enum):
    TRY = "TRY"
    USD = "USD"
    EUR = "EUR"


_TRUE = {"evet", "var", "true", "1", "açık", "acik"}
_FALSE = {"hayır", "hayir", "yok", "false", "0", "-", ""}


class SupportProgram(BaseModel):
    """Tek bir destek/hibe/teşvik programı."""

    model_config = ConfigDict(populate_by_name=True, use_enum_values=True)

    id: str
    category: Category = Field(alias="kategori")
    subcategory: str | None = Field(default=None, alias="alt_kategori")
    program_name: str = Field(alias="program_adi")
    institution: str | None = Field(default=None, alias="kurum")
    support_type: SupportType | None = Field(default=None, alias="destek_türü")
    support_amount: str | None = Field(default=None, alias="destek_miktari")
    currency: Currency | None = Field(default=None, alias="para_birimi")
    support_rate: str | None = Field(default=None, alias="destek_orani")
    application_status: ApplicationStatus | None = Field(default=None, alias="başvuru_durumu")
    application_start: date | None = Field(default=None, alias="başvuru_baslangici")
    application_deadline: date | None = Field(default=None, alias="son_basvuru")
    application_link: str | None = Field(default=None, alias="başvuru_linki")
    official_source: str | None = Field(default=None, alias="resmi_kaynak")
    description: str | None = Field(default=None, alias="açıklama")
    target_audience: str | None = Field(default=None, alias="hedef_kitle")
    sector: str | None = Field(default=None, alias="sektör")
    company_required: bool | None = Field(default=None, alias="şirket_gerekli")
    min_employees: int | None = Field(default=None, alias="minimum_çalışan")
    max_employees: int | None = Field(default=None, alias="maksimum_çalışan")
    age_limit: str | None = Field(default=None, alias="yaş_sınırı")
    women_entrepreneur: bool | None = Field(default=None, alias="kadın_girişimci")
    student: bool | None = Field(default=None, alias="öğrenci")
    technopark: bool | None = Field(default=None, alias="teknopark")
    city: str | None = Field(default=None, alias="şehir")

    @field_validator(
        "company_required", "women_entrepreneur", "student", "technopark",
        mode="before",
    )
    @classmethod
    def _coerce_bool(cls, v):
        if isinstance(v, str):
            s = v.strip().lower()
            if s in _TRUE:
                return True
            if s in _FALSE:
                return False
        return v

    @field_validator("currency", mode="before")
    @classmethod
    def _normalize_currency(cls, v):
        if isinstance(v, str) and v.strip().upper() == "TL":
            return "TRY"
        return v
