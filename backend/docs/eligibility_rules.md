# Uygunluk Kuralları (Eligibility Rules) Dokümantasyonu

Bu doküman, `GravioAI` sistemindeki uygunluk değerlendirme (eligibility evaluation) mekanizmasının işleyişini, standartlarını ve durum (state) kodlarını tanımlar. Sistem, kullanıcı profilini (UserProfile) bir destek programıyla (SupportProgram) karşılaştırarak bu kuralları işletir. (Ref: SCRUM-52)

## 1. Mimari ve Değerlendirme Süreci

Uygunluk değerlendirmesi **Uygunluk Ajanı** (`EligibilityAgent`) tarafından yürütülür. Ajan, LLM kullanarak aşağıdaki işlemleri yapar:
1. Kullanıcı profilindeki demografik ve operasyonel verileri (sektör, şehir, ekip büyüklüğü, vb.) okur.
2. Destek programının koşullarını okur (hedef kitle, yaş sınırı, teknopark şartı, vb.).
3. Her bir program koşulu için profili kıyaslayarak bir `ConditionState` üretir.
4. Tüm koşulların durumuna bakarak genel bir `EligibilityState` ve `0-100` arası bir uygunluk skoru belirler.

## 2. Kural Şeması ve Durumlar (States)

Değerlendirme sonucunda iki seviyede durum (state) belirlenir: Bireysel Koşul Durumu ve Genel Uygunluk Durumu.

### 2.1 Bireysel Koşul Durumu (`ConditionState`)

Her bir eşleştirme kriteri (koşul) için LLM şu durumlardan birini atar:

* **`met` (Karşılandı):**
  * Kullanıcı profili bu koşulu eksiksiz olarak karşılamaktadır.
  * Örnek: Program yazılım sektörü arıyordur, kullanıcının sektörü "yazılım"dır.
* **`action` (Aksiyon Gerekiyor):**
  * Koşul şu an tam karşılanmıyor olabilir, ancak kullanıcının alabileceği hızlı/küçük bir aksiyonla karşılanabilir.
  * Örnek: İş planı dokümanı hazırlanması, bir kayıt oluşturulması, kısa bir sertifika alınması.
  * Ajan bu durumda `hint` (ipucu) alanında ne yapılması gerektiğini kısaca belirtmelidir.
* **`unmet` (Karşılanmıyor):**
  * Koşul karşılanmıyor ve bu aşamada büyük bir engel (veya imkansızlık) teşkil ediyor.
  * Örnek: Program yalnızca "kadın girişimciler" veya "İstanbul dışı" firmalar içinse ve profil uymuyorsa.
  * Ajan bu durumda `hint` alanında neden uymadığını açıklar.

*Kural:* Profilde yeterli bilgi yoksa, ajan varsayım yapmamalı, koşulu temkinli olarak `action` veya `unmet` şeklinde değerlendirip eksik bilgiyi `hint` alanında belirtmelidir.

### 2.2 Genel Uygunluk Durumu (`EligibilityState`)

Tüm bireysel koşullar değerlendirildikten sonra, program için genel bir uygunluk durumu belirlenir:

* **`full` (Tam Uygun):**
  * Tüm ana koşullar `met` durumundadır. En fazla önemsiz veya çok kolay halledilebilecek `action` koşulları bulunabilir.
  * Skor aralığı: ~85 - 100
* **`partial` (Kısmi Uygun):**
  * Profil bazı kurallara uyarken bazıları için belirli `action` adımları (belki zorlayıcı ama ulaşılabilir) gerektiriyordur. Veya ulaşılabilir bir `unmet` durumu vardır (örn. şirket henüz kurulmamış ama kurulacak).
  * Skor aralığı: ~55 - 84
* **`locked` (Uygun Değil / Kilitli):**
  * Programın sert/kesin koşullarından biri (örn. zorunlu lokasyon, cinsiyet kotası, yaş sınırı) karşılanmıyordur ve değiştirilmesi mümkün değildir.
  * Skor aralığı: ~0 - 54

## 3. Frontend İletişimi

Backend'den dönen `EligibilityResult` objesi doğrudan `frontend/lib/adapter.ts` üzerinden işlenerek arayüze (özellikle `MatchesView` ve `EligibilityView`) aktarılır.

Arayüzdeki Yansımalar:
* `full` -> Yeşil ikon ve "Tam uygun" etiketi.
* `partial` -> Turuncu ikon ve eksik koşulları belirten etiket (örn. "1 koşul eksik", "Aksiyon gerekiyor").
* `locked` -> Gri/Kırmızı ikon ve "Uygun değil" etiketi.

## 4. Gelecek Geliştirmeler
* **Otomatik Kontroller (Hard-coded Rules):** LLM çağrısından önce, lokasyon veya yaş gibi kesin ("hard") kurallar kod seviyesinde filtrelenebilir.
* **Kullanıcıdan Eksik Bilgi İsteme:** Eğer birçok durum bilgi eksikliğinden dolayı `action` kalıyorsa, Orkestratör kullanıcıya eksik olan bilgileri soracak bir `ConversationTurn` yönlendirmesi yapabilir.
