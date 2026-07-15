# GravioAI / Destekçi — Veri Pipeline Mimari Dokümanı

Bu doküman, `backend/` altındaki veri toplama → LLM analizi → embedding → Supabase pipeline'ının nasıl çalıştığını, hangi dosyanın/sınıfın/fonksiyonun ne işe yaradığını anlatır.

---

## 1. Genel Bakış

Sistem, devlet kurumlarının (KOSGEB, TÜBİTAK, Kalkınma Ajansları) web sitelerinden girişimcilik destek programlarını toplar, bir LLM (Gemini) ile yapılandırılmış veriye çevirir, embedding üretir ve Supabase'e (pgvector ile) yazar. Amaç, RAG (Retrieval-Augmented Generation) tabanlı bir soru-cevap/eşleştirme sistemine veri sağlamak.

**Uçtan uca akış:**

```
1. scripts/scrape.py çalıştırılır
2. Her connector (KOSGEB, Kalkınma Ajansı, TÜBİTAK) kendi kaynağından veri çeker
3. Ham veri temizlenir, LLM'e gönderilir, yapılandırılmış veriye (Pydantic model) çevrilir
4. Sonuç, taslak bir JSON dosyasına yazılır (staging — insan onayı için ara adım)

5. scripts/ingest.py çalıştırılır
6. Taslak JSON okunur, her program için kısa bir özet metin oluşturulur
7. Bu metin embedding'e (768 boyutlu vektör) çevrilir
8. Program + embedding, Supabase'deki programs_v2 tablosuna yazılır (upsert)
```

**Temel mimari prensipler:**
- **Dependency Injection**: Connector'lar fetcher/LLM client'ı kendileri oluşturmaz, dışarıdan alır.
- **ABC + Factory deseni**: Hem LLM hem embedding katmanı, soyut arayüz + somut uygulama + factory üçlüsüyle kurulu. Sağlayıcı (örn. Gemini) değişirse, çağıran kod değişmez.
- **Human-in-the-loop**: Veri asla doğrudan DB'ye yazılmaz, önce taslak JSON'a yazılır.
- **Kod İngilizce, veri Türkçe**: Python alan adları İngilizce; JSON ve Pydantic `alias`'lar Türkçe (LLM'in Türkçe eş anlamlıları yakalaması için).

---

## 2. `connectors/` — Kurum-özel veri çekiciler

Her kurum için bir connector var. Hepsi `BaseConnector`'dan türer ve ortak bir sözleşmeye uyar.

### `base.py`

