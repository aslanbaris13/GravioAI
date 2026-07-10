"""Destek programı domain modeli.

Alan adları veri bilimi ekibinin şemasıyla (Türkçe anahtarlar) `alias` üzerinden
birebir eşleşir; kod içinde İngilizce snake_case kullanılır. Veri dosyaları (JSON)
Türkçe anahtarları kullanır, bu model onları doğrular.
"""
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field, field_validator

from .taxonomy import Category


# 1) Sabit seçenekler (LLM'in seçebileceği kapalı küme değerler)

class SupportType(str, Enum):
    HIBE = "Hibe"  # destek_türü sadece buradakilerden biri olabilir
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


# Boolean alanları metinden True/False'a çevirirken kullanılan alternatifler
_TRUE = {"evet", "var", "true", "1", "açık", "acik"}
_FALSE = {"hayır", "hayir", "yok", "false", "0", "-", ""}


# 2) LLM'in ham metni okuyup dolduracağı şablon

class ExtractedSupportInfo(BaseModel):

    model_config = ConfigDict(populate_by_name=True, use_enum_values=True,validate_assignment=True,)

    # Temel bilgiler
    title: str = Field(
        ..., alias="program_adi",
        description="Destek veya hibe programının resmi adı (sitede 'program adı', 'destek adı', 'program başlığı' gibi farklı ifadelerle geçebilir)"
    )
    category: Optional[Category] = Field(
        default=None, alias="kategori",
        description="Programın ait olduğu genel kategori"
    )
    source: Optional[str] = Field(
        default=None, alias="kurum",
        description="Desteği veren resmi kurum (ör: KOSGEB, TÜBİTAK)"
    )
    support_type: Optional[SupportType] = Field(
        default=None, alias="destek_türü",
        description="Desteğin tipi (Hibe, Kredi vb.)"
    )

    # Tutar bilgileri
    amount_min: Optional[float] = Field(
        default=None, alias="tutar_min",
        description="Sayısal olarak minimum destek tutarı"
    )
    amount_max: Optional[float] = Field(
        default=None, alias="tutar_max",
        description="Sayısal olarak maksimum destek tutarı (üst limit)"
    )
    currency: Optional[Currency] = Field(
        default=Currency.TRY, alias="para_birimi",
        description="Destek tutarının para birimi (TRY, USD, EUR) — metinde hangi birimle yazılmışsa o"
    )
    support_rate: Optional[str] = Field(
        default=None, alias="destek_orani",
        description="Desteğin karşılanma oranı (ör: %70, %100)"
    )

    # Başvuru durumu
    application_status: Optional[ApplicationStatus] = Field(
        default=None, alias="başvuru_durumu",
        description="Başvurular şu an Açık mı, Kapalı mı, Sürekli mi?"
    )

    # Şartlar (RAG'de filtreleme için önemli alanlar)
    region: Optional[str] = Field(
        default=None, alias="bölge",
        description="Programın geçerli olduğu coğrafi bölge/il şartı (ör: 'Tüm Türkiye', 'Sadece Doğu Anadolu'). Metinde bölge şartı yoksa boş bırak."
    )
    founded_after: Optional[str] = Field(
        default=None, alias="kurulus_tarihi_sarti",
        description="Şirketin kuruluş tarihiyle ilgili bir şart varsa (ör: 'Son 5 yılda kurulmuş olmalı')"
    )
    deadline: Optional[str] = Field(
        default=None, alias="son_basvuru_tarihi",
        description="Programın son başvuru tarihi (varsa, YYYY-MM-DD formatında)"
    )
    official_url: Optional[str] = Field(
        default=None, alias="resmi_link",
        description="Programla ilgili resmi/detay sayfasının linki, metinde geçiyorsa"
    )
    conditions_summary: Optional[str] = Field(
        default=None, alias="sartlar_ozeti",
        description="Başvuru şartlarının 2-3 cümlelik kısa özeti"
    )

    # Evet/Hayır tipi şartlar
    women_entrepreneur: Optional[bool] = Field(
        default=None, alias="kadın_girişimci",
        description="Kadın girişimcilere özel bir avantaj veya şart var mı?"
    )
    technopark: Optional[bool] = Field(
        default=None, alias="teknopark",
        description="Teknopark'ta olma şartı var mı?"
    )
    company_required: Optional[bool] = Field(
        default=None, alias="şirket_gerekli",
        description="Başvuru için önceden kurulmuş bir şirket şartı var mı?"
    )
    student: Optional[bool] = Field(
        default=None, alias="öğrenci",
        description="Öğrenciler bu programa başvurabilir mi?"
    )

    # --- Validatorlar ---

    @field_validator(
        "company_required", "women_entrepreneur", "student", "technopark",
        mode="before",
    )
    @classmethod
    def _coerce_bool(cls, v):
        """Metin olarak gelen evet/hayır ifadelerini gerçek boolean'a çevirir."""
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
        """'TL' yazımını standart 'TRY' koduna çevirir."""
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


# 3) Veritabanının şablonu: Yapay zeka artık SupportProgramDB sınıfını hiç görmeyecek.
# Ona sadece ExtractedSupportInfo sınıfını vereceğiz, böylece kafası karışmayacak.

class SupportProgramDB(ExtractedSupportInfo):
    """
    ExtractedSupportInfo'daki tüm verileri (bütçe, ad vb.) miras alır,
    üstüne sadece yazılım sistemimizin ihtiyaç duyduğu teknik verileri ekler.
    """
    program_id: str = Field(..., description="Sistem tarafından üretilen benzersiz kimlik (slug + chunk numarası)")
    source_url: str = Field(..., description="Verinin çekildiği orijinal web sayfasının linki")
    body_chunk: str = Field(..., description="LLM'in analiz etmesi için gönderilen ham HTML/Metin parçası")
    chunk_index: int = Field(default=0, description="Bu parçanın orijinal metindeki sırası (chunklanmadıysa 0)")
    embedding: Optional[List[float]] = Field(default=None, description="Yapay zeka vektör araması (RAG) için embedding vektörü")