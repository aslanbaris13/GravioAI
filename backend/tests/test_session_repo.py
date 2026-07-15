from unittest.mock import MagicMock, patch

from backend.data import repo
from backend.models.eligibility import EligibilityResult, EligibilityState
from backend.models.orchestration import ProgramMatch
from backend.models.profile import UserProfile
from backend.models.program import SupportProgram
from backend.models.session import SessionState


def _program(pid: str) -> SupportProgram:
    return SupportProgram(
        program_id=pid,
        title=f"Program {pid}",
        category="Kamu Destekleri",
        source_url="https://example.com",
        body_chunk="Test içerik",
    )


def _eligibility(score: int) -> EligibilityResult:
    return EligibilityResult(state=EligibilityState.PARTIAL, score=score, label="Test", conditions=[])


def test_save_session_upserts_serialized_state():
    state = SessionState(
        profile=UserProfile(sector="Yazılım", city="Düzce"),
        matches=[ProgramMatch(program=_program("p1"), eligibility=_eligibility(70))],
    )

    mock_table = MagicMock()
    mock_client = MagicMock()
    mock_client.table.return_value = mock_table

    with patch.object(repo, "_client", return_value=mock_client):
        repo.save_session("sess-1", state)

    mock_client.table.assert_called_once_with("user_sessions")
    args, kwargs = mock_table.upsert.call_args
    row = args[0]
    assert row["session_id"] == "sess-1"
    assert row["profile"]["sector"] == "Yazılım"
    assert row["matches"][0]["program"]["title"] == "Program p1"
    assert kwargs["on_conflict"] == "session_id"


def test_get_session_returns_none_when_not_found():
    mock_resp = MagicMock(data=[])
    mock_table = MagicMock()
    mock_table.select.return_value.eq.return_value.limit.return_value.execute.return_value = mock_resp
    mock_client = MagicMock()
    mock_client.table.return_value = mock_table

    with patch.object(repo, "_client", return_value=mock_client):
        result = repo.get_session("unknown")

    assert result is None


def test_get_session_deserializes_stored_state():
    stored_row = {
        "session_id": "sess-1",
        "profile": {"sector": "Yazılım", "city": "Düzce", "goals": []},
        "matches": [
            {
                "program": {**_program("p1").model_dump(mode="json")},
                "eligibility": _eligibility(85).model_dump(mode="json"),
            }
        ],
    }
    mock_resp = MagicMock(data=[stored_row])
    mock_table = MagicMock()
    mock_table.select.return_value.eq.return_value.limit.return_value.execute.return_value = mock_resp
    mock_client = MagicMock()
    mock_client.table.return_value = mock_table

    with patch.object(repo, "_client", return_value=mock_client):
        result = repo.get_session("sess-1")

    assert result is not None
    assert result.profile.sector == "Yazılım"
    assert len(result.matches) == 1
    assert result.matches[0].program.title == "Program p1"
    assert result.matches[0].eligibility.score == 85
