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

## 2026-07-13 — Faz 2: Orchestrator'a intent classification + routing + loglama (SCRUM-96)

**Ne yaptım**: `feat_planner_orchestrator` dalını (`feat_chat_flow_design`'ı içine alarak) açtım ve `03-prompt-akisi.md`'de tasarlanan niyet dallanmasını kodladım:

1. `backend/models/intent.py` — yeni `Intent` enum'u (greeting, off_topic, profile_info, program_question, apply_request) ve `IntentResult` (intent + confidence) modeli.
2. `backend/agents/intent_classifier.py` (SCRUM-107) — var olan `Agent` temelini kullanan yeni bir ajan; `_extract` ile yapılandırılmış niyet çıkarır. Confidence `0.55` eşiğinin altındaysa `profile_info`'ya düşer (güvenli varsayılan, bugüne kadarki davranışla aynı).
3. `backend/agents/orchestrator.py` (SCRUM-108/109/110) — `run()` artık önce niyeti sınıflandırıyor, sonra üç zincirden birine dallanıyor:
   - `greeting`/`off_topic` → hiç ajan çalıştırmadan (profil/eşleştirme/uygunluk yok) kısa LLM yanıtı — maliyeti düşürmek için asıl amaç buydu.
   - `program_question` → `ProfileExtractor` atlanır, mesaj metni doğrudan eşleştirme sorgusu olarak kullanılır (`UserProfile(summary=message)`), sonra uygunluk + yanıt.
   - `profile_info`/`apply_request`/belirsiz → tam zincir, **birebir eskisiyle aynı davranış**.
   `Orchestrator.run()` imzası ve `AssistResult` şeması değişmedi; frontend'e dokunmadım.
4. Loglama (SCRUM-111) — `logging` ile 4 nokta: `intent_classified`, `chain_selected`, `chain_completed` (süreyle), `chain_failed`/`intent_classification_failed` (hata durumunda). `backend/main.py`'a `logging.basicConfig` eklendi (öncesinde backend'de hiç yapılandırılmış logging yoktu, sadece print vardı).

**Neden**: Sabit zincir, "merhaba" gibi mesajlarda bile tam RAG + 3 uygunluk LLM çağrısı yapıyordu — hem maliyetli hem gereksiz gecikme. `program_question`'da da kullanıcı henüz profilini vermeden tam profil çıkarma adımını zorlamak anlamsızdı.

**Nasıl doğruladım**: Backend'de kurulu bağımlılık olmadığı için `/tmp/gravio_venv` adında geçici bir venv kurup `requirements.txt`'i kurdum. Gerçek LLM çağrısı yapmadan (MockLLMClient / patch.object ile ajanları sahteleyerek):
- Mevcut 8 testin hâlâ geçtiğini doğruladım (regresyon yok).
- `backend/tests/test_intent_classifier.py` (3 test) — yüksek/düşük güven davranışı, geçmişin prompt'a eklenmesi.
- `backend/tests/test_orchestrator_routing.py` (4 test) — greeting'de agent zincirinin hiç çağrılmadığı, program_question'da ProfileExtractor'ın atlandığı ve eşleştirmenin mesaj metniyle yapıldığı, profile_info'da tam zincirin değişmediği, sınıflandırıcı çökse bile kullanıcının yanıtsız kalmadığı.
- Toplam 15 test yeşil.

**Bilinçli kapsam dışı bıraktığım**: `apply_request` niyetini ayrı bir "doğrudan başvuru taslağı" zincirine bağlamadım — hangi programa başvurulacağını mesajdan çıkarmak SCRUM-96'nın kapsamını aşıyordu (frontend zaten CTA/followup ile ayrı `/application` uç noktasını tetikliyor). Şimdilik `profile_info` ile aynı tam zinciri çalıştırıyor; ileride ayrı bir zincir gerekirse bu not referans alınabilir.

