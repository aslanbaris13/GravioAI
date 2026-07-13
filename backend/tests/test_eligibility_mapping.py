import pytest
import json
from unittest.mock import patch

from backend.agents.eligibility import EligibilityAgent, _profile_brief, _program_brief
from backend.models.profile import UserProfile
from backend.models.program import SupportProgram
from backend.tests.test_llm_provider import MockLLMClient

@pytest.fixture
def mock_profile():
    return UserProfile(
        sector="yazılım",
        city="İstanbul",
        team_size=3,
        company_exists=True,
        women_entrepreneur=None,
        student=False,
        in_technopark=True,
        summary="Test girişimi"
    )

@pytest.fixture
def mock_program():
    return SupportProgram(
        id="test-1",
        program_name="Test Programı",
        institution="KOSGEB",
        category="Kamu Destekleri",
        support_type="Hibe",
        description="Test açıklaması"
    )

def test_profile_brief(mock_profile):
    brief = _profile_brief(mock_profile)
    assert "Sektör: yazılım" in brief
    assert "Şehir: İstanbul" in brief
    assert "Kadın girişimci" not in brief  # None values should be omitted

def test_program_brief(mock_program):
    brief = _program_brief(mock_program)
    assert "Program: Test Programı" in brief
    assert "Kurum: KOSGEB" in brief
    assert "Kategori: Kamu Destekleri" in brief

@pytest.mark.asyncio
async def test_eligibility_mapping_consistency(mock_profile, mock_program):
    # Mock LLM response representing a valid EligibilityResult JSON
    mock_response = {
        "score": 85,
        "state": "full",
        "label": "Tam uygun",
        "conditions": [
            {
                "text": "Sektör Uygunluğu",
                "value": "Yazılım",
                "state": "met",
                "hint": "Yazılım sektörü destek kapsamında."
            },
            {
                "text": "Belge Hazırlığı",
                "value": "Eksik",
                "state": "action",
                "hint": "İş planı dokümanı hazırlanmalı."
            }
        ]
    }
    
    mock_client = MockLLMClient(responses=[json.dumps(mock_response)])
    agent = EligibilityAgent(llm=mock_client)
    
    result = await agent.run(mock_profile, mock_program)
    
    # Check consistency of parsed Pydantic model
    assert result.score == 85
    assert result.state == "full"
    assert result.label == "Tam uygun"
    assert len(result.conditions) == 2
    
    c1 = result.conditions[0]
    assert c1.text == "Sektör Uygunluğu"
    assert c1.state == "met"
    
    c2 = result.conditions[1]
    assert c2.text == "Belge Hazırlığı"
    assert c2.state == "action"
    
    # Check that LLM prompt contained the briefs
    messages = mock_client.messages_received[0]
    prompt_text = messages[0].content
    assert "GİRİŞİM PROFİLİ:" in prompt_text
    assert "DESTEK PROGRAMI:" in prompt_text
    assert "Sektör: yazılım" in prompt_text
    assert "Program: Test Programı" in prompt_text
