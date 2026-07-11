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

#Category eşleştirmesi için: LLM'in yazması muhtemel farklı ifadeler:
#kategori için field validator eklenecek aşağıya

_CATEGORY_KEYWORDS: dict[Category, list[str]] = {
    Category.KAMU: [
        "kamu", "devlet", "resmi kurum", "bakanlık",
        "kosgeb", "tübitak", "tubitak", "kalkınma ajansı", "kalkinma ajansi",
        "kgf", "kredi garanti fonu", "iskur", "i̇şkur",
        "ticaret bakanlığı", "sanayi ve teknoloji bakanlığı",
        "türkpatent", "turkpatent", "avrupa birliği fonu", "ab fonu",
        "kalkınma ve yatırım bankası", "hazine",
    ],
    Category.VERGI_LOKASYON: [
        "vergi", "vergi avantajı", "vergi teşviki", "muafiyet", "istisna",
        "teknopark", "teknoloji geliştirme bölgesi",
        "ar-ge merkezi", "arge merkezi", "tasarım merkezi",
        "genç girişimci istisnası", "sgk prim desteği", "sgk teşviki",
        "serbest bölge", "yatırım teşvik belgesi", "bölgesel teşvik",
    ],
    Category.OZEL_SEKTOR: [
        "özel sektör", "bulut kredisi", "cloud kredisi", "yazılım kredisi",
        "aws", "amazon web services", "google cloud", "microsoft azure",
        "nvidia", "openai", "anthropic", "stripe", "github",
        "hubspot", "twilio", "mongodb", "pinecone", "supabase",
        "startup kredisi", "girişim kredisi",
    ],
    Category.HIZLANDIRICI: [
        "hızlandırıcı", "hizlandirici", "kuluçka", "kulucka", "kuluçka merkezi",
        "accelerator", "incubation", "incubator",
        "itü çekirdek", "cube incubation", "kworks", "workup", "pilot",
        "btm", "bilişim vadisi", "plug and play", "endeavor türkiye",
        "startershub", "growth circuit", "inovent", "mentörlük programı",
    ],
    Category.YATIRIM: [
        "yatırım", "yatirim", "melek yatırım", "melek yatırımcı", "angel investor",
        "vc", "venture capital", "girişim sermayesi", "kitlesel fonlama",
        "crowdfunding", "fon yatırımı", "özkaynak yatırımı", "seed yatırım",
    ],
    Category.YARISMA: [
        "yarışma", "yarisma", "etkinlik", "hackathon", "teknofest",
        "big bang", "startup istanbul", "webrazzi", "hello tomorrow",
        "aimpact", "yza", "girişimcilik vakfı", "ödül programı", "yarışma programı",
        "inovasyon yarışması",
    ],
    Category.GLOBAL: [
        "global", "uluslararası", "uluslararasi", "yurt dışı", "yurt disi",
        "y combinator", "techstars", "antler", "entrepreneur first", "ewor",
        "google global accelerator", "microsoft global founders hub",
        "horizon europe", "eureka", "eurostars", "cost aksiyon",
        "ikili işbirliği", "çok taraflı işbirliği", "uluslararası ortaklık",
    ],
}




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
    
    @field_validator("category", mode="before")
    @classmethod
    def _normalize_category(cls, v):
        """LLM'in yazdığı serbest metni, en yakın Category değerine eşler.
        Hiçbir eşleşme bulunamazsa None döner (ValidationError yerine)."""
        if v is None:
            return None

        # Zaten geçerli bir Category değeriyse (veya enum nesnesiyse), dokunma
        if isinstance(v, Category):
            return v
        if isinstance(v, str):
            v_lower = v.strip().lower()

            # Önce birebir eşleşme dene (LLM zaten doğru yazmış olabilir)
            for kategori in Category:
                if v_lower == kategori.value.lower():
                    return kategori

            # Birebir yoksa, anahtar kelimelere göre en yakın kategoriyi bul
            for kategori, kelimeler in _CATEGORY_KEYWORDS.items():
                if any(kelime in v_lower for kelime in kelimeler):
                    return kategori

            # Hiçbir eşleşme yok, veri kaybetmemek için None döndür
            return None

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