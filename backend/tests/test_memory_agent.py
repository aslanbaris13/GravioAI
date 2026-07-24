from unittest.mock import patch

import pytest

from agents.memory import MemoryAgent
from models.profile import UserProfile
from models.session import SessionState


@pytest.mark.asyncio
async def test_load_delegates_to_repo_get_session():
    agent = MemoryAgent()
    fake_state = SessionState(profile=UserProfile(sector="Yazılım"), matches=[])

    with patch("agents.memory.repo.get_session", return_value=fake_state) as get_session:
        result = await agent.load("session-123")

    get_session.assert_called_once_with("session-123")
    assert result.profile.sector == "Yazılım"


@pytest.mark.asyncio
async def test_load_returns_none_when_no_session():
    agent = MemoryAgent()
    with patch("agents.memory.repo.get_session", return_value=None):
        result = await agent.load("bilinmeyen")

    assert result is None


@pytest.mark.asyncio
async def test_save_delegates_to_repo_save_session_with_correct_state():
    agent = MemoryAgent()
    profile = UserProfile(sector="Yazılım", city="Düzce")

    with patch("agents.memory.repo.save_session") as save_session:
        await agent.save("session-123", profile, [])

    save_session.assert_called_once()
    called_session_id, called_state = save_session.call_args.args
    assert called_session_id == "session-123"
    assert called_state.profile.sector == "Yazılım"
    assert called_state.matches == []
