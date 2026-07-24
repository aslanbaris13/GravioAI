"""Google Gemini adaptörü — sağlayıcı-bağımsız LLM katmanının bir uygulaması."""

import os
import asyncio
from google import genai
from google.genai import types
from .base import LLMClient, LLMMessage
from dotenv import load_dotenv
from models.program import ExtractedSupportInfo
from tenacity import retry, stop_after_attempt, wait_exponential

# Pydantic modelimizi ve base sınıfları içeri alıyoruz



load_dotenv() 

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
            # gemini-3.5-flash bir "thinking" modeli; kapatılmazsa görünmez
            # akıl yürütme token'ları max_output_tokens bütçesinin büyük
            # kısmını tüketip yanıtı birkaç kelimede (finish_reason=MAX_TOKENS)
            # kesiyor. Bu asistan kısa/sohbet yanıtları ürettiği için thinking
            # gerekmiyor — kapatınca yanıtlar tam ve doğal şekilde tamamlanıyor.
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        )
        resp = await self._client.aio.models.generate_content(
            model=self._model,
            contents=contents,
            config=config,
        )
        return resp.text

    async def chat_stream(
        self,
        messages: list[LLMMessage],
        *,
        system: str | None = None,
        max_tokens: int = 4096,
    ):
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
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        )
        stream = await self._client.aio.models.generate_content_stream(
            model=self._model,
            contents=contents,
            config=config,
        )
        async for chunk in stream:
            if chunk.text:
                yield chunk.text

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=15),reraise=True)

    async def extract_program_details(self, body_text: str, source_name: str = "Destek/Hibe") -> ExtractedSupportInfo | None:
        
        #raw metni alır gemini gönderir 
        # ve doldurulmuş pydantic modelini döndürür
        
        await asyncio.sleep(1)
        
        system_instruction = (
            "Sen uzman bir hibe ve teşvik danışmanısın. Sana verilen web sitesi metnini dikkatlice oku. "
            "Metindeki bilgileri kullanarak bütçe, başvuru şartları ve sektör gibi alanları çıkar. "
            "Eğer bir bilgi metinde kesin olarak yoksa, o alanı boş (null) bırak, asla uydurma."
        )

       
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
        
        return ExtractedSupportInfo.model_validate_json(response.text)
        

            