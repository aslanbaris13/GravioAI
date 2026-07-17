"""Rapor Yazma Ajanı'nın ürettiği çıktı — bölüm bölüm üretilen rapor içeriği."""
from pydantic import BaseModel, Field


class GeneratedReportSection(BaseModel):
    section_id: str = Field(..., description="ReportSection.id ile eşleşir")
    heading: str
    body: str


class GeneratedReport(BaseModel):
    schema_key: str
    program_name: str
    title: str
    sections: list[GeneratedReportSection] = Field(default_factory=list)
