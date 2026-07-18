import io
from unittest.mock import MagicMock, patch

import pytest
from docx import Document

from backend.core import document_parser


def test_extract_txt():
    content = "Şirketimiz Düzce'de yazılım geliştiriyor.".encode("utf-8")
    assert document_parser.extract_text(content, "notlar.txt") == "Şirketimiz Düzce'de yazılım geliştiriyor."


def test_extract_docx():
    """python-docx zaten bir bağımlılık (rapor export'unda kullanılıyor) —
    gerçek bir .docx belleğe yazılıp geri okunarak test ediliyor."""
    doc = Document()
    doc.add_paragraph("Nova AI Yazılım")
    doc.add_paragraph("Düzce'de kurulmuş 3 kişilik bir ekip.")
    buf = io.BytesIO()
    doc.save(buf)

    text = document_parser.extract_text(buf.getvalue(), "profil.docx")

    assert "Nova AI Yazılım" in text
    assert "Düzce'de kurulmuş" in text


def test_extract_pdf_uses_pypdf_reader():
    """pypdf gerçek bir PDF üretmiyor (yazma desteği yok); PdfReader mock'lanıyor."""
    fake_page = MagicMock()
    fake_page.extract_text.return_value = "Şirket hakkında bilgiler."
    fake_reader = MagicMock()
    fake_reader.pages = [fake_page]

    with patch("backend.core.document_parser.PdfReader", return_value=fake_reader):
        text = document_parser.extract_text(b"%PDF-fake-bytes", "cv.pdf")

    assert text == "Şirket hakkında bilgiler."


def test_unsupported_extension_raises():
    with pytest.raises(ValueError, match="Desteklenmeyen"):
        document_parser.extract_text(b"data", "resim.png")


def test_empty_extracted_text_raises():
    """Taranmış/görsel bir PDF'de extract_text boş dönebilir — bu bir kullanıcı hatası olarak ele alınmalı."""
    fake_page = MagicMock()
    fake_page.extract_text.return_value = ""
    fake_reader = MagicMock()
    fake_reader.pages = [fake_page]

    with patch("backend.core.document_parser.PdfReader", return_value=fake_reader):
        with pytest.raises(ValueError, match="çıkarılamadı"):
            document_parser.extract_text(b"%PDF", "taranmis.pdf")


def test_file_too_large_raises():
    big = b"x" * (5 * 1024 * 1024 + 1)
    with pytest.raises(ValueError, match="büyük"):
        document_parser.extract_text(big, "buyuk.txt")
