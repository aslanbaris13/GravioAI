
from bs4 import BeautifulSoup
from connectors.base import BaseConnector
from models.raw_program import RawProgram
from core.fetcher import HttpFetcher
from core.cleaner import extract_text_from_html
import uuid
import json
from core.llm_service import AIService
from models.program import SupportProgramDB

class KOSGEBConnector(BaseConnector):
    def __init__(self):

        self.fetcher = HttpFetcher()  # HTTP fetcher'ı kullanıyoruz
        self.main_list_url= "https://www.kosgeb.gov.tr/site/tr/genel/destekler/3/destekler"
        self.base_domain = "https://www.kosgeb.gov.tr"

    async def fetch(self) -> list[RawProgram]:
        """
        Bu metod, KOSGEB'in web sitesinden program verilerini çeker.
        """
        print("KOSGEB: Ana sayfadaki güncel programlar aranıyor...\n ")
        programs = []

        try:

            #1.Aşama: Ana sayfadaki program listesi çekiliyor
            main_page_html = await self.fetcher.fetch_text(self.main_list_url)
            soup =BeautifulSoup(main_page_html, "html.parser")

            #aynı linkleri tekrar eklememek için set kullanıyoruz:
            links=set()

            #bütün <a> (link) etiketlerini buluyoruz.

            for a_tag in soup.find_all("a",href=True):
                href=a_tag["href"]

                # Linkin KOSGEB detay sayfasıyla aynı formda olup olmadığına bakarız:

                if "/destekdetay/" in href:

                    # Bazen linkler "http" ile başlamaz (relative url), başlarına ana domaini ekliyoruz

                    all_url=href if href.startswith("http") else self.base_domain + href

                    links.add(all_url)

            print(f"Ana sayfada {len(links)} adet güncel fon linki bulundu.")

            # Extraction

            for url in links:
                try:
                    print(f"detaylar indiriliyor: {url}")

                    detail_html=await self.fetcher.fetch_text(url)
                    detail_soup= BeautifulSoup(detail_html,"html.parser")

                    #başlığı dinamik çıkar:
                    title=detail_soup.title.string if detail_soup.title else "Başlıksız program:"

                    title=title.replace("KOSGEB - ", "").strip()

                    clean_txt=extract_text_from_html(detail_html)

                    girisimci_anahtar_kelimeler = [
                        "girişimci", "iş kurma", "yeni işletme", 
                        "start-up", "startup", "kuluçka", "inkübatör"
                    ]

                    metin_kucuk = clean_txt.lower()
                    baslik_kucuk = title.lower()

                    # Başlıkta veya metinde girişimcilik kelimelerinden en az biri var mı kontrolü
                    uygun_mu = any(kelime in metin_kucuk or kelime in baslik_kucuk for kelime in girisimci_anahtar_kelimeler)

                    if not uygun_mu:
                        print(f"  -> ELENDİ (Girişimci odaklı değil): {title}")
                        continue  # Uygun değilse listeye eklemeden bir sonraki URL'ye geç
                    

                    print(f"Yapay zeka analiz ediyor: {title}")
                    
                    # AI Servisini çağır
                    ai = AIService()
                    extracted_info = ai.extract_program_details(body_text=clean_txt, source_name="KOSGEB")
                    
                    if extracted_info:
                        # ExtractedSupportInfo şablonunu alıp, sistemin DB şablonuna dönüştürüyoruz
                        db_record = SupportProgramDB(
                            **extracted_info.model_dump(by_alias=False), # Çekilen verileri doğrudan aktar
                            program_id=str(uuid.uuid4()),                # Benzersiz kimlik oluştur
                            source_url=url,                      # Sitenin URL'si
                            body_chunk=clean_txt                       # İleride RAG/Arama için orijinal metin
                            # embedding parametresi vektör veritabanı aşamasında eklenecek
                        )
                        
                        # Hazır olan bu veriyi listeye (veya veritabanına) ekle
                        programs.append(db_record.model_dump(mode='json'))
                        print(f" Başarıyla ayrıştırıldı ve DB formatına çevrildi: {title}")
                    else:
                        print(f" LLM analizi başarısız oldu: {title}")

                except Exception as e :
                    print(f" HATA: {url} SAYFASI OKUNAMADI: {e}")
                    
        except Exception as e:
            print(f"KOSGEB ana sayfa taraması başarısız oldu: {e}")
    
        return programs

   