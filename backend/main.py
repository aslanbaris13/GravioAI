"""GravioAI backend — FastAPI giriş noktası.

Alt modüller (`api.routes`, `core`, `models`, `agents`, `data`) bare import
kullanıyor (`from core.config import ...`) — yani `backend/` dizininin
kendisi sys.path'te olmalı. `main:app` (backend/ dizininden, cwd zaten
`backend/`) bunu otomatik sağlar; `backend.main:app` (repo kökünden)
çalıştırıldığında ise cwd repo kökü olduğundan bunu burada elle ekliyoruz.
"""
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from core.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

settings = get_settings()

app = FastAPI(
    title="GravioAI API",
    description="Girişim ve KOBİ'ler için çok-ajanlı destek/hibe asistanı",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "gravioai-backend"}