**Sıradaki adım**: Bu değişiklikleri gözden geçirip commit/PR'a hazırlamak, sonra Faz 3'e (SCRUM-23/173: chat arayüzünü responsive yapmak) geçmek.

---

## 2026-07-14 — Faz 3: Chat arayüzünü responsive yapmak (SCRUM-173)

**Ne yaptım**: `feat_chat_responsive` dalını (`feat_planner_orchestrator`'ı içine alarak) açtım. `02-wireframe.md`'de önerilen 768px kırılma noktasını uyguladım:

1. `frontend/app/globals.css` — `768px` altında geçerli responsive kurallar: sidebar sabit-genişlikli off-canvas panele dönüyor (`transform: translateX(-100%)` / `sidebar-open` sınıfıyla `translateX(0)`), yarı saydam bir backdrop, öneri kartları grid'i tek sütuna düşüyor, sohbet içeriğinin yatay boşluğu daralıyor.
2. `frontend/components/Sidebar.tsx` — `open` prop'u eklendi, `className="sidebar"` ile CSS'e bağlandı.
3. `frontend/app/page.tsx` — mobilde görünen sabit bir hamburger butonu + backdrop eklendi; `sidebarOpen` state'i; herhangi bir nav aksiyonunda (yeni sohbet/sohbet/eşleşmeler/panelim) sidebar otomatik kapanıyor.
4. `frontend/components/ChatView.tsx` — header/scroll alanı/öneri grid'ine hedefli class'lar eklendi (mevcut inline style'lara dokunmadan, sadece breakpoint'e özgü üç-dört CSS kuralı için).
5. Global hamburger tüm ekranlarda (Eşleşmeler/Detay/Uygunluk/Başvuru/Panelim) göründüğü için, bu ekranların ortak `data-screen-label` örüntüsünden yararlanıp `[data-screen-label] > div:first-child` seçiciyle tek bir CSS kuralıyla üstten boşluk ekledim — böylece başlıklar hamburger'la çakışmıyor, 5 ayrı dosyaya dokunmadan.

**Neden**: `ChatView.tsx` tamamen sabit piksel inline style kullanıyordu; sidebar da masaüstünde akışa dahil sabit 256px genişlikte. 375px'lik bir mobil ekranda bu, sohbete ~119px alan bırakıyordu — kullanılamaz durumdaydı.

**Nasıl doğruladım**: Next.js dev sunucusunu tarayıcı önizlemesinde çalıştırıp:
- 375px (mobil), 768px (tablet sınırı) ve masaüstü genişliklerinde ekran görüntüsü aldım.
- Hamburger'a tıklayıp sidebar'ın kayarak açıldığını, backdrop'un göründüğünü doğruladım.
- Backdrop'a tıklayıp kapandığını, bir nav öğesine (Eşleşmelerim) tıklayınca hem view'ın değiştiğini hem sidebar'ın otomatik kapandığını doğruladım.
- Masaüstünde sidebar'ın eskisi gibi akışta sabit kaldığını, hamburger'ın görünmediğini doğruladım (regresyon yok).
- `npx tsc --noEmit` ile tip hatası olmadığını doğruladım.
- Not: Test sırasında ekran görüntüsü koordinatlarını `devicePixelRatio` (2x) hesaba katmadan yanlış yorumlayıp birkaç kez yanlış yere tıkladım (ör. hamburger yerine boşluğa) — kod hatası değildi, kendi ölçüm hatamdı; JS ile gerçek `getBoundingClientRect()` alarak doğruladım.

**Bilinçli kapsam dışı bıraktığım**: Diğer görünümlerin (Eşleşmeler/Detay/Uygunluk/Başvuru/Panelim) kendi iç düzenleri (ör. MatchesView'daki 3 sütunlu istatistik kartları mobilde taşıyor) responsive değil. SCRUM-173 özellikle "Chat interface UI" kapsamındaydı; sidebar/hamburger çakışmasını gidermek zorunluydu (paylaşılan global öğe olduğu için) ama her ekranın kendi iç grid'ini düzeltmek ayrı bir iş — ileride ayrı bir ticket olarak ele alınmalı.

**Sıradaki adım**: Faz 4 — entegrasyon/kapanış: üç dalı (chat_flow_design, planner_orchestrator, chat_responsive) sırayla develop'a PR'lamak, uçtan uca (gerçek backend ile) test etmek.

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

---

## 2026-07-15 — Migration uygulandı, iki bug daha bulundu, tam doğrulama

**Ne oldu**: Barış güncel `db/schema.sql`'i Supabase'e uyguladı. `/api/programs`'ı tekrar denedim, iki yeni (ayrı) hata çıktı:

1. **`_from_row` embedding alanında patlıyordu**: Supabase'in gerçek verisi (Hatice'nin ingest ettiği KOSGEB/TÜBİTAK programları) döndü ama `embedding` alanı `list[float]` değil düz metin ("[-0.001,...]") olarak geliyordu — pgvector kolonlarının PostgREST üzerinden JSON listesi değil metin olarak serileştirilmesinden kaynaklanıyor (bilinen bir davranış). **Düzeltme**: `repo.py::_from_row`, response'tan `embedding` alanını atıyor artık (zaten API tüketicileri kullanmıyor, 768 boyutlu veriyi taşımanın da anlamı yok).

2. **Daha kritik bir keşif**: Bunu düzeltince veri döndü ama JSON anahtarları Türkçeydi (`program_adi`, `kurum`, `kategori`...) — İngilizce (`title`, `source`, `category`) değil. Sebep: FastAPI'nin `response_model_by_alias` varsayılanı `True`; `SupportProgram`/`ExtractedSupportInfo` modelinde Türkçe `alias`'lar tanımlı olduğu için API yanıtı otomatik olarak alias'ları kullanıyor. Bu, benim biraz önce düzelttiğim frontend adapter'ının (İngilizce alan adı bekleyen) tamamen boş/undefined veri almasına yol açacaktı — fark edilmeseydi sessizce kırılırdı. **Düzeltme**: `routes.py`'de `SupportProgram` döndüren 4 route'a (`/programs`, `/programs/{id}`, `/match`, `/assist`) `response_model_by_alias=False` eklendi.

**Neden önemli**: Bu, "kod İngilizce, veri Türkçe" tasarımının (Hatice'nin scraping/ingestion pipeline'ı için doğru bir seçim) FastAPI'nin HTTP katmanına da sızmasıydı — hâlbuki frontend hep İngilizce alan adı bekliyordu. Alias'lar sadece dosya/DB seviyesinde kalmalıydı, HTTP sözleşmesine karışmamalıydı.

**Tam doğrulama** (gerçek Gemini + gerçek Supabase, mock yok):
- `/api/programs` → gerçek KOSGEB/TÜBİTAK verisi, doğru (İngilizce) alan adlarıyla, hatasız
- `/api/match` (query: "Ar-Ge hibesi arayan yazılım girişimi") → gerçek embedding + gerçek pgvector araması, anlamlı sonuçlar (TÜBİTAK 1507, 1501, KOSGEB Teknoloji Merkezi)
- `/api/assist` → `gemini-3.5-flash`'ın o an Google tarafında genel bir "yüksek talep" (503) yaşaması nedeniyle 3 denemede de tamamlanamadı; bu bizim kodumuzla ilgisiz — chat-model'e bağlı olmayan iki uç (`/programs`, `/match`) zaten asıl düzeltmeyi (doğru şema + doğru serileştirme) kanıtladı.
- 8 backend testi + `tsc --noEmit` yeşil.

**Sıradaki adım**: Bu hotfix'i (`fix_schema_migration_breakage`) develop'a PR'lamak, sonra PR #18 (orchestrator, `program_name`/`institution` referanslarını düzeltmek gerekiyor), PR #19 (frontend, muhtemelen değişiklik gerekmiyor) ve PR #10'u (zaten bu dala alındı) yeni develop'a göre sırayla kapatmak.

---

## 2026-07-15 — Tüm dallar develop'a merge edildi

**Ne yaptım**: PR #20 (hotfix) develop'a merge edildi (PR #10 içeriği zaten onun içindeydi, GitHub otomatik "merged" işaretledi). Ardından `feat_planner_orchestrator`'a güncel develop'u alıp `orchestrator.py`'deki son iki eski alan adı referansını (`program_name`→`title`, `institution`→`source`) düzelttim, 15 test yeşil, PR #18 develop'a merge edildi. Son olarak `feat_chat_responsive`'e güncel develop'u aldım (sadece bu ilerleme dosyasında basit ard arda ekleme çakışması çıktı, kod tarafında çakışma yok — frontend zaten şema değişikliğinden PR #20'de düzeltilmişti).

**Sıradaki adım**: PR #19'u da develop'a merge edip Sprint 2'nin backend/entegrasyon kısmını kapatmak.

---

## 2026-07-15/16 — Uygulama geneli inceleme + Faz 1: oturum kalıcılığı

**Ne yaptım**: Barış'ın isteğiyle tüm uygulamayı (backend + frontend + veri pipeline'ı) baştan sona gözden geçirip bir Artifact raporu + fazlı geliştirme planı hazırladım. En kritik iki bulgu: (1) şema değişikliklerinin git tarafından yakalanmaması sorunu (bu sprint 3 kez yaşandı), (2) kalıcılık/hafızanın hiç olmaması — "Panelim" ekranı %100 hardcoded ("Nova AI Yazılım"), sayfa yenilenince profil/eşleşmeler kayboluyor.

