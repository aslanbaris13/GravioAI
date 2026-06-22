<div align="center">

<!-- LOGO: ProjectManagement/assets/logo.png yükleyince aşağıdaki satırı aç -->
<!-- <img src="ProjectManagement/assets/logo.png" alt="GravioAI" width="180" /> -->

# 🛰️ GravioAI

### _Yüzeyin altındaki fırsatı çıkar_

[![Status](https://img.shields.io/badge/durum-geli%C5%9Ftiriliyor-yellow)]()
[![Bootcamp](https://img.shields.io/badge/YZTA-Bootcamp%202026-1f3a5f)]()
[![Category](https://img.shields.io/badge/kategori-Yapay%20Zek%C3%A2%20%26%20Veri%20Bilimi-blueviolet)]()
[![License](https://img.shields.io/badge/lisans-MIT-green)](LICENSE)

</div>

---

# Ürün İle İlgili Bilgiler

## Takım Elemanları

| İsim | Rol | GitHub |
|---|---|---|
| **Barış Aslan** | Product Owner | [@aslanbaris13](https://github.com/aslanbaris13) |
| **Hatice Nur Olgun** | Scrum Master | [@haticenurolgun](https://github.com/haticenurolgun) |
| **Sena Cindioğlu** | Developer | [@SenaCindioglu](https://github.com/SenaCindioglu) |
| **Ferhat Güdek** | Developer | [@FerhatGudek](https://github.com/FerhatGudek) |

## Ürün İsmi

**GravioAI**

## Ürün Açıklaması

GravioAI, Türkiye'deki girişimcilerin ve KOBİ'lerin hak ettikleri devlet ve özel sektör desteklerini (hibe, vergi teşviki, bulut kredisi, hızlandırıcı, yatırım ve yarışma fırsatları) bulmasını, uygunluğunu kontrol etmesini ve başvurusunu hazırlamasını sağlayan **çok-ajanlı (multi-agent) bir yapay zekâ asistanıdır.**

Kullanıcı asistanla **konuşarak** profilini oluşturur. GravioAI ardından profili çıkarır, uygun tüm destekleri eşleştirir, uygunluk kontrolü yapar, başvuru taslağı + belge listesi üretir ve son tarih takibi yapar. Her öneri **resmî kaynağa linklidir** (halüsinasyon kontrolü).

> Türkiye'de ~3,9 milyon işletme KOBİ sınıfında (TÜİK, 2024) ve devlet milyarlarca lira, özel sektör (AWS, Google, Microsoft) tek bir girişime 600.000 doları aşan destek sunuyor. Bu kaynakların büyük kısmı farkındasızlık ve başvuru karmaşası yüzünden sahipsiz kalıyor. GravioAI bu boşluğu kapatır.

## Ürün Özellikleri

- 💬 **Konuşma-temelli profil** — form doldurmadan, sohbet ederek işletme profili çıkarma
- 🧩 **Çok-ajanlı orkestrasyon** — uzman ajanlar bir orkestratör tarafından yönetilir
- 🔍 **RAG tabanlı eşleştirme** — pgvector ile anlamsal arama, "sana uygun N destek"
- ✅ **Uygunluk kontrolü** — kural-bazlı + LLM; eksik koşulları açıkça belirtir
- 📝 **Başvuru hazırlığı** — başvuru formu taslağı + belge listesi + iş planı taslağı
- ⏰ **Son tarih takibi** — kullanıcı profilini hatırlar, fırsatları proaktif bildirir
- 🔗 **Kaynağa linkli cevaplar** — her öneri resmî kaynağa bağlanır
- 🔌 **Modüler konektörler** — yeni program = yeni konektör (KOSGEB, TÜBİTAK, AWS…)

## Hedef Kitle

- 🚀 **Erken aşama teknoloji girişimcileri** — bulut kredisi, TÜBİTAK BİGG, hızlandırıcı ve melek yatırım arayanlar (ilk hedef segment)
- 🏪 **Yeni kurulan KOBİ'ler ve esnaf** — KOSGEB ve kalkınma ajansı desteklerine en uygun ama en az bilgiye sahip grup
- 📈 **Büyüme aşamasındaki KOBİ'ler** — yatırım teşvik belgesi, ihracat ve Ar-Ge merkezi teşvikleri arayanlar
- 🧮 **Mali müşavirler & danışmanlık firmaları (B2B)** — müşteri portföyü için aracı olarak kullananlar

## Product Backlog URL

📋 **[GravioAI Product Backlog Board](#)** _(Miro / GitHub Projects linki — eklenecek)_

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
     Profil Çıkarma    Eşleştirme   Uygunluk   Başvuru          Hafıza
     Ajanı             Ajanı (RAG)  Ajanı      Ajanı            (Memory)
     → profil          pgvector     kural+LLM  form+belge       profil +
                       anlamsal arama değerlendirme taslağı       bildirim
```

| Ajan | Görevi |
|---|---|
| 🧭 **Orkestratör (Planner)** | Niyeti anlar, alt ajanları sırayla/paralel çağırır, sonuçları birleştirir |
| 👤 **Profil Çıkarma Ajanı** | Konuşmadan yapılandırılmış işletme profili üretir |
| 🔍 **Eşleştirme Ajanı (RAG)** | Program DB üzerinde anlamsal arama yapar |
| ✅ **Uygunluk Ajanı** | Program şartlarını profile karşı kural-bazlı + LLM ile değerlendirir |
| 📝 **Başvuru Ajanı** | Form + iş planı taslağı ve belge listesi üretir |
| 🧠 **Hafıza (Memory)** | Kullanıcı profilini saklar, proaktif bildirim sağlar |

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Backend | Python · FastAPI |
| Frontend | Next.js 14 (App Router) |
| Veritabanı / RAG | Supabase · PostgreSQL · pgvector |
| Kuyruk | Celery · Redis |
| LLM | Sağlayıcı-bağımsız soyutlama katmanı |
| Dağıtım | Vercel (frontend) · container (backend) |

---

# Sprint 1

> 🟢 **Sprint Tarihi:** 19 Haziran – 5 Temmuz 2026
> **Sprint Hedefi:** Problem doğrulama · veri modeli · ilk konektörler (AWS + BİGG) · profil çıkarma + eşleştirme ajanı · temel sohbet arayüzü

- **Sprint Notları:** _(Sprint planlama notları ve story dağılımı buraya eklenecek)_

- **Sprint içinde tamamlanması tahmin edilen puan:** _(eklenecek)_

- **Puan tamamlama mantığı:** _(Toplam backlog puanı ve sprint başına hedef puan mantığı buraya yazılacak)_

- **Backlog düzeni ve Story seçimleri:** _(Backlog'un nasıl düzenlendiği, story → task ayrımı buraya yazılacak)_

- **Daily Scrum:** _(Daily Scrum toplantı notları — jpeg/word olarak ProjectManagement/Sprint1Documents/ altına eklenecek ve buradan linklenecek)_

- **Sprint Board Update:** _(Sprint board ekran görüntüleri buraya eklenecek)_
  <!-- ![Sprint 1 Board](ProjectManagement/Sprint1Documents/board1.png) -->

- **Ürün Durumu:** _(Ürünün ekran görüntüleri buraya eklenecek)_
  <!-- ![Ürün Ekranı 1](ProjectManagement/Sprint1Documents/product1.png) -->

- **Sprint Review:** _(Sprint Review'da alınan kararlar ve katılımcılar buraya yazılacak)_

- **Sprint Retrospective:** _(Retrospektif çıktıları — iyileştirme kararları buraya yazılacak)_

---

# Sprint 2

> ⚪ **Sprint Tarihi:** 6 – 19 Temmuz 2026
> **Sprint Hedefi:** Uygunluk ajanı · başvuru taslağı ajanı · orkestratör + hafıza · kaynak gösterimli RAG · son tarih takibi

_(Sprint 2 dokümantasyonu sprint sonunda eklenecek)_

---

# Sprint 3

> ⚪ **Sprint Tarihi:** 20 Temmuz – 2 Ağustos 2026
> **Sprint Hedefi:** Uçtan uca akışın tamamlanması · canlıya alma · cilalama · 3 dk tanıtım videosu · teslim

_(Sprint 3 dokümantasyonu sprint sonunda eklenecek)_

---

<div align="center">

**YZTA Bootcamp 2026 — Yapay Zekâ & Veri Bilimi Kategorisi**

_Yüzeyin altındaki fırsatı çıkar._ 🛰️

</div>
