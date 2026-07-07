from core.llm_service import AIService
import json

def test_llm_extraction():
    # 1. AI Servisimizi başlatalım
    ai = AIService()
    
    # 2. Örnek bir ham metin (Normalde bunu crawler'dan veya JSON dosyamızdan alacağız)
    ornek_kosgeb_metni = """
    KOBİ Dijital Dönüşüm Destek Programı
    Başvurular sürekli açıktır. İmalat sektöründe faaliyet gösteren KOBİ'ler başvurabilir.
    Programın üst limiti 2.000.000 TL'dir. Kadın girişimcilere %10 ilave destek oranı uygulanır.
    """
    
    print("Gemini API'ye istek atılıyor, lütfen bekleyin...\n")
    
    # 3. Metni AI'a gönder ve Pydantic modelini geri al
    sonuc = ai.extract_program_details(ornek_kosgeb_metni, source_name="KOSGEB")
    
    if sonuc:
        print("Başarılı! Yapay Zeka metni anladı ve sınıflandırdı:\n")
        # Pydantic modelini güzel görünmesi için tekrar JSON'a çevirip ekrana basıyoruz
        print(sonuc.model_dump_json(indent=4, by_alias=True))
    else:
        print(" Çıkarım başarısız oldu.")

if __name__ == "__main__":
    test_llm_extraction()