Barış Faz 1'den (kalıcılık) başlamayı seçti, Supabase'de gerçek bir oturum tablosu ile (localStorage-only alternatifi yerine).

**Ne yaptım (uygulama)**:
1. `backend/models/session.py` — `SessionState` (profile + matches).
2. `backend/data/repo.py` — `save_session`/`get_session`, yeni `user_sessions` tablosu için.
3. `backend/db/schema.sql` — `user_sessions` tablosu (jsonb profile/matches, `updated_at` tetikleyicisi), eski tablolara dokunmadan eklendi.
4. `backend/api/routes.py` — `GET/PUT /api/session/{session_id}` uçları (`response_model_by_alias=False` ile — geçen seferki alias hatasını tekrarlamamak için).
5. `frontend/lib/session.ts` — `localStorage`'da üretilen `session_id` (auth yok, id fiilen bearer-token gibi davranıyor).
6. `frontend/lib/api.ts` + `adapter.ts` — `fetchSession`/`saveSession`/`adaptSessionState`.
7. `frontend/app/page.tsx` — açılışta oturumu geri yükleyen `useEffect` (varsa "Önceki oturumundan devam ediyorsun" notu + profil çipi + kartlar), her başarılı `/api/assist` sonrası `persistSession`, "Yeni sohbet"te oturumu da temizleme.
8. `frontend/components/DashboardView.tsx` — tamamen yeniden yazıldı: hardcoded `PROFILE_CHIPS`/`DEADLINES` kaldırıldı, gerçek `profile`/`programs` prop'larından hesaplanıyor, ikisi de boşsa dürüst bir boş durum gösteriyor.

