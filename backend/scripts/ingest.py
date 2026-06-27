"""Destek programlarını embed'leyip Supabase'e yükler.

Çalıştırma (proje kökünden):
    python -m backend.scripts.ingest

`data/programs/*.json` dosyalarını okur, her programı Gemini ile embed'ler ve
`programs` tablosuna upsert eder. Tekrar çalıştırılabilir (id'ye göre upsert).
"""
from ..core.embeddings import embed_text
from ..data.loader import load_programs
from ..data.repo import program_embedding_text, upsert_programs, _to_row


def main() -> None:
    programs = load_programs()
    print(f"{len(programs)} program bulundu, embedding üretiliyor...")

    rows = []
    for i, p in enumerate(programs, 1):
        text = program_embedding_text(p)
        embedding = embed_text(text)
        rows.append(_to_row(p, embedding))
        print(f"  [{i}/{len(programs)}] {p.id} ✓")

    written = upsert_programs(rows)
    print(f"Tamamlandı — {written} kayıt Supabase'e yazıldı.")


if __name__ == "__main__":
    main()
