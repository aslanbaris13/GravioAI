"""Scraper giriş noktası.

Kayıtlı connector'ları çalıştırır, topladığı programları taslak JSON
dosyalarına yazar. Komut satırından hangi kurum(lar)ın çalışacağı
seçilebilir; hiçbir isim verilmezse hepsi çalışır.

Her kurum kendi taslak dosyasına yazar (örn. kosgeb_taslak.json,
kalkinma_taslak.json), böylece bir kurumu tekrar çalıştırdığında
diğerlerinin verisi silinmez.

Kullanım:
    python -m scripts.scrape                  # hepsini çalıştırır
    python -m scripts.scrape kalkinma          # sadece Kalkınma Ajansı
    python -m scripts.scrape kosgeb tubitak    # KOSGEB ve TÜBİTAK
"""
import json
import asyncio
import os
import sys
from core.fetcher import HttpFetcher
from connectors.kosgeb import KOSGEBConnector
from connectors.kalkinma_ajansi import KalkinmaAjansiConnector
from connectors.tubitak import TubitakConnector
from connectors.manager import ConnectorManager
from dotenv import load_dotenv
load_dotenv()

# Kurum adı -> (connector sınıfı, taslak dosya adı) eşlemesi.
# Yeni bir kurum eklerken buraya da eklemen yeterli.
KURUM_MAP = {
    "kosgeb": (KOSGEBConnector, "kosgeb_taslak.json"),
    "kalkinma": (KalkinmaAjansiConnector, "kalkinma_taslak.json"),
    "tubitak": (TubitakConnector, "tubitak_taslak.json"),
}


async def main():
    print("Scraper veri toplama için başlatılıyor..\n")

    http_fetcher = HttpFetcher()

    # Komut satırından kurum ismi(leri) verildiyse sadece onları çalıştır,
    # verilmediyse hepsini çalıştır.
    secilen_kurumlar = sys.argv[1:] or list(KURUM_MAP.keys())

    os.makedirs("data/programs", exist_ok=True)

    for kurum_adi in secilen_kurumlar:
        eslesme = KURUM_MAP.get(kurum_adi)
        if eslesme is None:
            print(f"UYARI: '{kurum_adi}' tanınmıyor, atlanıyor. Geçerli seçenekler: {list(KURUM_MAP.keys())}")
            continue

        connector_class, dosya_adi = eslesme

        # Her kurum kendi Manager'ında, tek başına çalıştırılıyor —
        # böylece bir kurumun çıktısı diğerinin dosyasını etkilemez.
        manager = ConnectorManager()
        manager.register(connector_class(fetcher=http_fetcher))

        collected_programs = await manager.run_all()

        if collected_programs:
            file_path = f"data/programs/{dosya_adi}"
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(collected_programs, f, ensure_ascii=False, indent=4)
            print(f"{dosya_adi}: {len(collected_programs)} program yazıldı.\n")


if __name__ == "__main__":
    asyncio.run(main())