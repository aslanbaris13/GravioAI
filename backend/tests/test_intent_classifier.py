import json

import pytest

from backend.agents.intent_classifier import CONFIDENCE_THRESHOLD, IntentClassifier
from backend.models.intent import Intent
from backend.tests.test_llm_provider import MockLLMClient


def _response(intent: str, confidence: float) -> str:
    return json.dumps({"intent": intent, "confidence": confidence})


@pytest.mark.asyncio
async def test_high_confidence_intent_is_kept():
    mock_client = MockLLMClient(responses=[_response("apply_request", 0.8)])
    clf = IntentClassifier(llm=mock_client)

    result = await clf.run("BİGG'e nasıl başvururum?")

    assert result.intent == Intent.APPLY_REQUEST
    assert result.confidence == 0.8


@pytest.mark.asyncio
async def test_low_confidence_falls_back_to_profile_info():
    # LLM off_topic dese bile, güven eşiğin altındaysa güvenli varsayılana düşülmeli
    mock_client = MockLLMClient(
        responses=[_response("off_topic", CONFIDENCE_THRESHOLD - 0.1)]
    )
    clf = IntentClassifier(llm=mock_client)

    result = await clf.run("bilmiyorum ne diyeceğimi")

    assert result.intent == Intent.PROFILE_INFO


@pytest.mark.asyncio
async def test_history_is_included_in_prompt():
    from backend.models.orchestration import ConversationTurn

    mock_client = MockLLMClient(responses=[_response("profile_info", 0.9)])
    clf = IntentClassifier(llm=mock_client)

    history = [
        ConversationTurn(role="user", content="Düzce'de bir şirketim var"),
        ConversationTurn(role="assistant", content="Harika, sektörün ne?"),
    ]
    await clf.run("Yazılım sektöründeyim", history=history)

    prompt_text = mock_client.messages_received[0][0].content
    assert "Düzce'de bir şirketim var" in prompt_text
    assert "Yazılım sektöründeyim" in prompt_text
