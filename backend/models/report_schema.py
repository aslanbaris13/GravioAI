"""Rapor gereksinim şemaları — başvuru raporu üretmeden önce kullanıcının
"neyle karşılaşacağını" görebilmesi ve Rapor Yazma Ajanı'nın hangi
bölümleri, hangi zorunlu alanlarla üreteceğini bilmesi için.

Program başına bir şema; şemalar backend/data/report_schemas/*.json
dosyalarında statik veri olarak tutulur (Supabase migration'ı gerektirmez —
nadiren değişen referans veri, bir program eklemek kod değişikliği değil
yeni bir JSON dosyası eklemek demektir).
"""
from pydantic import BaseModel, Field


class RequiredField(BaseModel):
    key: str = Field(..., description="Alanın benzersiz anahtarı")
    label: str = Field(..., description="Kullanıcıya gösterilecek Türkçe etiket")
    description: str = Field("", description="Bu alanda ne istendiğine dair kısa açıklama")
    long_text: bool = Field(False, description="Uzun metin mi (dosya yükleme de desteklenir) yoksa kısa alan mı")
    prefillable_from_profile: str | None = Field(
        None, description="UserProfile'da bu alanı otomatik doldurabilecek alan adı (varsa)"
    )


class ReportSection(BaseModel):
    id: str
    title: str
    description: str = ""
    required_fields: list[RequiredField] = Field(default_factory=list)
    char_limit: int | None = Field(None, description="Resmi başvuru formundaki karakter/kelime sınırı (varsa)")


class ReportSchema(BaseModel):
    key: str = Field(..., description="Şema anahtarı, ör. 'tubitak_1507'")
    program_name: str
    institution: str
    match_keywords: list[str] = Field(
        default_factory=list,
        description="Eşleşen bir programın bu şemaya yönlendirilmesi için başlığında aranan anahtar kelimeler",
    )
    summary: str = Field("", description="Programın kısa açıklaması")
    sections: list[ReportSection] = Field(default_factory=list)
    required_documents: list[str] = Field(default_factory=list, description="Ek olarak istenen belgeler")
