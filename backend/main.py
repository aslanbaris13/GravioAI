"""GravioAI backend — FastAPI giriş noktası."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .core.config import get_settings

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
