
from bs4 import BeautifulSoup
from connectors.base import BaseConnector
from models.raw_program import RawProgram
from core.fetcher import HttpFetcher
from core.cleaner import extract_text_from_html
import uuid
import json
from core.llm.factory import get_llm_client
from models.program import SupportProgramDB

class KOSGEBConnector(BaseConnector):
# KOSGEB Erişilebilirlik ve site başlığı çöp metinleri
    forbidden_terms = [
        "Erişilebilirlik Menüsü", "x", "Ekran Okuyucu", "Seçili Alan Okuyucu", 
        "Bağlantı Vurgula", "Büyük Metin", "Metni Sola Hizala", "İmleç", 
        "Okuma", "Disleksi Dostu", "Kontrast", "Solgunlaştırma", 
        "Düşük Doygunluk", "Yüksek Doygunluk", "Erişilebilirlik Ayarlarını Temizle",
        "Tüm Liste", "Site içi arama", "e-hizmetler"
    ]

    def __init__(self):

        self.fetcher = HttpFetcher()  # HTTP fetcher'ı kullanıyoruz
        self.main_list_url= "https://www.kosgeb.gov.tr/site/tr/genel/destekler/3/destekler"
        self.base_domain = "https://www.kosgeb.gov.tr"


    async def fetch(self) -> list[RawProgram]:
        """
        Bu metod, KOSGEB'in web sitesinden program verilerini çeker.
        """
        print("KOSGEB: Ana sayfadaki güncel programlar aranıyor...\n ")
        links = await self.fetcher.fetch_links(self.main_list_url, filter_pattern="/destekdetay/")
        programs = []
        llm_client = get_llm_client()


        for url in links:
            try:
                print(f"detaylar indiriliyor: {url}")
                #içerik çekme
                detail_html=await self.fetcher.fetch_text(url)

                #temizleme

                clean_txt=self.clean(detail_html)

                #başlık çıkarma
                soup = BeautifulSoup(detail_html, "html.parser")
                title = soup.title.string.replace("KOSGEB - ", "").strip() if soup.title else "Başlıksız"

                # Ön filtreleme
                if not self.is_relevant(clean_txt, title):
                    print(f" -> ELENDİ (Girişimci odaklı değil): {title}")
                    continue

                #LLM ile analiz
                #     
                print(f"Yapay zeka analiz ediyor: {title}")
                    
                # gemini client'in extract_program_details metodunu çağırıyoruz.
                
                extracted_info = await llm_client.extract_program_details(body_text=clean_txt, source_name="KOSGEB")


                ####burada DB kaydı oluşturucam
                    

            except Exception as e :
                print(f" HATA: {url} SAYFASI OKUNAMADI: {e}")
                    

        return programs
