import asyncio
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from connectors.base import BaseConnector
from core.fetcher import BaseFetcher
from core.cleaner import BaseCleaner
from core.llm.factory import get_llm_client

class GoogleCloudConnector(BaseConnector):
    SOURCE_NAME = "GOOGLE_CLOUD"
    START_URL = "https://startup.google.com/programs/"
    forbidden_terms = []

    def __init__(self, fetcher: BaseFetcher, cleaner: BaseCleaner | None = None):
        super().__init__(cleaner=cleaner)
        self.fetcher = fetcher
        self.base_domain = "https://startup.google.com"
        self.source_name = "Google Cloud"

    async def fetch(self) -> list[dict]:
        print(f"{self.source_name}: Bulut kredileri ve hibe programları taranıyor...\n")
        programs = []
        llm_client = get_llm_client()
        gorulen_linkler = set()
        
        # Sadece gitmesini istediğimiz hedef sayfalar
        target_patterns = ["/programs/", "/cloud/", "/startup"]

        try:
            html = await self.fetcher.fetch_text(self.START_URL)
        except Exception as e:
            print(f" ⚠️ ERROR: Failed to fetch {self.START_URL}: {e}")
            return programs

        soup = BeautifulSoup(html, "html.parser")
        tum_linkler = soup.find_all("a", href=True)

        for link_etiketi in tum_linkler:
            try:
                baslik = link_etiketi.text.strip()
                href = link_etiketi["href"].strip()

                # Hatalı relative linkleri düzelt
                if href.startswith("../"):
                    href = href.replace("../", "/")

                full_url = urljoin(self.START_URL, href)

                # Alan adı dışına taşmayı ve mükerrer taramayı engelle
                if (full_url in gorulen_linkler or 
                    "startup.google.com" not in full_url and "cloud.google.com/startup" not in full_url):
                    continue

                if not any(pattern in full_url for pattern in target_patterns):
                    continue  # SQL, Mainframe, SAP gibi alakasız dökümanları süzüyoruz

                gorulen_linkler.add(full_url)

                print(f"detaylar indiriliyor: {full_url}")
                detail_html = await self.fetcher.fetch_text(full_url)
                clean_txt = self.clean(detail_html)

                # Başlık çıkarma
                soup_detail = BeautifulSoup(detail_html, "html.parser")
                title = soup_detail.title.string.replace("Google Cloud - ", "").strip() if soup_detail.title else (baslik or "Google Cloud Program")

                print(f"Yapay zeka analiz ediyor: {title}")
                extracted_info = await llm_client.extract_program_details(
                    body_text=clean_txt, source_name=self.source_name
                )

                if extracted_info:
                    db_record = self.format_to_db(extracted_info, full_url, clean_txt, source_name=self.source_name)
                    programs.append(db_record)
                    print(f" Başarıyla ayrıştırıldı ve formatlandı: {title}")

                # Gemini API 503 Hız Sınırı (Rate Limit) Koruması
                await asyncio.sleep(2.5)

            except Exception as e:
                print(f" ERROR: Failed to process link: {e}")

        return programs