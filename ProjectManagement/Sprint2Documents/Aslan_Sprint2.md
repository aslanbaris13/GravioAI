# Sprint 2 İlerleme Notları — Barış Aslan

Bu dosya, Sprint 2 kapsamında yaptığım işlerin **ne, neden, nasıl** yapıldığını kayıt altına almak için tutuluyor. Kronolojik olarak güncelleniyor.

---

## 2026-07-13 — Hatice'nin son işlerinin değerlendirilmesi

**Ne yaptım**: Hatice'nin `feature/connector-layer` ve `haticenurolgun-patch-1..5` dallarındaki son 13 commitini inceledim (KOSGEB/TÜBİTAK/Kalkınma Ajansı veri toplama pipeline'ı + README/Sprint güncellemeleri).

**Neden**: Ekip içi kod gözden geçirme — pipeline develop'a merge edilmeden önce mimari kaliteyi ve eksikleri tespit etmek.

**Sonuç**: Genel mimari (DI, hata izolasyonu, template method) sağlam. 5 somut geliştirme notu iletildi: `db/schema.sql` güncel değil (yeni tablolar kodda var ama SQL dosyasında yok), `gemini_client.py`'de her çağrıda koşulsuz 1sn bekleme, `is_relevant` filtresinin bilinçli kapalı bırakılması için takip notu gerekiyor, `_CHİLD` değişkeninde kazara Türkçe unicode karakter, ve pipeline için hiç test yazılmamış olması.

---

## 2026-07-13 — Kendi görevlerimin planlanması (SCRUM-22, SCRUM-23, SCRUM-96)

**Ne yaptım**: Jira'daki üç bileti (Chat flow, Chat interface UI, Planner/orchestrator agent) mevcut kodla (`backend/agents/orchestrator.py`, `frontend/components/ChatView.tsx`, `frontend/app/page.tsx`) karşılaştırdım ve 4 fazlı bir geliştirme planı çıkardım:

- **Faz 1** — Akış tasarımı (SCRUM-22: kullanıcı akışı, wireframe, prompt akışı)
- **Faz 2** — Orchestrator'a intent classification + agent routing + loglama (SCRUM-96)
- **Faz 3** — Chat UI'ın responsive hale getirilmesi (SCRUM-23 / SCRUM-173)
- **Faz 4** — Entegrasyon, uçtan uca test, kapanış

**Neden**: Orchestrator şu an sabit bir zincir çalıştırıyor (her mesajda profil→eşleştirme→uygunluk→yanıt, niyet ayrımı yok). Kodlamaya girmeden önce niyet sınıflarını ve akışı netleştirmek, hem SCRUM-96'nın hem SCRUM-173'ün üzerine kodlanacağı sağlam bir temel oluşturuyor.

---

## 2026-07-13 — Faz 1: Chat flow tasarımı (SCRUM-174, 175, 176)

**Ne yaptım**: `feat_chat_flow_design` dalını `develop`'tan açtım (önce `origin/develop`'u senkronladım — Hatice'nin son README/sprint commitleri geldi). `docs/chat-flow/` altında üç doküman yazdım:

1. `01-kullanici-akisi.md` (SCRUM-174) — mevcut ekran akışı (sohbet→eşleşmeler→detay→uygunluk→başvuru, değişmiyor) + **yeni** niyet dallanması akışı (mermaid diyagram + 5 niyet sınıfının tablosu: greeting, off_topic, profile_info, program_question, apply_request).
2. `02-wireframe.md` (SCRUM-175) — her niyetin ekranda hangi UI bloklarını (profil çipi/kartlar/CTA/sadece metin) tetiklediğini düşük çözünürlüklü kutularla gösterdim; ayrıca SCRUM-173 için hedef mobil düzen ve önerilen kırılma noktası (768px) belirttim.
3. `03-prompt-akisi.md` (SCRUM-176) — intent classifier için Pydantic şema + system prompt taslağı, niyet→ajan zinciri eşleme tablosu, güven skoru düşükse `profile_info`'ya (bugünkü davranış) düşme mantığı, ve SCRUM-111 (flow logging) için loglanacak 4 nokta.

**Neden**: Bu üç doküman olmadan SCRUM-96'yı (intent classifier + routing) kodlamak, niyet sınıflarını kod yazarken rastgele belirlemek anlamına gelirdi. Önce tasarımı sabitleyip (özellikle "belirsiz durumda ne olur" kuralını), hem Faz 2 kodlamasının hem de ileride başka birinin bu kararları sorgulamasının önünü açtım.

**Nasıl karar verdim**: Var olan `Orchestrator.run()` imzasını ve `AssistResult` şemasını **değiştirmeden** dallanma ekleme yaklaşımını seçtim — böylece frontend (`lib/api.ts`, `adapter.ts`) hiç dokunulmadan Faz 2 tamamlanabilir. Tek istisna: `program_question` niyetinde profil olmadan uygunluk skorlanamayacağı için "unscored/Bilgi" rozeti gerekiyor — bunu adapter'a küçük bir ek olarak Faz 2'de not düştüm, şimdiden büyütmedim.

**Sıradaki adım**: Bu dokümanları gözden geçirip onaylamak, sonra Faz 2'ye (SCRUM-96: `agents/intent_classifier.py`, orchestrator'da dallanma, `logging` entegrasyonu) geçmek.

---

## 2026-07-14/15 — PR'lar, Supabase migration eksikliği ve şema geçişinin kırdıkları