- **`BaseConnector` (ABC)** — tüm connector'ların temel sınıfı.
  - `fetch() -> list[dict]` *(abstract)* — her connector'ın kendi implement ettiği, veri çekme ana metodu.
  - `clean(raw_html) -> str` — HTML'i `core/cleaner.py` ile temiz metne çevirir.
  - `is_relevant(text, title) -> bool` — girişimcilik odaklı mı kontrolü (`relevance_keywords` listesine göre). **Şu an tüm connector'larda geçici olarak kapalı** (yorum satırında) — amaç, filtreleri doğru kalibre etmeden önce tüm veriyi toplayıp gözlemlemek.
  - `generate_id(text) -> str` — Türkçe karakterleri (İ, ş, ğ vb.) güvenli şekilde ASCII'ye çevirip URL/DB dostu bir slug üretir (`core/constants.py`'deki `TURKCE_KARAKTER_DEGISIMLERI` kullanılır).
  - `format_to_db(extracted_info, url, raw_text, source_name, region_override=None) -> dict` — LLM çıktısını veritabanı satırına dönüştüren ana fonksiyon:
    - `program_id` slug'ını üretir.
    - `deadline`'ı standart `YYYY-MM-DD` formatına çevirir (`_normalize_deadline`).
    - `source` alanını, LLM'in tahminine değil, **connector'ın kendi bildiği sabit kurum adına** (`source_name`) göre yazar (tutarlılık için).
    - `region` alanını, varsa `region_override` (örn. Kalkınma Ajansı'nın kod→isim eşlemesi) ile, yoksa "Ulusal" varsayılanıyla doldurur.
    - Boş kalan bazı text alanlarını (`deadline`, `founded_after`, `support_rate`, `official_url`) anlamlı Türkçe mesajlarla doldurur (`core/constants.py`'deki `BOS_ALAN_MESAJLARI`).
- **`_normalize_deadline(raw)`** — Farklı kaynaklardan gelen tarih formatlarını (İngilizce ay adı, Türkçe kısaltma, ISO) `YYYY-MM-DD`'ye çevirir.

### `manager.py`

- **`ConnectorManager`** — kayıtlı connector'ları sırayla çalıştıran, hata izolasyonu sağlayan sınıf.
  - `register(connector)` — yeni bir connector ekler.
  - `run_all() -> list[dict]` — tüm connector'ları sırayla çalıştırır; biri hata verirse diğerlerini etkilemez (hata izolasyonu).

### `kosgeb.py`

- **`KOSGEBConnector`** — KOSGEB'in destek listesi sayfasını tarar, her programın detay sayfasını indirir, LLM'e gönderir.
- Ana liste sayfasından linkleri toplar (`fetcher.fetch_links`), her linkin detay sayfasını okur, temizler, LLM'den `ExtractedSupportInfo` alır, `format_to_db(..., source_name="KOSGEB")` ile kaydeder.

### `kalkinma_ajansi.py`

- **`KalkinmaAjansiConnector`** — Kalkınma Ajansları'nın JSON API'sini (`ka.gov.tr/api/supports`) sayfa sayfa tarar.
- Her ilan için `redirect_url` üzerinden detay sayfasını indirir (bu, gerçek bir HTTP yönlendirmesi — `core/fetcher.py`'de `follow_redirects=True` olması **kritik**, yoksa hata verir).
- API'nin verdiği `agency_code`'u (örn. `"trakyaka"`), `core/constants.py`'deki `KALKINMA_AJANSI_ISIMLERI` sözlüğü ile okunaklı ajans ismine (`"Trakya Kalkınma Ajansı"`) çevirip `region_override` olarak `format_to_db`'ye geçirir.
- Sunucuyu yormamak için istekler arasına bekleme (`REQUEST_DELAY`) ve her 15 istekte bir ekstra mola (`BATCH_SIZE`, `BATCH_PAUSE`) eklenmiştir.
- **`MAX_TEST_ITEMS`** — şu an geçici bir test limiti var (az sayıda kayıtla test etmek için); tam çalıştırmadan önce kaldırılmalı.

### `tubitak.py`

- **`TubitakConnector`** — TÜBİTAK'ın `/tr/acik-cagrilar` (açık çağrılar) sayfasını tarar.
- **Not**: TÜBİTAK'ın gerçek yapısı çok daha kapsamlı — 5 ayrı kategori sayfası (Akademik, Sanayi, Bilim-Toplum, Uluslararası İş Birlikleri, Bilimsel Etkinlik) ve PDF dosyaları var. Şu anki connector sadece tek bir liste sayfasını tarıyor; **bu, ayrı bir iterasyonda genişletilecek** (bkz. "Sonraki Adımlar").

---

## 3. `core/` — Bağımsız araçlar

### `fetcher.py`

- **`BaseFetcher` (ABC)** / **`HttpFetcher`** — HTTP üzerinden veri çeken sınıflar.
  - `fetch_text(url) -> str` — sayfanın ham HTML/metnini indirir. `httpx` ile, `timeout=30sn`, `retry` (3 deneme, artan bekleme), **`follow_redirects=True`** (kritik — bazı API'ler yönlendirme kullanıyor).
  - `fetch_links(url, filter_pattern) -> set` — sayfadaki linkleri belirli bir kalıba göre filtreleyip döner.

### `cleaner.py`

- HTML'den, sayfa gürültüsünü (menü, erişilebilirlik araçları vb. `forbidden_terms`) ayıklayarak düz metin çıkarır.

### `config.py`

- **`Settings`** (pydantic-settings) — `.env` dosyasından API anahtarlarını, model isimlerini, Supabase bilgilerini okur. `llm_provider`, `llm_model`, `embedding_provider`, `embedding_model`, `supabase_url`, `supabase_key` gibi alanlar burada.

### `constants.py`

Connector'lar arasında paylaşılan sabit veri listeleri (`base.py`'nin sade kalması için ayrı tutuluyor):
- `AY_KISALTMALARI` — ay isimlerini sayıya çeviren sözlük (deadline normalize için).
- `BOS_ALAN_MESAJLARI` — boş alanlara yazılacak Türkçe mesajlar.
- `TURKCE_KARAKTER_DEGISIMLERI` — slug üretimi için Türkçe karakter dönüşümleri.
- `KALKINMA_AJANSI_ISIMLERI` — 26 kalkınma ajansının kod→tam isim eşlemesi.

### `llm/` — LLM katmanı

- **`base.py`**: `LLMClient` (ABC) — `chat()` ve `extract_program_details()` sözleşmesi.
- **`gemini_client.py`**: `GeminiClient` — Gemini uygulaması. `extract_program_details`, ham metni alıp `ExtractedSupportInfo` şemasına göre yapılandırılmış veri döner; `retry` + `reraise=True` ile ağ hatalarına dayanıklı.
- **`factory.py`**: `get_llm_client()` — config'e göre (`LLM_PROVIDER`) doğru sağlayıcıyı seçer.

### `embedding.py` — Embedding katmanı

- **`EmbeddingClient` (ABC)** — `embed_text(text) -> list[float]` sözleşmesi.
- **`GeminiEmbeddingClient`** — Gemini'nin embedding API'sini kullanan uygulama (768 boyutlu vektör üretir).
- **`build_embedding_client()` / `get_embedding_client()`** — config'e göre doğru embedding sağlayıcısını üretir (LLM katmanıyla aynı desen, tek dosyada — çünkü şu an tek sağlayıcı var).

---

## 4. `models/` — Pydantic şablonları

### `program.py`

- **`SupportType`, `ApplicationStatus`, `Currency`** — sabit seçenekli enum'lar.
- **`ExtractedSupportInfo`** — LLM'in dolduracağı ana model. Alanlar: `title`, `category` (`Category` enum, LLM'in serbest yazdığı metni sabit kategoriye eşleyen bir `field_validator` ile normalize edilir), `source`, `support_type`, `amount_min/max`, `currency`, `support_rate`, `application_status`, `region`, `founded_after`, `deadline`, `official_url`, `conditions_summary`, `women_entrepreneur`, `technopark`, `company_required`, `student`. Her alanın Türkçe bir `alias`'ı ve LLM'e yönelik açıklayıcı bir `description`'ı var.
  - Validator'lar: `_coerce_bool` (evet/hayır → True/False), `_normalize_currency` (TL→TRY), `_parse_amount` (Türkçe binlik ayraç → float), `_normalize_category` (serbest metni `Category` enum'una eşler, eşleşmezse `None`).
- **`SupportProgram`** *(eskiden `SupportProgramDB`)* — `ExtractedSupportInfo`'dan türer, ek olarak `program_id`, `source_url`, `body_chunk`, `chunk_index` (varsayılan 0), `embedding` alanlarını taşır. **Bu, veritabanına yazılan nihai model.**

### `taxonomy.py`

- **`Category`** enum — 7 sabit kategori (Kamu Destekleri, Vergi ve Lokasyon Teşvikleri, vb.)
- `SUBCATEGORIES` sözlüğü artık kullanılmadığı için (subcategory alanı kaldırıldığı için) yorum satırına alındı, silinmedi.

---

## 5. `data/` — Veri erişim katmanı

### `loader.py`

- `load_programs() -> list[SupportProgram]` — `data/programs/*.json` altındaki tüm taslak dosyalarını okuyup Pydantic modeline doğrular.

### `repo.py`

- `program_embedding_text(p) -> str` — embedding'e girecek **kısa, anlamsal** metni oluşturur: `title + source + category` + (varsa) kadın girişimci/teknopark/öğrenci şartlarının doğal dil karşılıkları. **`body_chunk` (ham metin) bilerek embedding'e girmiyor** — hem token limiti riskini önlemek hem embedding kalitesini yüksek tutmak için.
- `_to_row(p, embedding) -> dict` — modeli DB satırına çevirir.
- `upsert_programs(rows) -> int` — `on_conflict="program_id"` ile toplu upsert (varsa güncelle, yoksa ekle).
- `get_programs`, `get_program`, `match_programs` — okuma/vektör arama fonksiyonları (RAG tarafı için, henüz aktif kullanılmıyor).

### `programs/`

- Taslak JSON dosyalarının durduğu staging klasörü. Her kurum kendi dosyasına yazar: `kosgeb_taslak.json`, `kalkinma_taslak.json`, `tubitak_taslak.json`.

---

## 6. `scripts/` — Giriş noktaları

### `scrape.py`

- Komut satırından hangi kurum(lar)ın çalışacağı seçilebilir:
  ```
  python -m scripts.scrape                  # hepsini çalıştırır
  python -m scripts.scrape kalkinma          # sadece Kalkınma Ajansı
  python -m scripts.scrape kosgeb tubitak    # birden fazla kurum
  ```
- Her kurum kendi `ConnectorManager`'ında, tek başına çalıştırılıp kendi taslak dosyasına yazılır — bir kurumu tekrar çalıştırmak diğerlerinin verisini silmez.

### `ingest.py`

- Akış: taslak JSON'ları oku → her program için embedding metni oluştur → embed et → aynı `program_id`'ye sahip satırları tekilleştir (filtreler kapalıyken bazı linkler aynı slug'ı üretebiliyor) → Supabase'e toplu yaz.

---

## 7. Supabase Şeması (`programs_v2`)

```sql
program_id (unique), body_chunk, chunk_index, embedding (vector 768),
title, source, category, support_type, amount_min, amount_max, currency,
support_rate, application_status, region, founded_after, deadline,
women_entrepreneur, technopark, company_required, student,
official_url, conditions_summary, last_updated
```

Eski `programs` tablosu (TÜBİTAK'a özel eski şema) veri kaybı riski almamak için korunuyor, silinmedi.

---

## 8. Önemli Tasarım Kararları (özet)

- **Tek ortak şema**: KOSGEB ve TÜBİTAK için ayrı gelişen iki şema (Pydantic model + eski Supabase tablosu) RAG ihtiyaçlarına göre birleştirildi.
- **`source`/`region` güvenilirliği**: Bu alanlar artık LLM'in tahminine değil, connector'ın kendi bildiği/API'den gelen kesin bilgiye göre dolduruluyor (LLM'in aynı kurumu 6 farklı şekilde yazdığı tespit edildikten sonra).
- **Embedding kısa/öz tutuluyor**: Chunklama yok, `body_chunk` sadece referans olarak saklanıyor, embedding'e girmiyor.
- **Erken filtreleme prensibi**: Pahalı işlemler (detay sayfası indirme, LLM çağrısı) öncesinde, mümkünse ücretsiz sinyallerle (başlık, tarih, URL kalıbı) eleme yapılır.
- **Girişimcilik filtreleri geçici olarak kapalı**: Doğru kriterleri belirlemek için önce tüm veri toplanıp gözlemleniyor.

---

## 9. Sonraki Adımlar

1. **TÜBİTAK yi connectörü tamamlamak**

2. **Hiyerarşik RAG için şema**: "Bu programın başvuru formunda hangi belgeler isteniyor" gibi detay soruları cevaplayabilmek için, özet tablosundan (`programs_v2`) ayrı bir `program_chunks` tablosu (program_id, chunk_index, chunk_text, embedding) ve chunklama stratejisi tasarlanacak.
3. Girişimcilik filtrelerini, toplanan gerçek veriye bakarak yeniden kalibre etmek.
4. `match_programs` RPC fonksiyonunu yazıp gerçek arama/RAG akışını test etmek.
