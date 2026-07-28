from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.routes import router
from data import repo
from models import IngestionRun

app = FastAPI()
app.include_router(router, prefix="/api")
client = TestClient(app)


def _row(source: str, status: str = "success") -> dict:
    return {
        "id": "11111111-1111-1111-1111-111111111111",
        "source": source,
        "status": status,
        "docs_found": 5,
        "chunks_upserted": 12,
        "error_msg": None,
        "started_at": "2026-07-27T10:00:00+00:00",
        "finished_at": "2026-07-27T10:02:00+00:00",
    }


def test_list_ingestion_runs_orders_by_started_at_desc():
    mock_resp = MagicMock(data=[_row("tubitak"), _row("kosgeb")])
    mock_table = MagicMock()
    mock_table.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_resp
    mock_client = MagicMock()
    mock_client.table.return_value = mock_table

    with patch.object(repo, "_client", return_value=mock_client):
        result = repo.list_ingestion_runs(limit=20)

    mock_client.table.assert_called_once_with("ingestion_runs")
    mock_table.select.return_value.order.assert_called_once_with("started_at", desc=True)
    assert [r.source for r in result] == ["tubitak", "kosgeb"]


def test_ingestion_runs_endpoint_returns_runs():
    with patch.object(repo, "list_ingestion_runs", return_value=[
        IngestionRun.model_validate(_row("kosgeb", status="failed"))
    ]) as mock_list:
        response = client.get("/api/ingestion-runs")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["source"] == "kosgeb"
    assert body[0]["status"] == "failed"
    mock_list.assert_called_once_with(20)