**Ne yaptım** (özet, ayrıntılar Jira/PR'larda):
1. Faz 2 (SCRUM-96) ve Faz 3 (SCRUM-173) tamamlanıp PR #18/#19 olarak açıldı; Faz 1 PR #17 olarak açılıp merge edildi.
2. Daha önce hiç merge edilmemiş `feat_application_agent` dalı (PR #10) bulundu, çakışmaları çözülüp mergeable hale getirildi.
3. Gerçek backend + Gemini ile uçtan uca test sırasında Supabase'de `match_programs` RPC fonksiyonunun hiç var olmadığı (`PGRST202`) ortaya çıktı — bu, ilk Hatice review'ünde işaretlediğim "schema.sql güncel değil" notunun canlıda patlamış hali. Barış, eski `db/schema.sql`'i (o an `programs` tablosunu hedefleyen) Supabase dashboard'undan uyguladı; fonksiyon çalışır hale geldi ama artık **yanlış** (eski) tabloyu hedefliyordu.

**Barış'ın talimatı**: "Hatice'ninkini uygulayacağız ve developu en güncel haline getirmeliyiz" — yani Hatice'nin `feature/connector-layer` dalını (PR #16) develop'a merge edip her şeyi buna göre senkronlamak.

**Ne oldu (PR #16 merge sonrası)**: PR #16 git seviyesinde çakışmasız merge oldu (mergeable), ama Hatice'nin `SupportProgram` modelini yeniden adlandırması (`program_name`→`title`, `institution`→`source`, `sector`/`city`/`min_employees`/`max_employees`/`age_limit`/`description`/`target_audience` tamamen kaldırıldı) git tarafından "çakışma" olarak görülmedi (aynı satırlara dokunulmadı) ama **çalışma zamanında** şunları kırdı:

- `agents/eligibility.py::_program_brief` — artık var olmayan alanları okuyordu
- `agents/matching.py` — Hatice'nin `core/embedding/` klasörünü `core/embedder.py`'de birleştirmesinden sonra artık var olmayan bir modülü import ediyordu
- `core/llm/base.py`, `core/llm/gemini_client.py`, `core/embedder.py`, `data/repo.py` — Hatice'nin connector/script kodu `cd backend && python -m ...` şeklinde çalıştırılmak üzere **mutlak** import (`from models...`, `from core...`) kullanıyor; ama canlı FastAPI uygulaması her şeyi `backend` paketi olarak root'tan import ediyor — bu yüzden mutlak importlar canlı uygulamada `ModuleNotFoundError` veriyordu
- `core/llm/base.py`'deki `LLMClient` arayüzüne eklenen yeni `extract_program_details` **abstract** metodu, onu implemente etmeyen `AnthropicClient`'ı ve test mock'larını da kırmıştı
- `requirements.txt` hiç güncellenmemiş — `langchain-experimental`, `langchain-google-genai`, `langchain-text-splitters`, `beautifulsoup4`, `tenacity` bağımlılıkları kodda var ama dosyada yoktu
- `frontend/lib/adapter.ts` + `api.ts` — backend'in artık göndermediği eski alan adlarını (`program_name`, `institution`, `application_deadline`, `official_source`/`application_link`, `description`) okumaya çalışıyordu
- `db/schema.sql` — Hatice'nin `repo.py`'si `programs_v2`/`program_parents`/`program_chunks` tablolarını hedefliyordu ama şema dosyası hâlâ eski düz `programs` tablosunu tanımlıyordu (bu yüzden Barış'ın uyguladığı ilk düzeltme yanlış tabloyu hedefliyordu)

**Nasıl düzelttim**: `fix_schema_migration_breakage` dalını `develop`'tan açtım, yukarıdaki her kırığı tek tek düzelttim (alan adlarını yeni şemaya taşıdım, mutlak importları relative'e çevirdim, `extract_program_details`'i abstract olmaktan çıkarıp varsayılan `NotImplementedError` verecek şekilde yumuşattım, `requirements.txt`'i tamamladım, `db/schema.sql`'e eski `programs` tablosunu **silmeden** yeni `programs_v2` + `program_parents` + `program_chunks` tablolarını ve `match_programs` fonksiyonunun `programs_v2`'yi hedefleyen yeni sürümünü ekledim). Ayrıca bu dala `feat_application_agent`'ı (PR #10) da birleştirdim çünkü `routes.py`'nin `ApplicationDraft` ihtiyacı zaten oradan geliyordu ve `ApplicationAgent` kodu (`_profile_brief`/`_program_brief`'i yeniden kullandığı için) şema değişikliğinden etkilenmiyordu.

**Doğrulama**: 8 test yeşil, `tsc --noEmit` temiz, backend gerçekten ayağa kalktı (`/health`, `/api/health` 200). `/api/programs` (programs_v2'yi doğrudan okuyan) hâlâ 500 veriyor çünkü **yeni schema.sql bölümü henüz Supabase'e uygulanmadı** — bu sıradaki adım.

**Ders**: Pydantic model alan adı değişiklikleri git için "çakışma" değildir (farklı satırlar), ama çalışma zamanı için tam bir kırılmadır. Büyük bir şema/model refactor'u merge etmeden önce, o modeli tüketen HER dosyayı (agents, repo, frontend adapter, testler) taramak gerekiyor — sadece `git merge`'in "temiz" demesine güvenmemeli.

**Sıradaki adım**: Barış'tan güncellenmiş `db/schema.sql`'i (programs_v2 + program_parents + program_chunks + yeni match_programs) Supabase'e uygulamasını istedim. Uygulandıktan sonra gerçek `/api/assist` ve `/api/match` ile tam uçtan uca doğrulama yapılacak, sonra bu hotfix develop'a PR'lanacak, ardından PR #18/#19/#10 yeni develop'a göre güncellenip (alan adı düzeltmeleri dahil) sırayla merge edilecek.
