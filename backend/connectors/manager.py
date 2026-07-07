
from models.raw_program import RawProgram

from connectors.kalkinma_ag import KalkinmaAgConnector
from connectors.tubitak import TubitakConnector
from connectors.kosgeb import KosgebConnector

class ConnectorManager:
    """
    Bu sınıf, farklı kurumların connector'larını yönetmek için kullanılır.
    """

    def __init__(self):

        "# İleride AWS veya Google eklersek, tek yapmamız gereken onları bu listeye yazmak!"

        self.connectors = [KalkinmaAgConnector(), 
                    TubitakConnector(), 
                    KosgebConnector()]
            
       

    async def fetch_all(self) -> list[RawProgram]:
        """
        Bu metod, tüm connector'ların fetch metodunu çağırarak verileri toplar.
        """
        all_programs = []         ## Bütün kurumlardan gelen verileri toplayacağımız ana liste
        
        
        for connector in self.connectors:
            try:
                programs = await connector.fetch() #veriyi getiriyoruz
        
                all_programs.extend(programs)  # Her connector'dan gelen verileri ana listeye ekliyoruz 

            except Exception as e:
                # Eğer bir kurumun sitesi çökmüşse, bütün sistemimiz çökmesin!
                # Sadece o kurumu atlayıp diğerlerine devam edelim. (Hata yönetimi)
                print(f"HATA: Bir connector çalışırken sorun yaşadı: {e}")
        

        print(f"\n İşlem tamamlandı. Toplam {len(all_programs)} adet program başarıyla çekildi.")
        return all_programs