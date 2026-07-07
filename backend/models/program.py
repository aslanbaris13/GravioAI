"""Destek programı domain modeli.

Alan adları veri bilimi ekibinin şemasıyla (Türkçe anahtarlar) `alias` üzerinden
birebir eşleşir; kod içinde İngilizce snake_case kullanılır. Veri dosyaları (JSON)
Türkçe anahtarları kullanır, bu model onları doğrular.
"""
from datetime import date
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from .taxonomy import Category

# 1) sabit seçenekler.

class SupportType(str, Enum):
    HIBE = "Hibe"  #supportType sadece buradakilerden biri olabilir.
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


_TRUE = {"evet", "var", "true", "1", "açık", "acik"} #True anlamına gelen alternatifler
_FALSE = {"hayır", "hayir", "yok", "false", "0", "-", ""}

# 2)LLM'İN ham metini okuyup dolduracağı şablon:
 
class ExtractedSupportInfo(BaseModel):
    

    model_config = ConfigDict(populate_by_name=True, use_enum_values=True)

    program_name: str = Field(..., alias="program_adi", description="Destek veya hibe programının resmi adı")
    category: Optional[str] = Field(default=None, alias="kategori", description="Programın genel kategorisi (ör: Ar-Ge, İstihdam, İhracat, Girişimcilik)")
    subcategory: Optional[str] = Field(default=None, alias="alt_kategori", description="Programın daha spesifik alt kategorisi")
    
    institution: Optional[str] = Field(default=None, alias="kurum", description="Desteği veren resmi kurum (ör: KOSGEB)")
    support_type: Optional[SupportType] = Field(default=None, alias="destek_türü", description="Desteğin tipi (Hibe, Kredi vb.)")
    
    amount_min: Optional[float] = Field(default=None, alias="tutar_min", description="Sayısal olarak minimum destek tutarı")
    amount_max: Optional[float] = Field(default=None, alias="tutar_max", description="Sayısal olarak maksimum destek tutarı (üst limit)")
    currency: Optional[Currency] = Field(default=Currency.TRY, alias="para_birimi", description="Destek tutarının para birimi (TRY, USD, EUR)")
    support_rate: Optional[str] = Field(default=None, alias="destek_orani", description="Desteğin karşılanma oranı (ör: %70, %100)")
    
    application_status: Optional[ApplicationStatus] = Field(default=None, alias="başvuru_durumu", description="Başvurular şu an Açık mı, Kapalı mı, Sürekli mi?")
    sector: Optional[str] = Field(default=None, alias="sektör", description="Başvurabilecek sektörler (NACE kodları veya isimleri)")
    target_audience: Optional[str] = Field(default=None, alias="hedef_kitle", description="Kimler başvurabilir? Kısaca özetle.")
    
    women_entrepreneur: Optional[bool] = Field(default=None, alias="kadın_girişimci", description="Kadın girişimcilere özel bir avantaj veya şart var mı?")
    technopark: Optional[bool] = Field(default=None, alias="teknopark", description="Teknopark'ta olma şartı var mı?")
    company_required: Optional[bool] = Field(default=None, alias="şirket_gerekli", description="Başvuru için önceden kurulmuş bir şirket şartı var mı?")
    student: Optional[bool] = Field(default=None, alias="öğrenci", description="Öğrenciler bu programa başvurabilir mi?")

# validators

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

    @field_validator("amount_min", "amount_max", mode="before")
    @classmethod
    def _parse_amount(cls, v):
        """Türkçe binlik ayraçlı metinleri (örn. "300.000") sayıya çevirir."""
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return None
            s = s.replace(".", "").replace(",", ".")
            return float(s)
        return v


# 3) Veri tabanının şablonu: Yapay zeka artık SupportProgramDB sınıfını hiç görmeyecek.

## Ona sadece ExtractedSupportInfo sınıfını vereceğiz.
# #  Böylece "Ben embedding diye bir alan görüyorum,
# # buraya ne uydursam acaba?" diye kafası karışmayacak.

class SupportProgramDB(ExtractedSupportInfo):
    """
    ExtractedSupportInfo'daki tüm verileri (bütçe, ad vb.) miras alır,
    üstüne sadece yazılım sistemimizin ihtiyaç duyduğu teknik verileri ekler.
    """
    program_id: str = Field(..., description="Sistem tarafından üretilen benzersiz kimlik (UUID)")
    source_url: str = Field(..., description="Verinin çekildiği orijinal web sayfasının linki")
    body_chunk: str = Field(..., description="LLM'in analiz etmesi için gönderilen ham HTML/Metin parçası")
    embedding: Optional[List[float]] = Field(default=None, description="Yapay zeka vektör araması (RAG) için 768 boyutlu koordinat dizisi")