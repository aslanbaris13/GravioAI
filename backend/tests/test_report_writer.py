import pytest

from agents.report_writer import ReportWriterAgent
from core.docx_export import build_report_docx
from data.report_schema_loader import get_report_schema
from models.profile import UserProfile
from models.report import GeneratedReport, GeneratedReportSection
from tests.test_llm_provider import MockLLMClient


@pytest.fixture
def profile():
    return UserProfile(sector="yazılım", city="İstanbul", team_size=4, summary="Test girişimi")


@pytest.fixture
def schema():
    s = get_report_schema("tubitak_1507")
    assert s is not None
    return s


@pytest.mark.asyncio
async def test_write_section_returns_generated_section(profile, schema):
    llm = MockLLMClient(responses=["Bu bölümün üretilen içeriği."])
    agent = ReportWriterAgent(llm=llm)
    section = schema.sections[0]

    result = await agent.write_section(schema, section, profile, {})

    assert result.section_id == section.id
    assert result.heading == section.title
    assert result.body == "Bu bölümün üretilen içeriği."
    assert llm.call_count == 1


@pytest.mark.asyncio
async def test_write_report_calls_llm_once_per_section(profile, schema):
    responses = [f"İçerik {i}" for i in range(len(schema.sections))]
    llm = MockLLMClient(responses=list(responses))
    agent = ReportWriterAgent(llm=llm)

    report = await agent.write_report(schema, profile, {})

    assert llm.call_count == len(schema.sections)
    assert len(report.sections) == len(schema.sections)
    assert report.schema_key == "tubitak_1507"
    assert report.program_name == schema.program_name


@pytest.mark.asyncio
async def test_write_report_passes_field_values_to_prompt(profile, schema):
    llm = MockLLMClient(responses=["ok"] * len(schema.sections))
    agent = ReportWriterAgent(llm=llm)
    first_section_id = schema.sections[0].id
    first_field_key = schema.sections[0].required_fields[0].key

    await agent.write_report(
        schema, profile, {first_section_id: {first_field_key: "kullanıcının girdiği değer"}}
    )

    first_call_messages = llm.messages_received[0]
    assert "kullanıcının girdiği değer" in first_call_messages[0].content


def test_build_report_docx_produces_valid_zip_bytes():
    report = GeneratedReport(
        schema_key="tubitak_1507",
        program_name="TÜBİTAK 1507",
        title="TÜBİTAK 1507 — Başvuru Raporu",
        sections=[
            GeneratedReportSection(section_id="ozet", heading="Proje Özeti", body="Birinci paragraf.\n\nİkinci paragraf."),
            GeneratedReportSection(section_id="butce", heading="Bütçe", body="Bütçe detayları."),
        ],
    )
    data = build_report_docx(report)
    assert isinstance(data, bytes)
    assert len(data) > 0
    # .docx dosyaları ZIP formatındadır — PK imzasıyla başlar
    assert data[:2] == b"PK"
