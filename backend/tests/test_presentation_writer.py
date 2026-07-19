import json

import pytest

from backend.agents.presentation_writer import PresentationWriterAgent
from backend.core.pptx_export import build_presentation_pptx
from backend.models.presentation import PRESENTATION_SKELETON, GeneratedPresentation, PresentationSlide
from backend.models.profile import UserProfile
from backend.tests.test_llm_provider import MockLLMClient


@pytest.fixture
def profile():
    return UserProfile(sector="yazılım", city="İstanbul", team_size=4, summary="Test girişimi")


@pytest.mark.asyncio
async def test_write_slide_parses_json_bullets(profile):
    llm = MockLLMClient(responses=[json.dumps({"bullets": ["Madde 1", "Madde 2", "Madde 3"]})])
    agent = PresentationWriterAgent(llm=llm)

    slide = await agent.write_slide("problem", "Problem", "Hedef kitlenin sorunu", profile, "")

    assert slide.slide_id == "problem"
    assert slide.heading == "Problem"
    assert slide.bullets == ["Madde 1", "Madde 2", "Madde 3"]


@pytest.mark.asyncio
async def test_write_slide_handles_markdown_fenced_json(profile):
    llm = MockLLMClient(responses=['```json\n{"bullets": ["A", "B"]}\n```'])
    agent = PresentationWriterAgent(llm=llm)

    slide = await agent.write_slide("cozum", "Çözüm", "...", profile, "")

    assert slide.bullets == ["A", "B"]


@pytest.mark.asyncio
async def test_write_slide_falls_back_to_line_split_on_bad_json(profile):
    llm = MockLLMClient(responses=["Bu JSON değil\nSadece düz metin\nSatır satır"])
    agent = PresentationWriterAgent(llm=llm)

    slide = await agent.write_slide("ekip", "Ekip", "...", profile, "")

    assert len(slide.bullets) == 3
    assert "Bu JSON değil" in slide.bullets


@pytest.mark.asyncio
async def test_write_presentation_calls_llm_once_per_skeleton_slide(profile):
    responses = [json.dumps({"bullets": ["x"]}) for _ in PRESENTATION_SKELETON]
    llm = MockLLMClient(responses=list(responses))
    agent = PresentationWriterAgent(llm=llm)

    presentation = await agent.write_presentation(profile, "Test A.Ş.", "")

    assert llm.call_count == len(PRESENTATION_SKELETON)
    assert len(presentation.slides) == len(PRESENTATION_SKELETON)
    assert presentation.title == "Test A.Ş."
    assert presentation.subtitle == "yazılım"


def test_build_presentation_pptx_produces_valid_zip_bytes():
    presentation = GeneratedPresentation(
        title="Test Şirketi",
        subtitle="Yazılım",
        slides=[
            PresentationSlide(slide_id="problem", heading="Problem", bullets=["Madde 1", "Madde 2"]),
            PresentationSlide(slide_id="cozum", heading="Çözüm", bullets=["Çözüm 1"]),
        ],
    )
    data = build_presentation_pptx(presentation)
    assert isinstance(data, bytes)
    assert len(data) > 0
    assert data[:2] == b"PK"
