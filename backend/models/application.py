"""Başvuru taslağı modelleri.

Çıktı, frontend'in "Başvuru Hazırlığı" ekranıyla hizalı:
* plan_sections -> iş planı taslağı (başlık + gövde bölümleri)
* documents     -> belge kontrol listesi ('auto' = Gravio'nun hazırlayabileceği)
"""
from pydantic import BaseModel, Field


class PlanSection(BaseModel):
    heading: str = Field(description="Bölüm başlığı, örn. 'Özet', 'Problem ve Çözüm'")
    body: str = Field(description="Bölüm metni, programa ve profile özel")


class RequiredDocument(BaseModel):
    label: str = Field(description="Belge adı, örn. 'İş planı', 'Nüfus kayıt örneği'")
    auto: bool = Field(
        default=False,
        description="Gravio'nun otomatik hazırlayabileceği bir belge mi (iş planı, bütçe vb.)",
    )
    note: str | None = Field(default=None, description="Belgeyle ilgili kısa not, opsiyonel")


class ApplicationDraft(BaseModel):
    program_name: str = Field(description="Başvurulan programın adı")
    plan_title: str = Field(description="İş planı taslağının başlığı")
    plan_sections: list[PlanSection] = Field(
        default_factory=list, description="İş planı taslağının bölümleri"
    )
    documents: list[RequiredDocument] = Field(
        default_factory=list, description="Programa özel gerekli belgeler"
    )
