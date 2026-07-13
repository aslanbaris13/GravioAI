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
