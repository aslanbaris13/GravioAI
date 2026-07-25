"""Profil belgesi (CV/şirket dokümanı) metin çıkarma — SCRUM-81.

Kullanıcının yüklediği PDF/DOCX/TXT dosyasından düz metin çıkarır; bu metin
daha sonra var olan `ProfileExtractor`'a (backend/agents/profile_extractor.py)
aynen serbest sohbet metni gibi verilir. Yeni bir çıkarım ajanı değildir —
sadece dosya → metin dönüşümünü sağlar.
"""
import io

from docx import Document
from pypdf import PdfReader

_MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Dosya baytlarından düz metin çıkarır.

    Desteklenen uzantılar: .pdf, .docx, .txt. Boş sonuç veya desteklenmeyen
    uzantı için `ValueError` fırlatır — çağıran taraf (route) bunu 400'e çevirir.
    """
    if len(file_bytes) > _MAX_FILE_SIZE:
        raise ValueError("Dosya çok büyük (maksimum 5MB).")

    suffix = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if suffix == "pdf":
        text = _extract_pdf(file_bytes)
    elif suffix == "docx":
        text = _extract_docx(file_bytes)
    elif suffix == "txt":
        text = file_bytes.decode("utf-8", errors="ignore")
    else:
        raise ValueError(f"Desteklenmeyen dosya türü: .{suffix or '?'} (yalnızca PDF/DOCX/TXT)")

    text = text.strip()
    if not text:
        raise ValueError("Dosyadan metin çıkarılamadı (boş veya taranmış/görsel bir belge olabilir).")
    return text


def _extract_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages)


def _extract_docx(file_bytes: bytes) -> str:
    document = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in document.paragraphs]
    return "\n".join(paragraphs)
