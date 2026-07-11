"""Taslak JSON dosyasındaki programları embed'leyip Supabase'e yükler.

Akış:
1. data/loader.py ile taslak.json'daki programları oku ve doğrula.
2. Her program için embedding metnini oluştur (data/repo.py).
3. core/embedding/factory.py ile doğru embedding client'ı al, metni vektöre çevir.
4. Satırı embedding ile birlikte hazırla.
5. Toplu olarak Supabase'e yaz (upsert).
"""
import asyncio

from data.loader import load_programs
from data.repo import program_embedding_text, _to_row, upsert_programs
from core.embedder import get_embedding_client


async def main():
    print("Ingestion başlatılıyor...\n")

    programs = load_programs()
    print(f"{len(programs)} program taslak dosyasından okundu.")

    if not programs:
        print("Yüklenecek program bulunamadı, çıkılıyor.")
        return

    embedding_client = get_embedding_client()

    rows = []
    for program in programs:
        text = program_embedding_text(program)
        print(f"Embedding oluşturuluyor: {program.title}")

        try:
            embedding = await embedding_client.embed_text(text)
        except Exception as e:
            print(f" HATA: {program.title} için embedding oluşturulamadı: {e}")
            continue

        row = _to_row(program, embedding=embedding)
        rows.append(row)

    if not rows:
        print("Hiçbir satır hazırlanamadı, Supabase'e yazılmayacak.")
        return

    # Aynı program_id'ye sahip birden fazla satır varsa (filtreler kapalıyken
    # aynı slug'ı üreten farklı linkler gibi durumlarda olabiliyor), Postgres
    # tek bir upsert komutunda aynı satırı iki kez güncelleyemiyor. Bu yüzden
    # göndermeden önce tekilleştiriyoruz — aynı program_id'den en son
    # gördüğümüzü tutuyoruz.
    tekil_satirlar = {}
    for row in rows:
        pid = row["program_id"]
        if pid in tekil_satirlar:
            print(f" - Tekrarlanan program_id atlandı: {pid}")
        tekil_satirlar[pid] = row

    rows = list(tekil_satirlar.values())

    print(f"\n{len(rows)} satır Supabase'e yazılıyor...")
    written = upsert_programs(rows)
    print(f"Tamamlandı: {written} kayıt yazıldı.")
    
if __name__ == "__main__":
    asyncio.run(main())