import json
import asyncio
import os
from core.fetcher import HttpFetcher
from connectors.kosgeb import KOSGEBConnector
from connectors.manager import ConnectorManager
from connectors.kalkinma_ajansi import KalkinmaAjansiConnector
from connectors.tubitak import TubitakConnector
from dotenv import load_dotenv
load_dotenv()


async def main():
    print("Scraper veri toplama için başlatılıyor..\n")
    
    http_fetcher= HttpFetcher()
    #js_fetcher = SeleniumFetcher()
    manager=ConnectorManager()
    
    # Çalıştırılacak Kurumlar (İleride burası tek satırla büyüyecek)
    aktif_kurumlar = [
        TubitakConnector(fetcher=http_fetcher),
        KOSGEBConnector(fetcher=http_fetcher),         
        KalkinmaAjansiConnector(fetcher=http_fetcher)  
        #diğer_portalConnector(fetcher=js_fetcher) 
    ]
    
    # Tüm aktif kurumları Manager'a otomatik kaydet
    for kurum in aktif_kurumlar:
        manager.register(kurum)
        
    # 3. Motoru çalıştır
    collected_programs = await manager.run_all()
    
    #DB aktarmadan önce kontrol etmek için json kaydettim
    
    if collected_programs:
        # data/programs klasörünün var olduğundan emin ol
        os.makedirs("data/programs", exist_ok=True)
        
        file_path = "data/programs/kosgeb_taslak.json"
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(collected_programs, f, ensure_ascii=False, indent=4)
            
            
            
if __name__ == "__main__":
    asyncio.run(main())