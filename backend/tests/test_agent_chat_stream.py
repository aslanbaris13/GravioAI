from unittest.mock import AsyncMock, patch

import pytest

from agents.base import Agent
from core.llm.base import LLMClient, LLMMessage


class DummyAgent(Agent):
    name = "dummy"
    system_prompt = "Dummy system prompt"


class _FlakyStreamClient(LLMClient):
    """Kontrollü şekilde hata fırlatan sahte bir streaming LLM istemcisi."""

    def __init__(self, chunks, *, fail_times: int = 0, fail_after_first_chunk: bool = False, exc: Exception | None = None):
        self.chunks = chunks
        self.fail_times = fail_times
        self.fail_after_first_chunk = fail_after_first_chunk
        self.exc = exc or RuntimeError("503 Service Unavailable")
        self.attempts = 0

    async def chat(self, messages, *, system=None, max_tokens=4096):
        raise NotImplementedError

    async def chat_stream(self, messages, *, system=None, max_tokens=4096):
        self.attempts += 1
        if self.attempts <= self.fail_times:
            raise self.exc
        for i, c in enumerate(self.chunks):
            if i == 1 and self.fail_after_first_chunk:
                raise RuntimeError("stream koptu")
            yield c


@pytest.mark.asyncio
async def test_stream_retries_before_first_chunk_on_transient_error():
    """İlk chunk gelmeden önceki geçici (503) hatalarda yeniden denenmeli."""
    client = _FlakyStreamClient(["Merhaba", " dünya"], fail_times=2)
    agent = DummyAgent(llm=client)

    with patch("agents.base.asyncio.sleep", new_callable=AsyncMock):
        chunks = [
            c
            async for c in agent._chat_stream_with_history(
                [LLMMessage(role="user", content="test")], system=None, max_tokens=100
            )
        ]

    assert chunks == ["Merhaba", " dünya"]
    assert client.attempts == 3


@pytest.mark.asyncio
async def test_stream_does_not_retry_after_first_chunk_yielded():
    """Stream başladıktan sonraki bir hata retry edilmeden olduğu gibi yükseltilmeli."""
    client = _FlakyStreamClient(["ilk", "ikinci"], fail_after_first_chunk=True)
    agent = DummyAgent(llm=client)

    chunks = []
    with pytest.raises(RuntimeError, match="stream koptu"):
        async for c in agent._chat_stream_with_history(
            [LLMMessage(role="user", content="test")], system=None, max_tokens=100
        ):
            chunks.append(c)

    assert chunks == ["ilk"]
    assert client.attempts == 1


@pytest.mark.asyncio
async def test_stream_non_transient_error_raises_immediately_without_retry():
    client = _FlakyStreamClient(["a"], fail_times=99, exc=ValueError("geçersiz istek"))
    agent = DummyAgent(llm=client)

    with pytest.raises(ValueError, match="geçersiz istek"):
        async for _ in agent._chat_stream_with_history(
            [LLMMessage(role="user", content="test")], system=None, max_tokens=100
        ):
            pass

    assert client.attempts == 1