**Bilinçli kapsam dışı bıraktığım**: Tam sohbet geçmişi (mesaj mesaj) kalıcılığı — sadece son profil + eşleşmeler saklanıyor. Kullanıcı sayfayı yenileyince önceki mesaj mesaj konuşmayı değil, "son bilinen durumu" (profil çipi + kartlar + kısa not) görüyor.

**Doğrulama**: 18/18 backend testi (3 yeni: `test_session_repo.py`, mock Supabase client ile), `tsc --noEmit` temiz. Tarayıcıda: Panelim'in boş durumu doğru render oldu (artık "Nova AI Yazılım" değil, dürüst bir mesaj). `GET /api/session/{id}` route→repo→Supabase zincirinin doğru çalıştığı loglardan doğrulandı — sadece `user_sessions` tablosu henüz Supabase'e uygulanmadığı için `PGRST205` hatası alındı (beklenen, migration bekliyor).

**Önemli yan bulgu**: Gerçek bir sohbet mesajı denerken `429 RESOURCE_EXHAUSTED` aldık — Gemini anahtarı ücretsiz katmanda, `gemini-3.5-flash` için dakikada 5 istek limitiyle. Bu, Sprint 2 boyunca gördüğümüz "yüksek talep" (503) hatalarının bir kısmının aslında kota sınırı olabileceğini gösteriyor. Barış'a token/kota konusunu netleştirmesini önerdim.

