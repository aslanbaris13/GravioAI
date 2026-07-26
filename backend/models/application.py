"""Başvuru taslağı modelleri.

Çıktı, frontend'in "Başvuru Hazırlığı" ekranıyla hizalı:
* plan_sections -> iş planı taslağı (başlık + gövde bölümleri)
* documents     -> belge kontrol listesi ('auto' = Gravio'nun hazırlayabileceği)
"""
from datetime import date, datetime
from enum import Enum

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


class ApplicationTrackingStatus(str, Enum):
    """Panelim/Başvurularım'daki bir başvurunun ilerleme durumu.

    `models.program.ApplicationStatus` ile KARIŞTIRILMAMALI — o, bir
    programın kendisinin başvuruya açık olup olmadığını (Açık/Kapalı/Sürekli)
    belirtir. Bu enum ise `ApplicationDraft`'tan (LLM'in ürettiği plan/belge
    taslağı) da farklı — `applications` tablosunda kalıcı olan, kullanıcının
    o programdaki başvuru sürecinin durum takibi kaydıdır (bkz.
    backend/db/schema.sql).
    """

    DRAFT = "taslak"
    IN_PROGRESS = "hazirlaniyor"
    SUBMITTED = "gonderildi"


class ApplicationRecord(BaseModel):
    """Bir oturumun bir programa dair başvuru sürecini takip eden kayıt."""

    id: str
    session_id: str
    program_id: str
    program_name: str
    status: ApplicationTrackingStatus = ApplicationTrackingStatus.DRAFT
    note: str | None = None
    reminder_date: date | None = None
    created_at: datetime
    updated_at: datetime
