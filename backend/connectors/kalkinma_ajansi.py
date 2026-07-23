import asyncio
import json
from datetime import datetime
from typing import Optional
from core.cleaner import BaseCleaner
from connectors.base import BaseConnector
from core.fetcher import BaseFetcher
from core.llm.factory import get_llm_client

from core.constants import KALKINMA_AJANSI_ISIMLERI

class KalkinmaAjansiConnector(BaseConnector):

    SOURCE_NAME = "KALKINMA_AJANSI"
    
    REQUEST_DELAY = 1.0
    BATCH_SIZE = 15
    BATCH_PAUSE = 1.0

    def __init__(self, fetcher: BaseFetcher, cleaner: BaseCleaner | None = None):
        super().__init__(cleaner=cleaner)
        self.fetcher = fetcher
        self.api_url_template = "https://ka.gov.tr/api/supports?filters={{}}&page={page}"
        self.source_name = "Kalkınma Ajansları"

    async def fetch(self) -> list[dict]:
        print(f"{self.source_name}: API'den güncel ilanlar aranıyor...\n")

        programs = []
        llm_client = get_llm_client()
        page = 1
        detail_request_count = 0

        while True:
            url = self.api_url_template.format(page=page)

            try:
                response_text = await self.fetcher.fetch_text(url)
            except Exception as e:
                print(f" HATA: Sayfa {page} çekilirken hata oluştu: {e}")
                break

            try:
                payload = json.loads(response_text)
            except json.JSONDecodeError:
                print(f" HATA: Sayfa {page} JSON olarak çözümlenemedi.")
                break

            items = payload.get("data", [])
            if not items:
                print(f"{self.source_name}: Sayfa {page}'de veri yok, tarama tamamlandı.")
                break

            print(f"{self.source_name}: Sayfa {page} - {len(items)} kayıt bulundu.")

            for item in items:
                title = item.get("name") or "Başlıksız Hibe"

                 # Süresi geçmiş ilanları atla
                end_date = self._parse_date(item.get("support_end_date"))
                if end_date and end_date < datetime.now():
                    continue
                
                
                # agency_code'u tam isme çevir
                agency_code = item.get("agency_code")
                agency_name = (
                    KALKINMA_AJANSI_ISIMLERI.get(agency_code.lower(), agency_code)
                    if agency_code else None
                )
                
                  # Ön filtreleme: Hedef kitleye kesinlikle uymayan bir sektöre mi ait?
                
    
                if not self.is_relevant(text="", title=title):
                    print(f" ELENDİ (hedef kitleye uymayan sektör): {title}")
                    continue
                
            

                redirect_url = item.get("redirect_url")
                detail_text = title

                if redirect_url:
                    detail_request_count += 1
                    await asyncio.sleep(self.REQUEST_DELAY)

                    if detail_request_count % self.BATCH_SIZE == 0:
                        print(f" -- {detail_request_count} istek tamamlandı, {self.BATCH_PAUSE}sn mola --")
                        await asyncio.sleep(self.BATCH_PAUSE)

                    try:
                        html = await self.fetcher.fetch_text(redirect_url)
                        if html:
                            detail_text = self.clean(html)
                    except Exception as e:
                        print(f" Detay sayfası okunamadı ({redirect_url}): {e}")

                
                 # İkinci filtreleme: Detay sayfası indirildikten sonra, tam
                # metin üzerinden tekrar kontrol. 
                if not self.is_relevant(detail_text, title):
                    print(f" -> ELENDİ (tam metin kontrolünde alakasız çıktı): {title}")
                    continue


                print(f"Yapay zeka analiz ediyor: {title}")
                extracted_info = await llm_client.extract_program_details(
                    body_text=detail_text, source_name=self.source_name
                )

                if extracted_info:
                    source_url = redirect_url or url
                    db_record = self.format_to_db(extracted_info, source_url, detail_text,
                        source_name=self.source_name,
                        region_override=agency_name,)
                    
                    programs.append(db_record)
                    print(f" Başarıyla ayrıştırıldı ve formatlandı: {title}")

            page += 1

        print(f"\n{self.source_name}: Toplam {len(programs)} program işlendi.\n")
        return programs

    def _parse_date(self, date_value) -> Optional[datetime]:
        if not date_value or not isinstance(date_value, str):
            return None
        try:
            return datetime.strptime(date_value, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None