**Sıradaki adım**: Barış'tan güncellenmiş `db/schema.sql`'i (yeni `user_sessions` bölümü) Supabase'e uygulamasını istemek, sonra gerçek bir mesajla tam kaydet→yenile→geri-yükle döngüsünü uçtan uca doğrulamak, sonra PR açıp develop'a almak.

---

## 2026-07-16 — Faz 1 kapandı, Faz 2/3/4 otonom olarak tamamlandı

**Bağlam**: `user_sessions` migration'ını Supabase'e uyguladıktan sonra ("İstediğin sorguyu çalıştırdım supabasede") ben uyurken Faz 1'i bitirip Faz 2, 3 ve 4'ü de tek başıma tamamlamamı istedim — soru sormadan, sadece benim karar vermem gereken şeyleri not alıp en sonda toplu rapor olarak sunması şartıyla. Aşağıdaki maddeler o gece boyunca açılan PR'lar (#21–#28), hepsi develop'a merge edildi.

### Faz 1 — kapanış
`user_sessions` migration'ı uygulandıktan sonra gerçek kaydet→yenile→geri-yükle zincirini curl ile (Gemini kotasını tüketmeden) uçtan uca doğruladım. PR #21 develop'a merge edildi.

### Faz 2
1. **Rate limiting** (PR #23): `backend/core/rate_limit.py` — bağımlılıksız, bellek-içi sliding-window limiter. Per-IP dakikalık limit (`RATE_LIMIT_PER_MINUTE`, varsayılan 10) + opsiyonel global günlük LLM bütçesi (`DAILY_LLM_BUDGET`, varsayılan sınırsız/0). `/match`, `/profile`, `/eligibility`, `/application`, `/assist`, `/chat` route'larına dependency olarak eklendi. Canlıda doğrulandı: 12 hızlı istekten ilk 10'u 422, sonrakiler 429 (Gemini kotası hiç harcanmadan).
2. **Kriter verisi** (PR #22 — `feat_frontend_polish` içinde): `frontend/lib/adapter.ts`'e `buildCriteria()` eklendi, DetailView'daki "Temel kriterler" artık her zaman boş liste değil gerçek `region`/`company_required`/`founded_after`/`women_entrepreneur`/`student`/`technopark` alanlarından üretiliyor.
3. **Responsive düzeltmeler** (aynı PR): MatchesView ve DetailView'daki grid'lere responsive class'lar eklendi. Bu arada tesadüfen gerçek bir bug bulundu ve düzeltildi: ChatView'daki program kartlarında uzun başlıklar mobilde tutar/uygunluk rozetiyle üst üste biniyordu (`flexWrap`/`minWidth` eksikliği).
4. **Mock veri temizliği** (aynı PR): `frontend/lib/programs.ts` (320 satırlık sahte katalog) tamamen silindi; `resolveProgram()` artık bulunamayan programda sessizce mock'a düşmüyor, dürüst bir "Program bulunamadı" ekranı gösteriyor; `matchCount` sahte "7" fallback'i yerine gerçek API sonuç sayısını kullanıyor.

### Faz 3
5. **`apply_request` için ayrı zincir** (PR #24): Orchestrator'da başvuru niyeti artık genel akışın (5 aday eşleşme + 3 uygunluk kontrolü) tamamını çalıştırmak yerine, tek hedefli bir zincir kullanıyor (limit=1 eşleşme, profil boşsa mesaj sorgusuna düşme, 1 uygunluk kontrolü, başvuruya özel yanıt promptu) — hem daha isabetli hem Gemini kotasını daha az harcıyor.
6. **Frontend test altyapısı** (PR #25): Vitest kuruldu (`frontend/vitest.config.ts`, `npm run test`), `lib/adapter.ts` için 16 test yazıldı (tutar/tarih formatlama, kriter üretimi, session/assist dönüşümleri).
7. **Pipeline testleri** (PR #26): `backend/core/cleaner.py` (6 test) ve `backend/connectors/base.py` (14 test) için ilk kez test eklendi — connector'ların mutlak import kullanması nedeniyle test dosyasında `sys.path` çözümü gerekti (üretim kodu değişmedi, sadece test importu connector'ların gerçek çalışma şekline uyduruldu).

### Faz 4
8. **CI kuruldu** (PR #27): `.github/workflows/ci.yml` — her PR/push'ta backend testleri (`pytest`, 46 test) + backend "boot smoke test" (uvicorn'u gerçekten başlatıp `/health`'e istek atıyor, gerçek Supabase/Gemini kimlik bilgisi gerektirmiyor) + frontend `tsc --noEmit` + `npm run test` (16 test) çalışıyor. İlk denemede `pytest` (düz komut, `python -m pytest` değil) repo kökünü sys.path'e eklemediği için `ModuleNotFoundError: No module named 'backend'` ile patladı — bunu farkedip düzelttim, ikinci denemede tüm job'lar yeşil.
9. **`is_relevant` karar noktaları belgelendi** (PR #28): `kosgeb.py`, `kalkinma_ajansi.py`, `tubitak.py`'de alaka filtresinin neden kapalı/kullanılmadığını ve hangi kararın (kota tasarrufu vs. yanlış eleme riski) beklediğini açıklayan yorumlar eklendi — kod davranışı değişmedi, bu bir ürün kararı olduğu için.

**Doğrulama**: Her PR açılışında CI (PR #27'den itibaren) + lokal `pytest`/`tsc --noEmit`/`npm run test` yeşil görüldükten sonra merge edildi. Toplamda backend 46 test, frontend 16 test.

**Kararı bende olmayan, Barış'ın karar vermesi/yapması gereken konular** (toplu rapor olarak ayrıca iletildi):
- Gemini ücretsiz katman günlük kotası (20 istek/gün) — canlı E2E test kapasitesini ciddi kısıtlıyor, ücretli anahtar veya kota artışı gerekebilir.
- `is_relevant` filtresini açıp açmama kararı (yukarıda #9).
- Test sırasında Supabase `user_sessions` tablosuna eklenen `test-e2e-1`/`test-e2e-2` id'li deneme satırları — zararsız ama silme endpoint'i olmadığı için elle temizlenmesi gerekiyor.

---

## 2026-07-17 — Production geliştirme planı + otonom Faz B2-C3 inşası

**Bağlam**: Barış'ın isteğiyle tüm uygulama gözden geçirilip production seviyesine taşıyan yeni bir fazlı plan (Faz A-D) çıkarıldı; kredi/anahtar netleşmesinin ardından ("sadece Gemini kullanılacak, kredi akşam yüklenecek") Barış uyurken bu planın LLM'siz/düşük riskli maddeleri sırayla, her biri kendi PR'ında, test edilip merge edilerek tamamlandı.

### Faz B1 — Onboarding akışı
Sektör (görsel kartlar), şehir + kuruluş durumu, ekip + özel durumlar, hedefler (çoklu seçim), KVKK rızası — tamamen istemci tarafında, LLM'siz. Tamamlanınca doğrudan `BackendUserProfile` üretiyor, `localStorage` bayrağıyla yalnızca ilk ziyarette gösteriliyor. PR #34.

### Faz B2 — App Router refactor
`page.tsx`'teki 600 satırlık tek dosyalık view-switching, `lib/AppStateContext.tsx` (layout seviyesinde bir provider) + gerçek rotalara (`/onboarding`, `/chat`, `/matches`, `/program/[id]`, `/program/[id]/eligibility`, `/program/[id]/application`, `/panel`) taşındı. Derin bağlantı ve tarayıcı geri tuşu artık çalışıyor. PR #35.

### Faz A3 — KVKK metinleri
`/legal/aydinlatma-metni` (KVKK m.10 uyarınca tam metin — veri sorumlusu, veri kategorileri, Gemini'ye yurt dışı aktarım dahil) ve `/legal/kvkk-riza` (onboarding/profil ve başvuru/rapor verisi için ayrı rıza). Şirket henüz tüzel kişilik olarak tescilli olmadığı için MERSİS/vergi no/adres alanları metin içinde açıkça işaretlendi. PR #36.

### Faz C1 — Rapor gereksinim şemaları + önizleme
`report_schemas/*.json` (TÜBİTAK 1507 + 1501, Supabase migration gerektirmeyen statik veri) + `/program/[id]/report` önizleme ekranı — kullanıcı rapor yazımına başlamadan önce "neyle karşılaşacağını" görüyor. PR #37.

### Faz B3 — Panelim 2.0
Özet istatistik şeridi (toplam eşleşme, tam uygun, 30 gün içinde son tarih) + eksik profil alanı uyarısı. Başvuru durumu takibi (taslak→hazırlanıyor→gönderildi) yeni bir Supabase tablosu gerektirdiği için kapsam dışı bırakıldı — migration onayı Barış'ın kararı. PR #38.

### Faz C2 — Rapor Yazma Ajanı + DOCX export
Bölüm bölüm üretim (her bölüm ayrı LLM çağrısı), python-docx ile gerçek düzenlenebilir .docx. Canlı testte gerçek bir bug bulundu ve düzeltildi: `Content-Disposition` header'ı Latin-1 ile sınırlı, Türkçe karakterli dosya adları (TÜBİTAK gibi) `UnicodeEncodeError` ile 500 veriyordu — ASCII yedek + RFC 5987 `filename*` ile çözüldü. PR #39.

### Faz C3 — Sunum Ajanı v1 + PPTX export
10 slaytlık sabit iskelet (kapak→kapanış), python-pptx ile gerçek düzenlenebilir sunum. Aynı desen: her slayt ayrı LLM çağrısı. PR #40.

**Bilinçli olarak yapılmayan/ertelenen**:
- **Faz B4 (streaming)**: Mimarisi tasarlandı ama uygulanmadı — orkestratörün ana `onSend` akışını canlı Gemini doğrulaması olmadan değiştirmek, uygulamanın en kritik yolunu riske atardı. Gerçek kredi gelince yapılması öneriliyor.
- **Faz D1+D2 (deploy)**: Barış'ın kendi talimatıyla zaten en sona planlanmıştı ("önce geliştirme, deploy sonra").

**Doğrulama**: Her PR için `pytest` (62/62), `tsc --noEmit`, `npm run test` (16/16), `npm run build` (14 rota) yeşil görüldükten sonra merge edildi. Canlı Gemini gerektiren kısımlar (rapor/sunum içerik kalitesi) dummy anahtarla uçtan uca doğru hata verdiği doğrulanarak (kod yolu çalışıyor) kredi gelene kadar bekletildi.
