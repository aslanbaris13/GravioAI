# Prompt Akışı — Intent Classifier ve Ajan Promptları

**Jira**: SCRUM-176 (SCRUM-22 / Chat flow oluşturulması altında)
**Amaç**: Hangi ajanın hangi promptu, hangi sırayla, hangi niyet için aldığını tanımlamak. Bu doküman doğrudan SCRUM-107 (Intent classifier) ve SCRUM-108 (Agent workflow tasarımı) kodlamasının girdisidir.

---

## 1. Intent Classifier

Yeni bir ajan: `backend/agents/intent_classifier.py`. Var olan `ProfileExtractor`/`EligibilityAgent` deseniyle aynı şablonu izler (bkz. `backend/agents/base.py`) — Gemini'ye `response_schema` ile structured output verir, serbest metin değil.

### Çıktı şeması (öneri)

```python
class Intent(str, Enum):
    GREETING = "greeting"
    OFF_TOPIC = "off_topic"
    PROFILE_INFO = "profile_info"
    PROGRAM_QUESTION = "program_question"
    APPLY_REQUEST = "apply_request"

class IntentResult(BaseModel):
    intent: Intent
    confidence: float  # 0-1
```

### System prompt

```
Sen bir niyet sınıflandırıcısısın. Kullanıcının GravioAI (Türkiye'deki girişim/KOBİ
destek programları asistanı) ile sohbetindeki SON mesajını, konuşma geçmişini de
göz önünde bulundurarak aşağıdaki 5 kategoriden birine ata:

- greeting: selamlama, teşekkür, sohbeti başlatma/bitirme ("merhaba", "teşekkürler")
- off_topic: destek programlarıyla ilgisi olmayan mesajlar
- profile_info: kullanıcı kendi işletmesi hakkında bilgi veriyor (sektör, şehir,
  ekip büyüklüğü, hedef vb.) — yeni ya da güncellenmiş profil bilgisi içerir
- program_question: kullanıcı belirli bir program/destek türü hakkında soru soruyor,
  kendi profilini anlatmadan ("Ar-Ge hibesi var mı?", "KOSGEB'in şartları neler?")
- apply_request: kullanıcı bir programa başvurmak/başvuru sürecini başlatmak istiyor

Sadece verilen 5 kategoriden birini seç. Emin değilsen confidence'ı düşük ver,
kategoriyi profile_info olarak işaretle (güvenli varsayılan).
```

### Kod tarafı davranışı

```python
result = await intent_classifier.run(message, history=history)
if result.confidence < 0.55:
    result.intent = Intent.PROFILE_INFO  # güvenli varsayılan — mevcut tam zincir
```

Bu eşik ile SCRUM-96'nın kabul kriteri olan "yanlış sınıflandırmada kullanıcı yanıtsız kalmamalı" garanti edilir: belirsizlik durumunda sistem bugünkü davranışa (tam zincir) düşer.

## 2. Niyete göre ajan zinciri ve promptlar

| Niyet | Çalışan zincir | Kullanılan prompt(lar) |
|---|---|---|
| `greeting` | `Orchestrator._compose_reply_llm` (matches=[] varyantı) | Mevcut `_REPLY_SYSTEM`, ek olarak "kullanıcı henüz profil vermedi, kısaca karşıla ve profil sor" talimatı |
| `off_topic` | aynı, boş matches | `_REPLY_SYSTEM` + "konu dışı ise nazikçe GravioAI'nin kapsamına yönlendir" talimatı |
| `profile_info` | `ProfileExtractor` → `MatchingAgent` → `EligibilityAgent` (bugünkü tam akış, değişmiyor) | mevcut promptlar aynen kalır |
| `program_question` | `MatchingAgent` (limit=3, profil çıkarmadan — sorgu metninin embedding'i doğrudan kullanılır) | Eşleştirme için query = kullanıcı mesajının kendisi; uygunluk değerlendirmesi **atlanır** (profil yok, skorlanamaz → wireframe'deki "Bilgi" rozeti) |
| `apply_request` | mevcut `currentProfile` + hedef program → `/application` (zaten var olan uç nokta) | yeni prompt gerekmiyor, var olan başvuru taslağı akışı tetiklenir |

## 3. Loglama noktaları (SCRUM-111 için girdi)

Her mesajda şu noktalarda `logging.info`/`logging.warning` ile yapılandırılmış log:

1. `intent_classified` — `{intent, confidence, message_len}`
2. `chain_selected` — `{intent, agents: [...]}`
3. `agent_completed` — her ajan bitişinde `{agent_name, duration_ms}`
4. `chain_failed` — bir ajan hata verirse `{agent_name, error}` + fallback'e düşüldüğü bilgisi

Bu loglar `AssistResult`'a opsiyonel bir `trace` alanı olarak da eklenebilir (debug modunda frontend'de gösterilebilir) — SCRUM-96 kodlaması sırasında karar verilecek.

## 4. Değişmeyen sözleşme

`Orchestrator.run()` imzası ve `AssistResult` şeması **sabit kalır** — frontend (`frontend/lib/api.ts`, `adapter.ts`) hiçbir değişiklik gerektirmez. Sadece `program_question` dalında `matches[].eligibility` için "unscored" durumu eklenirse adapter'da küçük bir güncelleme gerekir (bkz. `02-wireframe.md` §3 notu).

## 5. Sonraki adım

Bu üç doküman (kullanıcı akışı, wireframe, prompt akışı) onaylanınca **Faz 2**: SCRUM-96 kodlaması bu dokümanları birebir referans alarak başlayacak (`agents/intent_classifier.py`, `orchestrator.py`'de dallanma, `logging` entegrasyonu).
