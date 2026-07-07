import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

from models.program import ExtractedSupportInfo

load_dotenv()

class AIService:

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY bulunamadı! Lütfen .env dosyanızı kontrol edin.")
        
        self.provider = os.getenv("LLM_PROVIDER", "gemini")
        self.model_name = os.getenv("LLM_MODEL", "gemini-2.5-flash")    

        self.client = genai.Client(api_key=self.api_key)


    def extract_program_details(self,body_text:str, source_name:str= "Destek/Hibe") -> ExtractedSupportInfo:
        """
        Raw metni alır, Gemini'a gönderir ve doldurulmuş Pydantic modelini döndürür.
        """

        system_instruction = (
            "Sen uzman bir hibe ve teşvik danışmanısın. Sana verilen web sitesi metnini dikkatlice oku. "
            "Metindeki bilgileri kullanarak bütçe, başvuru şartları ve sektör gibi alanları çıkar. "
            "Eğer bir bilgi metinde kesin olarak yoksa, o alanı boş (null) bırak, asla uydurma."
        )

        try:
            # Gemini'a isteği atıyoruz
            response = self.client.models.generate_content(

                model=self.model_name,
                contents=f"Aşağıdaki {source_name} programı metnini analiz et:\n\n{body_text}",
                config= types.GenerateContentConfig(
                    #çıktının sadece bizim base modelimize uygun olmasına zorluyoruz.
                    
                    response_mime_type="application/json",
                    response_schema=ExtractedSupportInfo,
                    system_instruction=system_instruction,
                    temperature=0.1 # Halüsinasyonu en aza indirmek için
                )

            )

            # Gemini'dan dönen metni (JSON string) Pydantic objesine çeviriyoruz
            extracted_data = ExtractedSupportInfo.model_validate_json(response.text)
            return extracted_data

        except Exception as e:
            print(f"LLM Analiz Hatası: {e}")
            return None