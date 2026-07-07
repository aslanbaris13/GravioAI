import asyncio
import json

from connectors.kosgeb import KOSGEBConnector
print("--- KOSGEB TESTİ BAŞLATILIYOR ---\n")

async def run_kosgeb_test():
    # 1. KOSGEB connector'ını başlatıyoruz
    kosgeb_isci = KOSGEBConnector()
    
    print("KOSGEB sitelerine bağlanılıyor, lütfen bekleyin...\n")
    
    # 3. KOSGEB connector'ından verileri çekiyoruz
    cekilen_veriler = await kosgeb_isci.fetch()
    
    print(f"\n KOSGEB'den toplam {len(cekilen_veriler)} adet program başarıyla çekildi.")


    # 3. Pydantic modellerini sözlüğe çevirme aşaması
    kaydedilecek_liste = []
    
    for program in cekilen_veriler:
        kaydedilecek_liste.append(program.model_dump())
        print(f" -> İndirilen: {program.title}")

    # 4. JSON Dosyasını Oluşturma (İsmini karışmasın diye değiştirdik)
    dosya_adi = "kosgeb_izole_test.json"
    
    with open(dosya_adi, "w", encoding="utf-8") as dosya:
        json.dump(kaydedilecek_liste, dosya, ensure_ascii=False, indent=4)
        
    print(f"\n Test Tamamlandı! Lütfen '{dosya_adi}' dosyasını inceleyin.")

# 5. Dosyayı terminalden çalıştırma motoru
if __name__ == "__main__":
    asyncio.run(run_kosgeb_test())