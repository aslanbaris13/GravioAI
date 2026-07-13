import pytest
from unittest.mock import AsyncMock, patch
import asyncio

from backend.core.config import Settings
from backend.core.llm.factory import build_llm_client
from backend.core.llm.base import LLMClient, LLMMessage
from backend.agents.base import Agent

class MockLLMClient(LLMClient):
    def __init__(self, responses=None, exceptions=None):
        self.responses = responses or []
        self.exceptions = exceptions or []
        self.call_count = 0
        self.messages_received = []

    async def chat(self, messages: list[LLMMessage], *, system: str | None = None, max_tokens: int = 4096) -> str:
        self.call_count += 1
        self.messages_received.append(messages)
        
        if self.exceptions:
            exc = self.exceptions.pop(0)
            if exc:
                raise exc
                
        if self.responses:
            return self.responses.pop(0)
            
        return "mock response"

class DummyAgent(Agent):
    name = "dummy"
    system_prompt = "Dummy system prompt"


def test_build_llm_client_anthropic():
    settings = Settings(
        llm_provider="anthropic",
        anthropic_api_key="test-key",
        llm_model="test-model"
    )
    client = build_llm_client(settings)
    from backend.core.llm.anthropic_client import AnthropicClient
    assert isinstance(client, AnthropicClient)
    assert client._model == "test-model"

def test_build_llm_client_gemini():
    settings = Settings(
        llm_provider="gemini",
        gemini_api_key="test-key",
        llm_model="test-model"
    )
    client = build_llm_client(settings)
    from backend.core.llm.gemini_client import GeminiClient
    assert isinstance(client, GeminiClient)
    assert client._model == "test-model"

def test_build_llm_client_unsupported():
    settings = Settings(llm_provider="unsupported")
    with pytest.raises(ValueError, match="Desteklenmeyen LLM sağlayıcı: 'unsupported'"):
        build_llm_client(settings)

@pytest.mark.asyncio
async def test_agent_transient_retry():
    # Retry on transient error (e.g. 503)
    mock_client = MockLLMClient(
        responses=["success"],
        exceptions=[Exception("503 Service Unavailable"), None]
    )
    agent = DummyAgent(llm=mock_client)
    
    # Patch asyncio.sleep to avoid actually waiting during tests
    with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
        response = await agent._chat("hello", system=None, max_tokens=100, retries=3)
        assert response == "success"
        assert mock_client.call_count == 2
        mock_sleep.assert_called_once()

@pytest.mark.asyncio
async def test_agent_permanent_error():
    # Should not retry on permanent errors
    mock_client = MockLLMClient(
        exceptions=[Exception("400 Bad Request")]
    )
    agent = DummyAgent(llm=mock_client)
    
    with pytest.raises(Exception, match="400 Bad Request"):
        await agent._chat("hello", system=None, max_tokens=100, retries=3)
    assert mock_client.call_count == 1
