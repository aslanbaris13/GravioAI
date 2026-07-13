
from models.raw_program import RawProgram
from connectors.base import BaseConnector
from connectors.kalkinma_ajansi import KalkinmaAjansiConnector
from connectors.tubitak import TubitakConnector
from connectors.kosgeb import KOSGEBConnector

class ConnectorManager:
    """
    Bu sınıf, farklı kurumların connector'larını yönetmek için kullanılır.
    """

    def __init__(self):

        # Sisteme kayıtlı olan connector'ları tutacağımız liste
        self._connectors: list[BaseConnector] = []
       
    def register(self, connector: BaseConnector) -> None:
        """Yeni bir kurumu sisteme ekler."""
        self._connectors.append(connector)

    async def run_all(self) -> list[dict]:
        """Kayıtlı tüm connector'ları sırayla çalıştırır ve verileri toplar."""
        all_programs = []
        
        for connector in self._connectors:
            # Sınıfın adını (örn: KosgebConnector) dinamik olarak alıyoruz
            connector_name = connector.__class__.__name__
            print(f"\n[MANAGER] Başlatılıyor: {connector_name}")
            
            try:
                # Her connector kendi fetch metodunu çalıştırır
                programs = await connector.fetch()
                
                # Çekilen verileri ana listeye ekle
                all_programs.extend(programs)
                print(f"[MANAGER] Başarılı: {connector_name} - {len(programs)} program bulundu.")
                
            except Exception as e:
                # Hata izolasyonu: Biri çökerse diğerine geç
                print(f"[MANAGER] HATA: {connector_name} çalışırken kritik hata oluştu: {e}")
                
        return all_programs