# GravioAI — Backend

FastAPI tabanlı backend ve sağlayıcı-bağımsız LLM katmanı.

## Kurulum

Paket içi modüller birbirini relative import ile çağırıyor, bu yüzden
proje kökünden (`GravioAI/`) `backend.main` paketi olarak çalıştırılmalı —
`backend/` dizinine girip `uvicorn main:app` ile çalıştırmayın.

```bash
python -m venv backend/.venv && source backend/.venv/bin/activate   # Windows: backend\.venv\Scripts\activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env        # GEMINI_API_KEY vb. doldur
uvicorn backend.main:app --reload
```

- API: `http://localhost:8000`
- Sağlık kontrolü: `GET /health`
- Sohbet (geçici): `POST /api/chat` → `{"message": "..."}`

## Yapı

```
backend/
├── main.py            # FastAPI giriş noktası
├── core/
│   ├── config.py      # ortam değişkeni ayarları
│   └── llm/           # sağlayıcı-bağımsız LLM katmanı
│       ├── base.py        # LLMClient arayüzü
│       ├── gemini_client.py
│       ├── anthropic_client.py
│       └── factory.py     # config'e göre sağlayıcı seçimi
├── api/routes.py      # uç noktalar
├── agents/            # orkestratör + ajanlar (Sprint 2)
└── data/programs/     # destek programı verileri (Sprint 1)
```

## LLM sağlayıcısını değiştirme

`.env` içinde `LLM_PROVIDER` ve `LLM_MODEL` ayarlanır. Yeni sağlayıcı eklemek için
`core/llm/` altına bir adaptör yazıp `factory.py`'ye bir dal eklemek yeterli — ajan
kodu değişmez.
