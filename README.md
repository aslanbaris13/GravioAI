
<!-- LOGO: ProjectManagement/assets/logo.png yükleyince aşağıdaki satırı aç -->
<!-- <img src="ProjectManagement/assets/logo.png" alt="GravioAI" width="180" /> -->

# 🤖 🚀 GravioAI

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

🔗 [GravioAI Product Backlog Board](https://haticenurolgun.atlassian.net/jira/software/projects/SCRUM/boards/1)

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

<details>
<summary><h1>🚀 Sprint 1</h1></summary>

<br>

## 🎯 Sprint Amacı

Sprint 1'in temel amacı; projenin veri altyapısını oluşturmak, girişim destek programlarını toplamak ve düzenlemek, ortak veri şeması oluşturmak, backend altyapısını kurmak ve semantik arama için gerekli temel bileşenleri geliştirmektir.

---

## 📊 Sprint Özeti

| Başlık | Değer |
|--------|--------|
| Sprint Süresi | 19 Haziran - 5 Temmuz |
| Takım Büyüklüğü | 4 Kişi |
| Toplantı Sayısı | 5 |
| Toplantı Sıklığı | Haftada 2 |
| Planlanan Story Point | 54 SP |

---

<details>
<summary><b>📋 Sprint Planlama</b></summary>

### Backlog Düzeni

Sprint backlog'u, projenin ilk sürümünde geliştirilecek kullanıcı hikâyelerine göre oluşturulmuştur. Story'ler daha küçük görevlere (task) ayrılmış ve ekip üyelerine dağıtılmıştır. Önceliklendirme yapılırken sistemin çalışması için kritik bileşenler öncelikli olarak planlanmıştır.

### Sprint Kapsamı

- Girişim destek programlarının toplanması
- Ortak veri şemasının oluşturulması
- Destek programlarının kategorilere ayrılması
- Frontend taslağının oluşturulması.
- Backend altyapısının kurulması
- LLM Provider katmanının geliştirilmesi
- Vector Database kurulumu
- Embedding Pipeline geliştirilmesi
- Eligibility (uygunluk) kurallarının tanımlanması
- Destek programlarının uygunluk kriterleriyle eşleştirilmesi

</details>

---

<details>
  <summary><b>💻 Frontend Arayüz Demosu</b></summary>
  <br>

https://github.com/user-attachments/assets/104a3304-f776-4950-9042-9d34f0b2e240

</details>

---

<details>
<summary><b>📌 Sprint Board Güncellemeleri</b></summary>

Sprint süreci boyunca görev takibi Jira Sprint Board üzerinden gerçekleştirilmiştir.

### Sprint Başlangıcı
 <img width="1440" height="867" alt="Ekran görüntüsü 2026-06-27 145942" src="https://github.com/user-attachments/assets/d23317d0-a5b1-4ec4-aad1-59fe6b87d515" />

### Sprint İlerlemeleri
<img width="1230" height="740" alt="Ekran görüntüsü 2026-07-04 143633" src="https://github.com/user-attachments/assets/7160997a-812f-43df-86e0-c9e3e75d1dab" />

<img width="1142" height="766" alt="Ekran görüntüsü 2026-07-04 155747" src="https://github.com/user-attachments/assets/7c78ca36-b7cc-4f0f-bed2-4c84da1aa4cb" />

<img width="1222" height="870" alt="Ekran görüntüsü 2026-07-04 155831" src="https://github.com/user-attachments/assets/33c1dcdc-7778-4ceb-a500-3e285ad29247" />

### Sprint Sonu

<img width="936" height="732" alt="Ekran görüntüsü 2026-07-05 221733" src="https://github.com/user-attachments/assets/42b0ebf6-b0de-4c02-a3ef-579aa0d86bf6" />

</details>

---

<details>
<summary><b>🤝 Sprint Toplantıları</b></summary>

Sprint boyunca haftada **2-3 kez** ilerleme toplantıları gerçekleştirilmiştir.

Toplantılarda;

- Sprint ilerleyişi değerlendirilmiştir.
- Tamamlanan ve devam eden görevler gözden geçirilmiştir.
- Teknik sorunlar değerlendirilmiştir.
- Yeni aksiyonlar belirlenmiştir.
- Jira görevleri güncellenmiştir.

📄 **Toplantı Notları**

Toplantı gündemleri ve alınan kararlar aşağıda verilen linkteki Jira dokümanında yer almaktadır.
https://hatiicenurolgun.atlassian.net/wiki/pages/resumedraft.action?draftId=1

</details>

---

<details>
<summary><b>✅ Sprint Değerlendirmesi (Sprint Review)</b></summary>

## Sprint Sonu Özeti

| Metrik | Değer |
|--------|--------|
| Planlanan Story Point | 54 SP |
| Tamamlanan Story Point | 54 SP |
| Tamamlanan Görev | 10 |

### Sprint Çıktıları

- Projenin temel veri altyapısı oluşturulmaya başlandı.
- Backend altyapısı ve LLM Provider katmanı geliştirildi.
- Girişim destek programlarının toplanması ve veri şemasının oluşturulması çalışmalarında önemli ilerleme kaydedildi.
- Embedding Pipeline, Vector Database ve Eligibility modüllerinin ilk sürümleri geliştirildi.
- Sprint sonunda tamamlanamayan görevlerin Sprint 2'de devam ettirilmesine karar verildi.

</details>

---

<details>
<summary><b>🔄 Sprint Değerlendirmesi (Retrospective)</b></summary>

### 👍 İyi Giden Noktalar

- Takım içi görev dağılımı planlandığı şekilde gerçekleştirildi.
- Düzenli sprint toplantıları sayesinde ilerleme sürekli takip edildi.
- Jira üzerinden görev yönetimi etkin şekilde yürütüldü.
- Projenin temel mimarisi ve veri altyapısı başarıyla oluşturulmaya başlandı.

### ⚠️ Geliştirilebilecek Noktalar

- Veri toplama sürecinde ekip üyeleri farklı yöntemler kullandığından veri yapısında tutarlılığı sağlamak zorlaştı.
- Story Point tahminlerinin sonraki sprintlerde daha gerçekçi yapılması hedeflenmektedir.
- Teknik dokümantasyonun sprint boyunca daha düzenli güncellenmesi planlanmaktadır.

### 🎯 Sprint 2 Aksiyonları

Sprint 2 kapsamında farklı veri kaynaklarından veri toplanmasını standartlaştırmak amacıyla ortak bir veri toplama (Data Ingestion) altyapısı geliştirilecektir. Böylece tüm veri sağlayıcıları aynı iş akışını kullanacak, kod tekrarının azaltılması ve bakım kolaylığının artırılması hedeflenmektedir.

-  Semantic search altyapısı geliştirilmeye devam edilecek.
-  Ajan orchestration geliştirmelerine başlanacak
- Frontend geliştirmelerine başlanacak.

</details>

</details>

---

<details>
<summary><h1>🚀 Sprint 2</h1></summary>

<br>

<details>
<summary>📋 <strong>Sprint Bilgileri</strong></summary>

<br>

| Özellik | Açıklama |
|---------|----------|
| **Sprint Tarihi** | **6 Temmuz 2026 – 19 Temmuz 2026** |
| **Sprint Teması** | **Intelligence & Agent Katmanının Geliştirilmesi** |
| **Sprint Amacı** | Kullanıcı profillerini analiz ederek uygun girişim destek programlarını önerebilen, uygunluk değerlendirmesi yapabilen ve doğal dil üzerinden etkileşim kurabilen karar verme altyapısını geliştirmek. Bu sprintte semantik eşleştirme, ajan mimarisi, veri platformu geliştirmeleri ve sohbet sistemi entegrasyonu üzerine çalışmalar yürütülmektedir. |

</details>

---

<details>
<summary>📝 <strong>Sprint Planning</strong></summary>

<br>

| Metrik | Değer |
|--------|------:|
| **Sprint Süresi** | 14 Gün |
| **Takım Kapasitesi** | 4 Kişi (%100) |
| **Toplam Work Item** | 13 |
| **Planlanan Story Point** | 71 |
| **Tamamlanan Story Point** |71 |

</details>

---

<details>
<summary>📌 <strong>Sprint Backlog</strong></summary>

<br>

> Sprint backlog aşağıda gösterilmektedir.


<img width="1672" height="583" alt="Ekran görüntüsü 2026-07-08 224104" src="https://github.com/user-attachments/assets/d80af85b-e671-4b2c-bcdb-db7a65ceb994" />

<img width="1441" height="863" alt="Ekran görüntüsü 2026-07-17 120934" src="https://github.com/user-attachments/assets/33251640-58b4-41f4-8f8d-e7a8df857a2d" />

<img width="1377" height="846" alt="Ekran görüntüsü 2026-07-17 120956" src="https://github.com/user-attachments/assets/511ccc93-c75b-4986-bdba-3d11a00c6794" />

<img width="720" height="867" alt="image" src="https://github.com/user-attachments/assets/713a19cc-0d3a-433a-8f1e-ceee41312f04" />

</details>

---

<details>
<summary>🤝 <strong>Sprint Toplantıları</strong></summary>

<br>

Sprint süresince takım üyelerinin yoğun programları nedeniyle yalnızca iki toplantı gerçekleştirilebilmiştir. Görev takibi ve teknik değerlendirmeler Jira ile takım içi iletişim kanalları üzerinden düzenli olarak sürdürülmüştür.

Toplantı gündemleri ve alınan kararlar aşağıda verilen linkteki Jira dokümanında yer almaktadır.
https://hatiicenurolgun.atlassian.net/wiki/x/AYCM


</details>

---
<details>
<summary> <strong> 📌 Frontend Çıktıları</strong></summary>

<br>

<img width="1352" height="800" alt="Ekran Resmi 2026-07-19 15 54 44" src="https://github.com/user-attachments/assets/e9fd2215-b117-46ad-b972-4923c4bbf11f" />

<img width="1352" height="798" alt="Ekran Resmi 2026-07-19 15 54 50" src="https://github.com/user-attachments/assets/3db1cbad-129f-4435-89bc-b5760550614f" />

<img width="1352" height="797" alt="Ekran Resmi 2026-07-19 15 55 05" src="https://github.com/user-attachments/assets/ebe5228b-59eb-424b-b46c-0c77214ef024" />

<img width="1352" height="796" alt="Ekran Resmi 2026-07-19 15 55 19" src="https://github.com/user-attachments/assets/d0694ec0-38ec-4b1f-b50b-c91a997b563d" />

<img width="1352" height="797" alt="Ekran Resmi 2026-07-19 15 55 26" src="https://github.com/user-attachments/assets/7f284572-3ed9-42c1-8451-0a59c658c933" />

<img width="1352" height="799" alt="Ekran Resmi 2026-07-19 15 55 31" src="https://github.com/user-attachments/assets/e016aad8-0cc4-424f-b5af-08a398b4eaf3" />

<img width="1352" height="797" alt="Ekran Resmi 2026-07-19 15 55 36" src="https://github.com/user-attachments/assets/8840904b-034a-45b0-a444-01591dd17828" />

<img width="1600" height="942" alt="WhatsApp Image 2026-07-19 at 15 57 06" src="https://github.com/user-attachments/assets/e767a09e-33ae-4934-96e5-e55e9fde457d" />

<img width="1600" height="942" alt="WhatsApp Image 2026-07-19 at 15 57 18" src="https://github.com/user-attachments/assets/722611e5-88f7-403c-93a5-e89543e4ede2" />

<img width="1600" height="944" alt="WhatsApp Image 2026-07-19 at 15 57 57" src="https://github.com/user-attachments/assets/d053fdd1-b1b5-4701-9c9c-e6473bc985af" />

<img width="1600" height="942" alt="WhatsApp Image 2026-07-19 at 15 57 30" src="https://github.com/user-attachments/assets/02819a7f-1900-440b-bf65-3366a128ad39" />

<img width="1600" height="946" alt="WhatsApp Image 2026-07-19 at 15 58 36" src="https://github.com/user-attachments/assets/71d36c72-4a85-4521-ad7d-4ca5a2ba0480" />





</details>

---
<details>
<summary>🖥️ <strong>Sprint Değerlendirmesi</strong></summary>

<br>

### Tamamlanan Çalışmalar

- ✅ Planner / Orchestrator Agent
- ✅ Chat Flow
- ✅ Chat Interface UI
- ✅ Hierarchical Parent-Child Chunking
- ✅ Funding Search System
- ✅ Profile Extraction System
- ✅ Memory Agent
- ✅ Eligibility Checking
- ✅ Eligibility Matching
- ✅ Retrieval Accuracy Testleri
- ✅ Chat Backend Entegrasyonu
- ✅ Veri Toplama ve Normalization İyileştirmeleri

### Alınan Kararlar

> Sprint boyunca geliştirilen tüm modüllerin entegrasyonu başarıyla tamamlanmıştır. Sprint hedefleri doğrultusunda planlanan çalışmalar gerçekleştirilmiş olup, bir sonraki sprintte sistemin performansını artırmaya ve yeni özellikler geliştirmeye odaklanılması kararlaştırılmıştır.

</details>

---

<details>
<summary>✅ <strong>Sprint Review</strong></summary>

<br>

Sprint planlandığı şekilde başarıyla tamamlanmıştır. Sprint kapsamında hedeflenen tüm geliştirmeler gerçekleştirilmiş; Funding Search System, Profile Extraction System, Eligibility Checking ve Matching modülleri, Memory Agent, Chat Backend entegrasyonu, veri toplama ve normalization iyileştirmeleri ile Retrieval Accuracy testleri tamamlanmıştır. Ayrıca Planner/Orchestrator Agent, Chat Flow, Chat Interface UI ve Hierarchical Parent-Child Chunking geliştirmeleri sisteme entegre edilerek karar verme katmanının ilk uçtan uca çalışan sürümü oluşturulmuştur.

Bu sprint sonunda proje, kullanıcı profilini analiz edebilen, uygun destek programlarını semantik olarak eşleştirebilen, uygunluk değerlendirmesi yapabilen ve doğal dil üzerinden etkileşim kurabilen bütünleşik bir yapıya ulaşmıştır.


</details>

---

<br>

<details>
<summary>🔄 <strong>Sprint Retrospective</strong></summary>

<br>

### 👍 İyi Giden Noktalar

- Sprint başlangıcında belirlenen hedeflerin tamamı başarıyla gerçekleştirildi.
- Semantik eşleştirme, uygunluk değerlendirme ve ajan mimarisi bileşenleri planlandığı şekilde ilerledi.
- Planner/Orchestrator Agent, Memory Agent ve Chat sistemi arasındaki entegrasyon başarıyla sağlandı.
- Hierarchical (Parent-Child) Chunking yapısı geliştirilerek retrieval altyapısı güçlendirildi.
- Takım üyeleri farklı modüller üzerinde paralel çalışarak geliştirme sürecini verimli şekilde yönetti.

### ⚠️ Karşılaşılan Zorluklar

- Sprint süresince takım üyelerinin yoğun programları nedeniyle yalnızca iki resmi toplantı gerçekleştirilebildi.
- Farklı modüllerin aynı anda geliştirilmesi entegrasyon sürecinde ek koordinasyon gerektirdi.
- Veri toplama ve normalization süreçlerinde farklı veri kaynaklarından kaynaklanan uyumluluk problemleriyle karşılaşıldı ve gerekli düzenlemeler yapıldı.

### 🚀 İyileştirme Kararları

- Sprint boyunca iletişim Jira ve takım içi mesajlaşma kanalları üzerinden etkin şekilde sürdürüldü. Bir sonraki sprintte daha düzenli ara değerlendirme toplantıları planlanacaktır.
- Ortak geliştirme standartları ve kod yapısının korunması için teknik dokümantasyonun sprint boyunca güncel tutulmasına devam edilecektir.
- Retrieval performansını artırmak amacıyla farklı chunking ve embedding stratejileri değerlendirilecektir.
- Geliştirilen ajan mimarisi üzerine yeni karar verme yetenekleri ve kullanıcı deneyimini geliştirecek özellikler eklenmesi planlanmaktadır.

</details>
</details>

</details>

---

<details>
<summary><h1>🚀 Sprint 3</h1></summary>

<br>

<details>
<summary>📋 <strong>Sprint Bilgileri</strong></summary>

<br>

| Özellik | Açıklama |
|---------|----------|
| **Sprint Tarihi** | **20 Temmuz 2026 – 2 Ağustos 2026** |
| **Sprint Teması** | **Uçtan uca akışın tamamlanması, canlıya alma ve teslim** |
| **Sprint Amacı** | Uçtan uca akışın tamamlanması · canlıya alma · cilalama · 3 dk tanıtım videosu · teslim |

</details>

---

<details>
<summary>📝 <strong>Sprint Planning</strong></summary>

<br>

| Metrik | Değer |
|--------|------:|
| **Sprint Süresi** | 14 Gün |
| **Takım Kapasitesi** | 4 Kişi (%100) |
| **Toplam Work Item** | Belirlenecek |
| **Planlanan Story Point** | Belirlenecek |
| **Tamamlanan Story Point** | Başlamadı |

### Tamamlanan Story Point'lerin Bireysel Dağılımı

- **Barış:** 0 SP
- **Ferhat:** 0 SP
- **Hatice:** 0 SP
- **Sena:** 0 SP

</details>

---

<details>
<summary>📌 <strong>Sprint Backlog</strong></summary>

<br>

> Sprint backlog aşağıda gösterilmektedir. *(Sprint başladığında güncellenecektir)*

</details>

---

<details>
<summary>🤝 <strong>Sprint Toplantıları</strong></summary>

<br>

> Sprint süresince gerçekleştirilecek toplantı notları ve Jira linkleri bu bölüme eklenecektir.

</details>

---

<details>
<summary>🖥️ <strong>Sprint Değerlendirmesi</strong></summary>

<br>

### Tamamlanan Çalışmalar

- ⏳ *(Sprint sonunda eklenecektir)*

### Devam Eden Çalışmalar

- ⏳ *(Sprint sonunda eklenecektir)*

### Alınan Kararlar

> *(Sprint sonunda eklenecektir)*

</details>

---

<details>
<summary>✅ <strong>Sprint Review</strong></summary>

<br>

> *(Sprint sonu değerlendirmesi bu bölüme eklenecektir)*

</details>

---

<details>
<summary>🔄 <strong>Sprint Retrospective</strong></summary>

<br>

> *(Sprint tamamlandıktan sonra ekip değerlendirmesi, karşılaşılan problemler ve gelecek sprint için alınan aksiyonlar bu bölümde yer alacaktır)*

</details>

</details>

---

<div align="center">

**YZTA Bootcamp 2026 — Yapay Zekâ & Veri Bilimi Kategorisi**

_Yüzeyin altındaki fırsatı çıkar._ 🛰️

</div>
