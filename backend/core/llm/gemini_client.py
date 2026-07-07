"""Google Gemini adaptörü — sağlayıcı-bağımsız LLM katmanının bir uygulaması."""

import os
from google import genai
from google.genai import types
from .base import LLMClient, LLMMessage
from dotenv import load_dotenv


# Pydantic modelimizi ve base sınıfları içeri alıyoruz
from models.program import ExtractedSupportInfo
from .base import LLMClient, LLMMessage

load_dotenv() 

_ROLE_MAP = {"user": "user", "assistant": "model"}

_ROLE_MAP = {"user": "user", "assistant": "model"}


class GeminiClient(LLMClient):
    def __init__(self, api_key: str, model: str) -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model

    async def chat(
        self,
        messages: list[LLMMessage],
        *,
        system: str | None = None,
        max_tokens: int = 4096,
    ) -> str:
        contents = [
            types.Content(
                role=_ROLE_MAP[m.role],
                parts=[types.Part.from_text(text=m.content)],
            )
            for m in messages
        ]
        config = types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=max_tokens,
        )
        resp = await self._client.aio.models.generate_content(
            model=self._model,
            contents=contents,
            config=config,
        )
        return resp.text

    async def extract_program_details(self, body_text: str, source_name: str = "Destek/Hibe") -> ExtractedSupportInfo | None:
        
        #raw metni alır gemini gönderir 
        # ve doldurulmuş pydantic modelini döndürür
        system_instruction = (
            "Sen uzman bir hibe ve teşvik danışmanısın. Sana verilen web sitesi metnini dikkatlice oku. "
            "Metindeki bilgileri kullanarak bütçe, başvuru şartları ve sektör gibi alanları çıkar. "
            "Eğer bir bilgi metinde kesin olarak yoksa, o alanı boş (null) bırak, asla uydurma."
        )

        try:
            # Asenkron istek atıyoruz (self._client.aio kullanımına dikkat)
            
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=f"Aşağıdaki {source_name} programı metnini analiz et:\n\n{body_text}",
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ExtractedSupportInfo,
                    system_instruction=system_instruction,
                    temperature=0.1
                )
            )

            # # Gemini'dan dönen metni (JSON string) Pydantic objesine çeviriyoruz.
            extracted_data = ExtractedSupportInfo.model_validate_json(response.text)
            return extracted_data
        
        except Exception as e:
            print(f"LLM Extraction Error: {e}")
            return None