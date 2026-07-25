from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.routes import router

app = FastAPI()
app.include_router(router, prefix="/api")
client = TestClient(app)


async def _fake_run_stream(self, message, *, history=None, session_id=None, match_limit=5, eligibility_limit=3):
    yield {"type": "meta", "profile": {"sector": None}, "matches": []}
    yield {"type": "token", "text": "Merhaba"}
    yield {"type": "token", "text": " dünya"}
    yield {"type": "done"}


def test_assist_stream_returns_sse_formatted_events():
    with patch("agents.orchestrator.Orchestrator.run_stream", new=_fake_run_stream):
        response = client.post(
            "/api/assist/stream",
            json={"message": "selam", "history": [], "session_id": None},
        )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    body = response.text
    assert 'data: {"type": "meta"' in body
    assert 'data: {"type": "token", "text": "Merhaba"}' in body
    assert 'data: {"type": "token", "text": " dünya"}' in body
    assert 'data: {"type": "done"}' in body


async def _fake_run_stream_error(self, message, *, history=None, session_id=None, match_limit=5, eligibility_limit=3):
    yield {"type": "error", "message": "boom"}


def test_assist_stream_propagates_error_event():
    with patch("agents.orchestrator.Orchestrator.run_stream", new=_fake_run_stream_error):
        response = client.post(
            "/api/assist/stream",
            json={"message": "selam"},
        )

    assert response.status_code == 200
    assert 'data: {"type": "error", "message": "boom"}' in response.text
