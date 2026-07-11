
from bs4 import BeautifulSoup
from connectors.base import BaseConnector
from models.raw_program import RawProgram
from core.cleaner import extract_text_from_html
from core.fetcher import BaseFetcher

from core.llm.factory import get_llm_client
from models.program import SupportProgram

class KOSGEBConnector(BaseConnector):
# KOSGEB Erişilebilirlik ve site başlığı çöp metinleri
    forbidden_terms = [
        "Erişilebilirlik Menüsü", "x", "Ekran Okuyucu", "Seçili Alan Okuyucu", 
        "Bağlantı Vurgula", "Büyük Metin", "Metni Sola Hizala", "İmleç", 
        "Okuma", "Disleksi Dostu", "Kontrast", "Solgunlaştırma", 
        "Düşük Doygunluk", "Yüksek Doygunluk", "Erişilebilirlik Ayarlarını Temizle",
        "Tüm Liste", "Site içi arama", "e-hizmetler"
    ]

    def __init__(self,fetcher:BaseFetcher):

        self.fetcher = fetcher  # HTTP fetcher'ı kullanıyoruz
        self.main_list_url= "https://www.kosgeb.gov.tr/site/tr/genel/destekler/3/destekler"
        self.base_domain = "https://www.kosgeb.gov.tr"


    async def fetch(self) -> list[dict]:
        """
        Bu metod, KOSGEB'in web sitesinden program verilerini çeker.
        """
        print("KOSGEB: Ana sayfadaki güncel programlar aranıyor...\n ")
        links = await self.fetcher.fetch_links(self.main_list_url, filter_pattern="/destekdetay/")
        programs = []
        llm_client = get_llm_client()


        for url in links:
            # Linkin başında "http" yoksa, base_domain ile birleştir
            full_url = url
            
            if not full_url.startswith("http"):
                full_url = f"{self.base_domain}{url}"
            try:
                print(f"detaylar indiriliyor: {full_url}")
                
                #içerik çekme
                detail_html=await self.fetcher.fetch_text(full_url)

                #temizleme

                clean_txt=self.clean(detail_html)

                #başlık çıkarma
                soup = BeautifulSoup(detail_html, "html.parser")
                title = soup.title.string.replace("KOSGEB - ", "").strip() if soup.title else "Başlıksız"

                # Ön filtreleme: Girişimclere uygun mu değil mi diye
                
                # if not self.is_relevant(clean_txt, title):
                #     print(f" -> ELENDİ (Girişimci odaklı değil): {title}")
                #     continue

                #LLM ile analiz
                    
                print(f"Yapay zeka analiz ediyor: {title}")
                    
                # gemini client'in extract_program_details metodunu çağırıyoruz.
                
                extracted_info = await llm_client.extract_program_details(body_text=clean_txt, source_name="KOSGEB")

                if extracted_info:
                    #Veriyi formatla ve listeye ekle
                    
                    db_record = self.format_to_db(extracted_info, full_url, clean_txt,source_name="KOSGEB")
                    programs.append(db_record)
                    print(f" Başarıyla ayrıştırıldı ve formatlandı: {title}")
                    
            except Exception as e :
                print(f" HATA: {url} SAYFASI OKUNAMADI: {e}")
                    
        return programs
