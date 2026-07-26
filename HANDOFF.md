# GravioAI — Devam Notu (Handoff)

> Bu dosya, çalışmanın bırakıldığı noktayı ve sıradaki işi özetler. Backend
> çok-ajanlı mimarisi tamamlandı; sıradaki ana iş **frontend entegrasyonu**.

## Durum: ne hazır

**Backend (FastAPI, `backend/`) — uçtan uca çalışıyor:**

| Ajan | Girdi → Çıktı | Endpoint |
|------|---------------|----------|
| Profil Çıkarma | mesaj → `UserProfile` | `POST /api/profile` |
| Eşleştirme (RAG) | profil → `SupportProgram[]` | `POST /api/match` (ham metin) |
| Uygunluk | profil + program → `EligibilityResult` | `POST /api/eligibility` |
| Başvuru | profil + program → `ApplicationDraft` | `POST /api/application` |
| **Orkestratör** | mesaj → tüm akış | `POST /api/assist` |

Altyapı: Supabase + pgvector veri katmanı, Gemini LLM (sağlayıcı-bağımsız katman
`core/llm/`), Gemini embeddings + RAG, geçici hata (503/429) retry.

**Frontend (Next.js 14, `frontend/`):** 6 ekranlı cilalı prototip ama
**tamamen mock** — hiç API çağrısı yok, chat scripted.

## Açık iş #0: PR #10'u merge et
`feat_application_agent → develop` (Başvuru Ajanı). Devam etmeden önce merge et.

---

## SIRADAKİ ANA İŞ: Frontend ↔ Backend entegrasyonu

Hedef: chat ekranını `POST /api/assist`'e bağlamak; mock veriyi gerçek
backend yanıtıyla değiştirmek. İlk görsel uçtan uca demo.

### Adım 1 — Frontend'e API katmanı ekle
- `frontend/lib/api.ts` oluştur: `assist(message)`, `getPrograms()`, vb.
- API tabanı: `NEXT_PUBLIC_API_BASE` (örn. `http://localhost:8000`). `.env.local`'a ekle.
- CORS hazır: backend `http://localhost:3000`'e izin veriyor (`backend/core/config.py`, `CORS_ORIGINS`).

### Adım 2 — Adaptör yaz (kritik nokta)
Backend ve frontend tipleri **farklı**; bir eşleme katmanı gerekiyor:
`frontend/lib/adapter.ts` → backend `SupportProgram` + `EligibilityResult` → frontend `Program`.

Eşleşen alanlar (çeviri gerekmez):
- `EligibilityResult.state` (`full|partial|locked`) = frontend `Elig.state`
- `conditions[].state` (`met|action|unmet`) = frontend `Condition.state`

Çevrilmesi gerekenler:
- **kategori**: backend tam ad → frontend slug
  - "Kamu Destekleri" → `kamu`
  - "Özel Sektör Bulut ve Yazılım Kredileri" → `bulut`
  - "Hızlandırıcı ve Kuluçka Merkezleri" → `hizlandirici`
  - "Vergi ve Lokasyon Teşvikleri" → `vergi`
  - "Yatırım Kaynakları" → `yatirim`
  - "Yarışmalar ve Etkinlikler" → `yarisma`
  - "Global Programlar" → `global`
- **tutar**: backend `tutar_min`/`tutar_max` + `para_birimi` → frontend `amountText`/`curCode`/`hasAmount`
- **icon**: kategoriye göre türet (mevcut `viewmodel.ts` mantığı)
- **org/name/status/deadline**: backend `kurum`/`program_adi`/`başvuru_durumu`/`son_basvuru`

### Adım 3 — Chat'i bağla (`frontend/app/page.tsx`)
- `onSend` içindeki scripted dallanmayı (`respondProfile`/`respondCloud`/`respondBigg`) kaldır.
- Kullanıcı mesajını `assist(message)`'a gönder → `AssistResult` al.
- `AssistResult.profile` → profil chip'leri; `matches[]` → program kartları + uygunluk; `reply` → asistan mesajı.

### Adım 4 — Detay/Uygunluk/Başvuru ekranları
- Detay & Uygunluk: `matches[].eligibility` zaten `elig`/`conditions` şeklinde.
- Başvuru ekranı: `POST /api/application` → `ApplicationDraft` (`plan_sections` → iş planı, `documents` → belge listesi, `auto` → "Gravio hazırladı").

---

## Yanıt şekilleri (referans)

```
UserProfile      { sector, city, team_size, company_exists, company_age_years,
                   women_entrepreneur, student, in_technopark, goals[], summary }
EligibilityResult{ state: full|partial|locked, score:0-100, label,
                   conditions: [{state: met|action|unmet, text, value, hint?}], summary }
ApplicationDraft { program_name, plan_title,
                   plan_sections: [{heading, body}],
                   documents: [{label, auto, note?}] }
AssistResult     { profile: UserProfile,
                   matches: [{program: SupportProgram, eligibility: EligibilityResult}],
                   reply: string }
SupportProgram   # TÜRKÇE anahtarlar: id, kategori, program_adi, kurum, destek_türü,
                 # tutar_min, tutar_max, para_birimi, başvuru_durumu, son_basvuru,
                 # başvuru_linki, açıklama, hedef_kitle, sektör, şehir, ... (25 alan)
```

---

## Çalıştırma

**Backend** (proje kökünden — `backend.main` paketi olarak):
```bash
source backend/.venv/bin/activate
uvicorn backend.main:app --reload          # http://localhost:8000
```
Gerekli `backend/.env`: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `CONNECTION_URL`.
Veri yükleme (gerekirse): `python -m backend.scripts.ingest`.

**Frontend:**
```bash
cd frontend && npm install && npm run dev   # http://localhost:3000
```

---

## Kurallar (bootcamp)
- **main / develop'a doğrudan commit yok.** `feat_*` dalı aç → PR → develop'a merge.
- **Commit mesajlarında AI/araç ismi geçmesin** (bootcamp katkı takibi).
- Kullanıcıya dönük metinler ve kod yorumları **Türkçe**.
- Yeni ajan = `backend/agents/base.py` desenini izle (`Agent` + `_extract`/`_complete`).

## İleride (opsiyonel)
- **Hafıza (Memory)** ajanı: profil + konuşma durumu (oturum boyu).
- Orkestratörü **niyet-yönlendirmeli** yap (LLM hangi ajanı çağıracağına karar verir); `Orchestrator.run()` arayüzü sabit kalır.
- Gerçek veri: veri ekibi JSON verince `data/programs/`'a ekle + `ingest` çalıştır; embedding alanları (`data/repo.py: program_embedding_text`) gözden geçirilebilir.
