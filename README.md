<div align="center">

<!-- LOGO: docs/assets/logo.png yükleyince aşağıdaki satırı aç -->
<!-- <img src="docs/assets/logo.png" alt="GravioAI" width="180" /> -->

# 🛰️ GravioAI

### _Yüzeyin altındaki fırsatı çıkar_

**Girişimler ve KOBİ'ler için yapay zekâ destekli, çok-ajanlı fon, hibe ve teşvik bulma asistanı**

[![Status](https://img.shields.io/badge/durum-geli%C5%9Ftiriliyor-yellow)]()
[![Bootcamp](https://img.shields.io/badge/YZTA-Bootcamp%202026-1f3a5f)]()
[![Category](https://img.shields.io/badge/kategori-Yapay%20Zek%C3%A2%20%26%20Veri%20Bilimi-blueviolet)]()
[![License](https://img.shields.io/badge/lisans-MIT-green)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs)]()

[🎯 Demo](#-demo) · [🧠 Mimari](#-yapay-zek%C3%A2-mimarisi) · [🚀 Kurulum](#-kurulum) · [📋 Sprintler](#-sprint-dok%C3%BCmantasyonu) · [🗺️ Yol Haritası](#%EF%B8%8F-yol-haritas%C4%B1)

</div>

---

## 📑 İçindekiler

- [GravioAI Nedir?](#-gravioai-nedir)
- [Problem & Çözüm](#-problem--çözüm)
- [Özellikler](#-özellikler)
- [Yapay Zekâ Mimarisi](#-yapay-zekâ-mimarisi)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Desteklenen Kategoriler](#-desteklenen-destek-kategorileri)
- [Demo](#-demo)
- [Kurulum](#-kurulum)
- [Proje Yapısı](#-proje-yapısı)
- [Sprint Dokümantasyonu](#-sprint-dokümantasyonu)
- [Yol Haritası](#️-yol-haritası)
- [Takım](#-takım)
- [Lisans](#-lisans)

---

## 🛰️ GravioAI Nedir?

**GravioAI**, Türkiye'deki girişimcilerin ve KOBİ'lerin hak ettikleri devlet ve özel sektör desteklerini (hibe, vergi teşviki, bulut kredisi, hızlandırıcı, yatırım ve yarışma fırsatları) bulmasını, uygunluğunu kontrol etmesini ve başvurusunu hazırlamasını sağlayan **çok-ajanlı (multi-agent) bir yapay zekâ asistanıdır.**

Kullanıcı asistanla **konuşarak** profilini oluşturur. GravioAI ardından:

1. 👤 **Profili çıkarır** — sektör, il, ölçek, kuruluş tarihi, hedef
2. 🔍 **Uygun tüm destekleri eşleştirir** — devlet + özel + bulut + etkinlik
3. ✅ **Uygunluk kontrolü yapar** — eksik koşulları açıkça belirtir
4. 📝 **Başvuru taslağı + belge listesi üretir**
5. ⏰ **Son tarih takibi yapar** — fırsatları proaktif hatırlatır

> 🇹🇷 Türkiye'de ~3,9 milyon işletme KOBİ sınıfında (TÜİK, 2024) ve her yıl 100 binin üzerinde yeni şirket kuruluyor. Devlet milyarlarca lira destek dağıtıyor; özel sektör (AWS, Google, Microsoft, NVIDIA) tek bir girişime **600.000 doları aşan** kredi sunabiliyor. Bu kaynakların büyük kısmı, işletmeler ya habersiz olduğu ya da başvuru karmaşasında kaybolduğu için **sahipsiz kalıyor.** GravioAI bu boşluğu kapatır.

---

## 🎯 Problem & Çözüm

| Problem | GravioAI'nin Çözümü |
|---|---|
| **Farkındasızlık** — işletmeler hangi desteklerin var olduğunu bilmiyor | Tek arayüzde devlet + özel + bulut + yarışma kaynaklarını tarar |
| **Uygunluk belirsizliği** — "Ben bu programa uygun muyum?" | Kural-bazlı + LLM uygunluk ajanı; eksik koşulları söyler |
| **Başvuru karmaşası** — formlar, iş planı, belge listesi caydırıcı | Başvuru taslağı + belge listesini otomatik üretir |
| **Son tarih kaçırma** | Profili hafızada tutar, dönemleri proaktif hatırlatır |
| **Danışman maliyeti** — hibe danışmanlığı küçük işletmeye pahalı | Danışmanı herkesin cebine, çok düşük maliyetle koyar |

---

## ✨ Özellikler

- 💬 **Konuşma-temelli profil** — form doldurmadan, sohbet ederek
- 🧩 **Çok-ajanlı orkestrasyon** — uzman ajanlar bir orkestratörce yönetilir
- 🔎 **RAG tabanlı eşleştirme** — pgvector ile anlamsal arama
- 🔗 **Kaynağa linkli cevaplar** — her öneri resmî kaynağa bağlanır (halüsinasyon kontrolü)
- 🧠 **Kalıcı hafıza** — kullanıcı profilini hatırlar, yeni fırsat çıkınca bildirir
- 🔌 **Modüler konektörler** — yeni program = yeni konektör (KOSGEB, TÜBİTAK, AWS…)
- 🌐 **Sağlayıcı-bağımsız LLM** — model katmanı soyutlanmış

---

## 🧠 Yapay Zekâ Mimarisi

GravioAI "tek bir LLM çağrısı" değil; bir **orkestratör** tarafından yönetilen uzman ajanlardan oluşan **agentic** bir üründür.

```
                         ┌────────────────────────┐
        Kullanıcı  ⇄     │   Orkestratör (Planner)│
                         │  niyet → alt ajan akışı │
                         └───────────┬────────────┘
            ┌────────────────┬───────┼────────┬───────────────────┐
            ▼                ▼       ▼         ▼                   ▼
   ┌─────────────┐  ┌──────────────┐ ┌────────────┐  ┌─────────────────┐  ┌──────────┐
   │ Profil      │  │ Eşleştirme   │ │ Uygunluk   │  │ Başvuru         │  │ Hafıza   │
   │ Çıkarma     │  │ Ajanı (RAG)  │ │ Ajanı      │  │ Ajanı           │  │ (Memory) │
   │ Ajanı       │  │ pgvector     │ │ kural+LLM  │  │ form+belge      │  │ profil + │
   │ → profil    │  │ anlamsal arama│ │ değerlendirme│ │ taslağı üretimi │  │ bildirim │
   └─────────────┘  └──────────────┘ └────────────┘  └─────────────────┘  └──────────┘
            │                │
            ▼                ▼
   ┌─────────────────────────────────────────┐
   │  Program Veritabanı (Supabase + pgvector)│
   │  KOSGEB · TÜBİTAK · AWS · Google · …      │
   └─────────────────────────────────────────┘
```

| Ajan | Görevi |
|---|---|
| 🧭 **Orkestratör (Planner)** | Kullanıcı niyetini anlar, alt ajanları sırayla/paralel çağırır, sonuçları birleştirir |
| 👤 **Profil Çıkarma Ajanı** | Konuşmadan yapılandırılmış işletme profili üretir |
| 🔍 **Eşleştirme Ajanı (RAG)** | Program DB üzerinde anlamsal arama yapar, uygun destekleri getirir |
| ✅ **Uygunluk Ajanı** | Program şartlarını profile karşı kural-bazlı + LLM ile değerlendirir |
| 📝 **Başvuru Ajanı** | Form ve iş planı taslaklarını + belge listesini üretir |
| 🧠 **Hafıza (Memory)** | Kullanıcı profilini saklar, proaktif bildirim sağlar |

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| **Backend** | Python · FastAPI |
| **Frontend** | Next.js 14 (App Router) |
| **Veritabanı / RAG** | Supabase · PostgreSQL · pgvector |
| **Kuyruk** | Celery · Redis |
| **LLM** | Sağlayıcı-bağımsız soyutlama katmanı |
| **Dağıtım** | Vercel (frontend) · container (backend) |

---

## 🗂️ Desteklenen Destek Kategorileri

<details>
<summary><b>Tüm kategorileri göster</b></summary>

1. **Devlet / Kamu** — KOSGEB, TÜBİTAK (BİGG/1512, 1507, 1501), STB Teknogirişim, Kalkınma Ajansları (26 ajans), KGF, İŞKUR, Ticaret Bakanlığı, TÜRKPATENT, AB fonları
2. **Vergi & Lokasyon** — Teknopark/TGB, Ar-Ge Merkezi, Genç Girişimci istisnası, Serbest Bölge
3. **Özel Sektör / Bulut** — AWS Activate (300K$), Google for Startups (350K$), Microsoft Founders Hub (150K$), NVIDIA Inception, Stripe/Notion/GitHub/Supabase kredileri, OpenAI/Anthropic programları
4. **Hızlandırıcı & Kuluçka** — İTÜ Çekirdek, Kworks, Workup, Inovent, QNBEYOND, Endeavor, Plug and Play
5. **Yatırım** — Melek ağları (Galata, TBAA), VC'ler (500 Istanbul, Revo, Diffusion), Kitle fonlama (SPK lisanslı), Devlet eş-yatırım
6. **Yarışma / Etkinlik / Network** — TEKNOFEST, Big Bang, Webrazzi, Startup Istanbul, hackathon'lar
7. **Global** — YC, Techstars, Antler, EF, EWOR

</details>

> 🎯 **Demo odağı:** İlk çalışan segment olarak **teknoloji girişimi destekleri** (AWS Activate + TÜBİTAK BİGG) hedeflenmiştir — ekibin alanına en yakın, verisi en net segment.

---

## 🎬 Demo

> _Sprint ilerledikçe doldurulacak._

- 🔗 **Canlı link:** _(yakında)_
- 🎥 **Tanıtım videosu (3 dk):** _(yakında — YouTube)_

| Sohbet Arayüzü | Eşleşen Destekler | Başvuru Taslağı |
|---|---|---|
| _ekran görüntüsü_ | _ekran görüntüsü_ | _ekran görüntüsü_ |

---

## 🚀 Kurulum

> ⚠️ Ön koşullar: **Python 3.11+**, **Node.js 18+**, bir **Supabase** projesi, bir **LLM API anahtarı**.

```bash
# 1) Depoyu klonla
git clone https://github.com/aslanbaris13/GravioAI.git
cd GravioAI

# 2) Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # anahtarları doldur (LLM, Supabase)
uvicorn main:app --reload

# 3) Frontend (yeni terminal)
cd frontend
npm install
cp .env.example .env.local  # API URL'ini ayarla
npm run dev
```

Frontend: `http://localhost:3000` · Backend: `http://localhost:8000`

---

## 📁 Proje Yapısı

```
GravioAI/
├── backend/
│   ├── main.py                 # FastAPI giriş noktası
│   ├── agents/
│   │   ├── orchestrator.py     # Orkestratör (Planner)
│   │   ├── profile_agent.py    # Profil çıkarma
│   │   ├── matching_agent.py   # Eşleştirme (RAG)
│   │   ├── eligibility_agent.py# Uygunluk
│   │   ├── application_agent.py# Başvuru taslağı
│   │   └── memory.py           # Hafıza
│   ├── data/programs/          # KOSGEB, TÜBİTAK, AWS … (JSON/MD)
│   └── requirements.txt
├── frontend/
│   ├── app/                    # Next.js 14 App Router
│   └── package.json
└── docs/
    ├── sprint-1/  ├── sprint-2/  └── sprint-3/
```

---

## 📋 Sprint Dokümantasyonu

YZTA Bootcamp gereği her sprint sonunda kanıtlar bu bölüme ve `docs/` altına eklenir.

<details>
<summary><h3>🟢 Sprint 1 (19 Haz – 5 Tem)</h3></summary>

**Sprint Hedefi:** Problem doğrulama · veri modeli · ilk konektörler (AWS + BİGG) · profil çıkarma + eşleştirme ajanı · temel sohbet arayüzü

| Teslim | Durum | Bağlantı |
|---|---|---|
| 📌 Sprint notları & backlog dağılımı | ☐ | [docs/sprint-1/planning.md](docs/sprint-1/planning.md) |
| 🗣️ Daily Scrum notları | ☐ | [docs/sprint-1/daily-scrum.md](docs/sprint-1/daily-scrum.md) |
| 🖼️ Sprint Board ekran görüntüleri | ☐ | docs/sprint-1/board/ |
| 📱 Ürün durumu (ekran görüntüleri) | ☐ | — |
| 🔄 Sprint Review & Retrospective | ☐ | [docs/sprint-1/review-retrospective.md](docs/sprint-1/review-retrospective.md) |

- **Sprint Review:** _(doldurulacak)_
- **Sprint Retrospective:** _(doldurulacak)_

</details>

<details>
<summary><h3>⚪ Sprint 2 (6 Tem – 19 Tem)</h3></summary>

**Sprint Hedefi:** Uygunluk ajanı · başvuru taslağı ajanı · orkestratör + hafıza · kaynak gösterimli RAG · son tarih takibi

| Teslim | Durum |
|---|---|
| 📌 Sprint notları & backlog dağılımı | ☐ |
| 🗣️ Daily Scrum notları | ☐ |
| 🖼️ Sprint Board ekran görüntüleri | ☐ |
| 📱 Ürün durumu | ☐ |
| 🔄 Sprint Review & Retrospective | ☐ |

</details>

<details>
<summary><h3>⚪ Sprint 3 (20 Tem – 2 Ağu)</h3></summary>

**Sprint Hedefi:** Uçtan uca akışın tamamlanması · canlıya alma · cilalama · 3 dk tanıtım videosu · teslim

| Teslim | Durum |
|---|---|
| 📌 Sprint notları & backlog dağılımı | ☐ |
| 🗣️ Daily Scrum notları | ☐ |
| 🖼️ Sprint Board ekran görüntüleri | ☐ |
| 📱 Ürün durumu | ☐ |
| 🔄 Sprint Review & Retrospective | ☐ |
| 🎥 3 dk tanıtım videosu | ☐ |

</details>

---

## 🗺️ Yol Haritası

| Sprint | Tarih | Hedef / Çıktı |
|---|---|---|
| **Sprint 1** | 19 Haz – 5 Tem | Problem doğrulama, veri modeli, ilk konektörler, profil + eşleştirme ajanı, temel sohbet arayüzü |
| **Sprint 2** | 6 Tem – 19 Tem | Uygunluk ajanı, başvuru ajanı, orkestratör + hafıza, kaynak gösterimli RAG, son tarih takibi |
| **Sprint 3** | 20 Tem – 2 Ağu | Uçtan uca akış, canlıya alma, cilalama, tanıtım videosu, teslim |

📅 **Teslim deadline:** 2 Ağustos 2026, 23:59 · 🏆 **Top 10 Sunum:** 14 Ağustos 2026

---

## 👥 Takım

| İsim | Rol | GitHub |
|---|---|---|
| **Barış Aslan** | Product Owner | [@aslanbaris13](https://github.com/aslanbaris13) |
| **Hatice Nur Olgun** | Scrum Master | [@haticenurolgun](https://github.com/haticenurolgun) |
| **Sena Cindioğlu** | Developer | [@SenaCindioglu](https://github.com/SenaCindioglu) |
| **Ferhat Güdek** | Developer | [@FerhatGudek](https://github.com/FerhatGudek) |

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

---

<div align="center">

**YZTA Bootcamp 2026 — Yapay Zekâ & Veri Bilimi Kategorisi**

_Yüzeyin altındaki fırsatı çıkar._ 🛰️

</div>
