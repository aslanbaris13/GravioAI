
from bs4 import BeautifulSoup
import re # Metindeki fazladan boşlukları silmek için

def extract_text_from_html(html_content: str, forbidden_terms: list[str] = None) -> str:
    """
    Bu metod, HTML içeriğindeki gereksiz kısımları ayıklar ve LLM için temizlenmiş, daha az token harcayacak bir metin döndürür.
    """
    # Eğer parametre gelmediyse boş liste tanımla
    if forbidden_terms is None:
        forbidden_terms = []
    soup = BeautifulSoup(html_content, "html.parser")
    
    # Sitedeki HTML etiketlerini (<div>, <p> vb.) atıp sadece metinleri al

    tags_to_remove = ["style", "script", "noscript", "header", "footer", "nav", "aside", "form", "svg"]

    for tag in soup(tags_to_remove):
        tag.decompose()  # Bu etiketleri ve içeriğini tamamen kaldırır

    
    #geri kalan temiz kısmı alıyoruz

    cleaned_text = soup.get_text(separator="\n").strip()
    
    lines = cleaned_text.split('\n')
    filtered_lines = []
    
    for line in lines:
        line_clean = line.strip()
        # Satır yasaklı listedeyse veya tamamen boşsa atla
        if line_clean in forbidden_terms or not line_clean:
            continue
        filtered_lines.append(line_clean)
        
    cleaned_text = "\n".join(filtered_lines)
    # Fazladan boşlukları temizle
    cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
    
    return cleaned_text