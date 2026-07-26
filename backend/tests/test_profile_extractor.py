import json

import pytest

from agents.profile_extractor import ProfileExtractor
from models.orchestration import ConversationTurn
from tests.test_llm_provider import MockLLMClient

_BASE_FIELDS = {
    "sector": None,
    "city": None,
    "team_size": None,
    "company_exists": None,
    "company_age_years": None,
    "women_entrepreneur": None,
    "student": None,
    "in_technopark": None,
    "goals": [],
    "summary": None,
}


def _profile_json(**overrides) -> str:
    fields = {**_BASE_FIELDS, **overrides}
    return json.dumps(fields)


@pytest.mark.asyncio
async def test_extracts_fields_from_single_message():
    mock_client = MockLLMClient(responses=[_profile_json(sector="Yazılım", city="Düzce", team_size=3)])
    extractor = ProfileExtractor(llm=mock_client)

    profile = await extractor.run("Düzce'de yazılım girişimi kurdum, 3 kişiyiz")

    assert profile.sector == "Yazılım"
    assert profile.city == "Düzce"
    assert profile.team_size == 3


@pytest.mark.asyncio
async def test_multi_turn_history_is_combined_into_single_prompt():
    mock_client = MockLLMClient(responses=[_profile_json(sector="Yazılım", city="Düzce")])
    extractor = ProfileExtractor(llm=mock_client)

    history = [
        ConversationTurn(role="user", content="Düzce'de bir şirketim var"),
        ConversationTurn(role="assistant", content="Harika, sektörün ne?"),
    ]
    await extractor.run("Yazılım sektöründeyim", history=history)

    prompt_text = mock_client.messages_received[0][0].content
    assert "Düzce'de bir şirketim var" in prompt_text
    assert "Yazılım sektöründeyim" in prompt_text


@pytest.mark.asyncio
async def test_negative_team_size_is_normalized_to_none():
    """LLM'in uydurduğu geçersiz bir değer (negatif ekip büyüklüğü) model_validator ile temizlenmeli."""
    mock_client = MockLLMClient(responses=[_profile_json(team_size=-5)])
    extractor = ProfileExtractor(llm=mock_client)

    profile = await extractor.run("belirsiz bir mesaj")

    assert profile.team_size is None


@pytest.mark.asyncio
async def test_company_age_cleared_when_company_does_not_exist():
    mock_client = MockLLMClient(
        responses=[_profile_json(company_exists=False, company_age_years=2.5)]
    )
    extractor = ProfileExtractor(llm=mock_client)

    profile = await extractor.run("henüz kurmadım ama fikrim var")

    assert profile.company_exists is False
    assert profile.company_age_years is None
