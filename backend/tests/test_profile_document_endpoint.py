from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from agents import ProfileExtractor
from api.routes import router
from models.profile import UserProfile

app = FastAPI()
app.include_router(router, prefix="/api")
client = TestClient(app)


def test_parse_document_returns_profile_from_txt_upload():
    fake_profile = UserProfile(sector="Yazılım", city="Düzce", team_size=3)
    with patch.object(ProfileExtractor, "run", new=AsyncMock(return_value=fake_profile)) as mock_run:
        response = client.post(
            "/api/profile/parse-document",
            files={"file": ("hakkimizda.txt", b"Duzce'de yazilim sirketiyiz, 3 kisiyiz.", "text/plain")},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["sector"] == "Yazılım"
    assert body["city"] == "Düzce"
    mock_run.assert_awaited_once()


def test_parse_document_rejects_unsupported_extension():
    response = client.post(
        "/api/profile/parse-document",
        files={"file": ("resim.png", b"binary-data", "image/png")},
    )

    assert response.status_code == 400
    assert "Desteklenmeyen" in response.json()["detail"]


def test_parse_document_rejects_empty_pdf_text():
    fake_page = MagicMock()
    fake_page.extract_text.return_value = ""
    fake_reader = MagicMock()
    fake_reader.pages = [fake_page]

    with patch("core.document_parser.PdfReader", return_value=fake_reader):
        response = client.post(
            "/api/profile/parse-document",
            files={"file": ("taranmis.pdf", b"%PDF-fake", "application/pdf")},
        )

    assert response.status_code == 400
