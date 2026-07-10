from abc import ABC, abstractmethod
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from bs4 import BeautifulSoup

class BaseFetcher(ABC):
    """
    Bu bizim ana şablonumuz.
    Bütün kurumların fetcher'ları bu sınıftan türetilecek.
    Böylece hepsinin aynı standartta (fetch metoduna sahip) olmasını garanti altına alıyoruz.
    """

    @abstractmethod
    async def fetch_text(self, url: str) -> dict:
        """
        Bu metod, fetcher'ın veriyi çekmesini sağlayacak.
        Her fetcher kendi fetch metodunu implement etmek zorunda.
        """
        pass


class HttpFetcher(BaseFetcher):
    """
    Bu sınıf, HTTP üzerinden internete çıkıp sayfaların
    HTML (veya metin) kodunu indiren veri çekmek için kullanılacak.
    """

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=20))
    async def fetch_text(self, url: str) -> str:
        """
        Bu metod, verilen URL'den veri çeker ve ham metin (HTML) olarak döndürür.
        Eğer istek başarısız olursa, belirli bir sayıda tekrar dener.
        """
        kimlik_karti = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        print(f"istek atılıyor: {url}")
     
        async with httpx.AsyncClient(timeout=30.0, headers=kimlik_karti) as client:
            response = await client.get(url)
            response.raise_for_status()  # Eğer HTTP hatası varsa exception fırlatır
            return response.text

    async def fetch_links(self, url: str, filter_pattern: str) -> set:
        html = await self.fetch_text(url)
        soup = BeautifulSoup(html, "html.parser")
        links = set()
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"]
            if filter_pattern in href:
                links.add(href)
        return links