# GravioAI — Backend

FastAPI tabanlı backend ve sağlayıcı-bağımsız LLM katmanı.

## Kurulum

```bash
python -m venv backend/.venv && source backend/.venv/bin/activate   # Windows: backend\.venv\Scripts\activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env        # GEMINI_API_KEY vb. doldur
```

Sunucuyu iki şekilde de çalıştırabilirsin:

```bash
# Proje kökünden (GravioAI/)
uvicorn backend.main:app --reload

# ya da backend/ dizininin içinden, venv aktifken
cd backend && uvicorn main:app --reload
```

`backend/main.py` her iki durumda da `backend` paketini doğru şekilde bulup
yükleyecek şekilde ayarlı; testler ve CI yine proje kökünden `backend.main`
üzerinden çalışır.

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
