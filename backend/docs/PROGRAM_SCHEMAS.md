# 📚 GravioAI - Destek Programları Rapor Şablonları Dokümantasyonu

Bu doküman, GravioAI altyapısında tanımlı olan kamu ve uluslararası destek programlarının başvuru raporu şablonlarını (`ReportSchema`) içermektedir.

---

## 📑 İçindekiler Tablosu

| Kurum | Program Adı | Şema Kodu (`key`) |
| :--- | :--- | :--- |
| **Hazine ve Maliye Bakanlığı** | Hazine / KGF Destekli KOBİ Finansman Paketi | `hazine_kobi_finansman` |
| **TKDK (Tarım ve Kırsal Kalkınmayı Destekleme Kurumu)** | TKDK / IPARD - Tarım ve Kırsal Kalkınmayı Destekleme Programı | `ipard_tarim` |
| **Kalkınma Ajansı** | Kalkınma Ajansı Fizibilite Desteği Programı | `kalkinma_fizibilite` |
| **KOSGEB** | KOSGEB Ar-Ge, Ür-Ge ve İnovasyon Destek Programı | `kosgeb_arge_inovasyon` |
| **KOSGEB** | KOSGEB KOBİ Dijital Dönüşüm Destek Programı | `kosgeb_dijital_donusum` |
| **KOSGEB** | KOSGEB Girişimcilik Destek Programı | `kosgeb_girisimcilik` |
| **KOSGEB** | KOSGEB İşletme Geliştirme Destek Programı | `kosgeb_isletme_gelistirme` |
| **KOSGEB** | KOSGEB KOBİGEL - KOBİ Gelişim Destek Programı | `kosgeb_kobi_gelisim` |
| **KOSGEB** | KOSGEB Stratejik Ürün Destek Programı | `kosgeb_stratejik_urun` |
| **KOSGEB** | KOSGEB Yalın Dönüşüm Destek Programı | `kosgeb_yalin_donusum` |
| **KOSGEB** | KOSGEB Yeşil Sanayi Destek Programı | `kosgeb_yesil_sanayi` |
| **Sanayi ve Teknoloji Bakanlığı** | Sanayi ve Teknoloji Bakanlığı Teknoloji Odaklı Sanayi Hamlesi Programı | `sanayi_hamle` |
| **Ticaret Bakanlığı** | Ticaret Bakanlığı E-İhracat Destekleri | `ticaret_e_ihracat` |
| **Ticaret Bakanlığı** | Ticaret Bakanlığı Pazara Giriş Belgesi Desteği | `ticaret_pazara_giris` |
| **Ticaret Bakanlığı** | Ticaret Bakanlığı Turquality ve Markalaşma Destek Programı | `ticaret_turquality` |
| **TÜBİTAK** | TÜBİTAK 1001 - Bilimsel ve Teknolojik Araştırma Projelerini Destekleme Programı | `tubitak_1001` |
| **TÜBİTAK** | TÜBİTAK 1501 - Sanayi Ar-Ge Projeleri Destekleme Programı | `tubitak_1501` |
| **TÜBİTAK** | TÜBİTAK 1505 - Üniversite-Sanayi İşbirliği Destek Programı | `tubitak_1505` |
| **TÜBİTAK** | TÜBİTAK 1507 - KOBİ Ar-Ge Başlangıç Destek Programı | `tubitak_1507` |
| **TÜBİTAK** | TÜBİTAK 1512 - BİGG Bireysel Genç Girişim Destek Programı | `tubitak_1512` |
| **TÜBİTAK** | TÜBİTAK 1711 - Yapay Zeka Ekosistem Çağrısı | `tubitak_1711` |
| **TÜBİTAK** | TÜBİTAK 1831 - Yeşil İnovasyon Teknoloji Mentorluk Desteği | `tubitak_1831` |
| **Avrupa Birliği (AB)** | AB Ufuk Avrupa / EIC Accelerator Programı | `ufuk_avrupa_eic` |

---

## 🔍 Program Detayları ve Rapor Gereksinimleri

### 1. Hazine / KGF Destekli KOBİ Finansman Paketi (`hazine_kobi_finansman`)

- **Kurum:** Hazine ve Maliye Bakanlığı
- **Eşleşme Anahtar Kelimeleri:** `hazine destekli, kgf desteği, kobi finansman paketi, hazine kredi kefalet`
- **Özet:** KOBİ'lerin finansmana erişimini kolaylaştırmak, işletme sermayesi ve yatırım harcamalarını Hazine destekli kefalet sistemi ile desteklemek.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Kredi Kullanım Amacı ve İşletme İhtiyacı (Bölüm A)
_Finansmanın işletme sermayesi, hammadde alımı veya yatırım harcamalarındaki kullanım detayları._

- **[finansman_gerekcesi] Finansman İhtiyacı ve Nakit Akış Planı**
  - *Açıklama:* Talep edilen kredinin işletmenin hangi operasyonel veya yatırım ihtiyacı için kullanılacağını açıklayınız.
- **[geri_odeme_kapasitesi] Mali Yapı ve Geri Ödeme Projeksiyonu**
  - *Açıklama:* İşletmenin mevcut borçluluk durumunu, ciro büyümesini ve kredi geri ödeme kapasitesini özetleyiniz.

##### 📌 KGF Kefalet ve Teminat Yapısı (Bölüm B)
_Krediye konu kefalet oranları ve banka protokol süreçleri._

- **[varlik_ve_teminat_dökümü] İşletme Varlık Yapısı ve Sunulabilecek Ek Teminatlar**
  - *Açıklama:* KGF kefaleti dışındaki mevcut teminat yapısını ve banka nezdindeki kredibilitenizi detaylandırınız.

#### 📄 Zorunlu Başvuru Evrakları
- Vergi Levhası ve Ticaret Sicil Gazetesi
- Son 3 Yıla Ait Bilanço ve Gelir Tabloları
- SGK Borcu Yoktur Belgesi
- Bankalardan Alınan Kredi Durum Yazıları

---

### 2. TKDK / IPARD - Tarım ve Kırsal Kalkınmayı Destekleme Programı (`ipard_tarim`)

- **Kurum:** TKDK (Tarım ve Kırsal Kalkınmayı Destekleme Kurumu)
- **Eşleşme Anahtar Kelimeleri:** `ipard, tkdk, kırsal kalkınma, kirsal kalkinma, tarımsal işletme desteği, ipard destekleri`
- **Özet:** Tarımsal işletmelerin fiziki varlıklarına yönelik yatırımlar, çiftlik faaliyetlerinin geliştirilmesi ve işleme/pazarlama tesislerinin AB standartlarına yükseltilmesi.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Yatırım Konusu, Kapasite ve AB Standartları (Bölüm A)
_Tesis/çiftlik kapasitesi, modernizasyon planı, hijyen ve çevre standartlarına uyum._

- **[yatirim_gerekcesi_ve_kapasite] Tarımsal Yatırım Niteliği ve Kapasite Artış Planı**
  - *Açıklama:* Kurulacak veya modernize edilecek hayvancılık/gıda işleme tesisinin teknik detaylarını ve üretim kapasitesini yazınız.
- **[ab_standartlari_ve_cevre] AB Hijyen, Çevre ve Hayvan Refahı Standartları Uyum Planı**
  - *Açıklama:* Yatırımın AB nitelikli çevre koruma, atık yönetimi ve hayvan refahı kriterlerine uyumunu açıklayınız.

##### 📌 Inşaat İşleri, Makine Parkuru ve Finansman (Bölüm B)
_Yapım işleri bütçesi, traktör/makine ekipman alımı ve hibe finansman oranı._

- **[ipard_hibe_butcesi_ve_harcamalar] Yapım İşleri ve Makine-Ekipman Proforma Detayları**
  - *Açıklama:* Tesis inşaatı, yenilenebilir enerji sistemleri ve tarımsal makine alım bütçesini hibe oranları ile detaylandırınız.

#### 📄 Zorunlu Başvuru Evrakları
- IPARD İş Planı ve Yatırım Projesi (Fizibilite Raporu)
- Yapı Ruhsatı / Mimari Projeler (İnşaat içeren yatırımlar için)
- ÇED Gerekli Değildir / Muafiyet Yazısı
- Teknik Teknik Şartnameler ve Uygun Proforma Faturalar

---

### 3. Kalkınma Ajansı Fizibilite Desteği Programı (`kalkinma_fizibilite`)

- **Kurum:** Kalkınma Ajansı
- **Eşleşme Anahtar Kelimeleri:** `fizibilite desteği, fizibilite destegi, kalkınma ajansı fizibilite`
- **Özet:** Bölgenin kalkınması ve rekabet gücü açısından kritik önem taşıyan yatırım projelerinin fizibilite çalışmalarına ve ön hazırlık süreçlerine sağlanan doğrudan finansal destek.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Bölgesel Öncelikler ve Yatırım Gerekçesi (Bölüm A)
_Yatırımın bölge ekonomisine, istihdamına ve kalkınma planlarına sağlayacağı katkı._

- **[yatirim_konusu_ve_gerekce] Yatırım Konusu ve Bölgesel Kalkınma Gerekçesi**
  - *Açıklama:* Planlanan yatırımın bölgesel potansiyelini, ekonomik gerekçesini ve kalkınma planlarıyla uyumunu açıklayınız.
- **[hedef_kitle_ve_paydaslar] Hedef Kitle ve Bölgesel Paydaşlar**
  - *Açıklama:* Fizibilite çalışması sonucunda doğrudan ve dolaylı etkilenecek paydaşları belirtiniz.

##### 📌 Fizibilite Analizi ve Metodoloji Planı (Bölüm B)
_Hazırlanacak fizibilite raporunun teknik, finansal, hukuki ve çevresel analiz adımları._

- **[pazar_ve_teknik_analiz] Pazar, Teknik ve Finansal Analiz Kapsamı**
  - *Açıklama:* Fizibilite sürecinde yapılacak pazar araştırması, lokasyon seçimi, maliyet-fayda analizi ve finansal modelleme detaylarını yazınız.
- **[danismanlik_ve_yol_haritasi] Hizmet Alımı ve Çalışma Takvimi**
  - *Açıklama:* Fizibilite raporunu hazırlayacak uzman/danışman ekibi ve iş planı takvimini özetleyiniz.

#### 📄 Zorunlu Başvuru Evrakları
- Kurum/Firma Resmi Yetki Belgeleri
- Fizibilite Hazırlama Hizmet Alımı Şartnamesi
- Danışmanlık/Uzmanlık Teklifleri (Proforma)
- Bölgesel Etki Pre-Fizibilite Özeti

---

### 4. KOSGEB Ar-Ge, Ür-Ge ve İnovasyon Destek Programı (`kosgeb_arge_inovasyon`)

- **Kurum:** KOSGEB
- **Eşleşme Anahtar Kelimeleri:** `ar-ge ve inovasyon, arge inovasyon, ür-ge, ürge desteği, kosgeb ar-ge`
- **Özet:** KOBİ'lerin ve girişimcilerin yeni bir ürün/süreç geliştirmelerine, mevcut ürün kalitesini artırmalarına ve prototip üretimine yönelik Ar-Ge/Ür-Ge projelerinin desteklenmesi.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Ar-Ge / Ür-Ge Proje Konusu ve İnovatif Yönü (Bölüm A)
_Geliştirilecek yeni ürün/proses, yenilikçi yönü ve Ar-Ge niteliği._

- **[proje_konusu_ve_yenilik] Geliştirilecek Ürün/Proses ve İnovasyon Derecesi**
  - *Açıklama:* Proje çıktısının pazardaki muadillerine göre teknolojik yeniliklerini ve Ar-Ge içeriğini açıklayınız.
- **[prototip_ve_test_metodolojisi] Prototip Geliştirme ve Test Süreçleri**
  - *Açıklama:* Prototip imalatı, test-analiz adımları ve doğrulama metodolojisini detaylandırınız.

##### 📌 Makine-Teçhizat, Personel ve Hizmet Alımı Bütçesi (Bölüm B)
_Projede görev alacak Ar-Ge personeli, test cihazları ve hammadde bütçesi._

- **[makine_techizat_personel_listesi] Gerekli Laboratuvar/Test Cihazları ve Personel Planı**
  - *Açıklama:* Alınacak cihazlar, yazılım lisansları ve çalıştırılacak Ar-Ge personelinin niteliklerini yazınız.

#### 📄 Zorunlu Başvuru Evrakları
- KOSGEB KOBİ Beyannamesi
- Ar-Ge Projesi Detaylı İş Planı
- Ar-Ge Personeli CV ve Lisan / Lisansüstü Diplomaları
- Proforma Faturalar ve Teknik Şartnameler

---

### 5. KOSGEB KOBİ Dijital Dönüşüm Destek Programı (`kosgeb_dijital_donusum`)

- **Kurum:** KOSGEB
- **Eşleşme Anahtar Kelimeleri:** `dijital dönüşüm, dijital donusum, kobi dijital`
- **Özet:** İmalat sanayi KOBİ'lerinin dijital dönüşüm olgunluk seviyelerini artırmaya yönelik yazılım, donanım, otomasyon ve danışmanlık harcamalarının desteklenmesi.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Mevcut Durum ve Dijital Olgunluk Seviyesi (Bölüm A)
_İşletmenin mevcut bilişim/otomasyon altyapısı ve dijital dönüşüm ihtiyaç analizi._

- **[mevcut_altyapi] Mevcut ERP/CRM ve Otomasyon Altyapısı**
  - *Açıklama:* İşletmede aktif olarak kullanılan yazılım, donanım ve otomasyon sistemlerini açıklayınız.
- **[dijitallesme_ihtiyaci] Dijital Dönüşüm İhtiyacı ve Hedeflenen Seviye**
  - *Açıklama:* Proje sonrası hedeflenen verimlilik artışı ve dijitalleşme hedeflerini belirtiniz.

##### 📌 Yazılım, Donanım ve Danışmanlık Yatırım Planı (Bölüm B)
_Satın alınacak teknoloji kalemleri ve entegrasyon süreci._

- **[yazilim_donanim_kalemleri] Alınacak Yazılım ve Donanım Kalemleri**
  - *Açıklama:* Proje kapsamında tedarik edilecek lisans, sensör, sunucu ve sanayiye yönelik yazılım detaylarını yazınız.
- **[danismanlik_ve_hizmet] Dijital Dönüşüm Danışmanlığı ve Eğitim Hizmeti**
  - *Açıklama:* Yetkili merkezlerden alınacak danışmanlık ve eğitim detaylarını belirtiniz.

#### 📄 Zorunlu Başvuru Evrakları
- KOSGEB KOBİ Beyannamesi
- Dijital Olgunluk Değerlendirme Raporu
- Proforma Fatura / Fiyat Teklifleri
- Vergi Levhası ve Onaylı İmza Sirküleri

---

### 6. KOSGEB Girişimcilik Destek Programı (`kosgeb_girisimcilik`)

- **Kurum:** KOSGEB
- **Eşleşme Anahtar Kelimeleri:** `girişimcilik, girisimcilik, iş kurma, iş geliştirme`
- **Özet:** Yeni kurulan genç ve yenilikçi işletmelerin hayatta kalma oranlarını artırmak amacıyla kuruluş, makine-teçhizat ve işletme giderlerinin desteklenmesi.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 İş Fikri Özeti ve Müşteri Potansiyeli (Bölüm A)
_Kurulan/kurulacak işletmenin faaliyet konusu, hedef müşteri kitlesi ve pazardaki yeri._

- **[is_fikri_tanimi] İş Fikri, Sunulan Ürün/Hizmet ve Değer Önerisi**
  - *Açıklama:* İşletmenizin hangi sorunu çözdüğünü ve müşterilere sunduğu temel değer önerisini açıklayınız.
- **[pazar_ve_rakip_analizi] Hedef Pazar, Rekabet Analizi ve Satış Stratejisi**
  - *Açıklama:* Rakiplerinizi, hedef müşteri kitlenizi ve ürün/hizmet satış kanallarınızı belirtiniz.

##### 📌 Kuruluş ve Başlangıç Ekipman Planı (Bölüm B)
_Şirket kuruluş masrafları, ofis/üretim donanımları ve personel giderleri._

- **[ofis_makine_donanim_kalemleri] Satın Alınacak Temel İşletme Ekipmanları**
  - *Açıklama:* İşletmenin faaliyete geçmesi için gerekli bilgisayar, yazılım, makine ve kuruluş giderlerini detaylandırınız.

#### 📄 Zorunlu Başvuru Evrakları
- Girişimcilik Eğitimi Sertifikası / Onay Belgesi
- Girişimci CV ve Kurucu Ortaklık Pay Cetveli
- Ticaret Sicil Gazetesi ve Vergi Levhası
- Gerekli Ekipman ve Yazılım Proforma Faturaları

---

### 7. KOSGEB İşletme Geliştirme Destek Programı (`kosgeb_isletme_gelistirme`)

- **Kurum:** KOSGEB
- **Eşleşme Anahtar Kelimeleri:** `işletme geliştirme, isletme gelistirme, kosgeb işletme geliştirme, yurt dışı gezisi desteği`
- **Özet:** KOBİ'lerin rekabet güçlerini ve nitelikli iş gücü paylarını artırmak, yurt dışı pazarlara açılmalarını ve belgelendirme süreçlerini desteklemek.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 İşletme Mevcut Yapısı ve Hizmet Alım İhtiyacı (Bölüm A)
_Firma profili, destek alınacak hizmet alanları (test, belgelendirme, nitelikli eleman)._

- **[destek_alınacak_hizmet_kalemleri] Destek Talep Edilen Hizmet ve Belgelendirme Alanları**
  - *Açıklama:* Fuar katılımı, yurt dışı iş gezisi, nitelikli eleman istihdamı veya test-belgelendirme ihtiyaçlarınızı yazınız.
- **[isletme_rekabet_stratejisi] İşletmenin Gelişim Hedefleri ve Pazar Genişleme Planı**
  - *Açıklama:* Bu desteklerin firmanın hizmet/ürün kalitesine ve pazar payına yapacağı katkıyı açıklayınız.

##### 📌 Hizmet Alımı ve İstihdam Bütçesi (Bölüm B)
_Alınacak danışmanlık, test/belge masrafları ve personel giderleri._

- **[hizmet_kalemleri_detayi] Hizmet Verici Kurumlar ve Tahmini Bütçe**
  - *Açıklama:* Hizmet alınacak akredite laboratuvarlar, danışmanlık firmaları ve yeni istihdam edilecek personelin niteliklerini listeleyiniz.

#### 📄 Zorunlu Başvuru Evrakları
- KOSGEB KOBİ Beyannamesi
- Nitelikli Eleman Lisans/Önlisans Diplomaları ve SGK İşe Giriş Belgeleri
- Test / Belgelendirme Başvuru veya Fatura Evrakları
- Fuar Katılım Sözleşmesi veya İş Gezisi Programı

---

### 8. KOSGEB KOBİGEL - KOBİ Gelişim Destek Programı (`kosgeb_kobi_gelisim`)

- **Kurum:** KOSGEB
- **Eşleşme Anahtar Kelimeleri:** `kobigel, kobi gelişim, kobi gelisim, kobi gelişim destek programı`
- **Özet:** İmalat sanayi KOBİ'lerinin imalat kapasitelerini, rekabet güçlerini ve verimliliklerini artırmaya yönelik proje bazlı çağrılı destek programı.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 İşletme Mevcut Üretim Kapasitesi ve Proje Amacı (Bölüm A)
_İşletmenin mevcut imalat/hizmet kapasitesi ve projeyle hedeflenen büyüme ivmesi._

- **[mevcut_kapasite_ve_darbogazlar] Mevcut Üretim Altyapısı ve Darboğazlar**
  - *Açıklama:* İşletmenizin mevcut üretim hatlarını, karşılaşılan kapasite/verimlilik sorunlarını açıklayınız.
- **[kobigel_hedefleri] Proje Sonunda Hedeflenen Verimlilik ve İhracat Artışı**
  - *Açıklama:* Proje tamamlandığında hedeflenen ciro, istihdam ve üretim artış oranlarını belirtiniz.

##### 📌 Makine-Teçhizat ve Yazılım Yatırım Planı (Bölüm B)
_Modernizasyon, otomasyon ve kapasite artırımı için alınacak donanımlar._

- **[kapasite_artirim_makineleri] Alınacak Yeni Nesil Üretim Makineleri ve Otomasyon**
  - *Açıklama:* Üretim hattına eklenecek yeni makine, teçhizat ve kalite kontrol cihazlarını listeleyiniz.

#### 📄 Zorunlu Başvuru Evrakları
- KOSGEB KOBİ Beyannamesi
- Kapasite Raporu (Sanayi Odası Onaylı)
- Son 2 Yıla Ait Onaylı Mali Tablolar (Bilanço/Gelir Tablosu)
- Makine-Teçhizat Proforma Faturaları

---

### 9. KOSGEB Stratejik Ürün Destek Programı (`kosgeb_stratejik_urun`)

- **Kurum:** KOSGEB
- **Eşleşme Anahtar Kelimeleri:** `stratejik ürün, stratejik urun`
- **Özet:** İthalatı yüksek olan stratejik ürünlerin yerlileştirilmesi ve milli imkanlarla üretilmesine yönelik KOBİ imalat yatırımlarının desteklenmesi.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Ürünün Stratejik Önemi ve İthalat Bağımlılığı (Bölüm A)
_Üretilecek ürünün ithalat boyutu, cari açığa etkisi ve stratejik önemi._

- **[urun_gtip_ve_tanim] Ürün Adı, GTİP Kodu ve İthalat Verileri**
  - *Açıklama:* Yerlileştirilecek ürünün GTİP kodunu ve Türkiye'deki yıllık ithalat hacmini belirtiniz.
- **[yerli_uretim_potansiyeli] Yerli Üretim ve İkame Kabiliyeti**
  - *Açıklama:* Ürünün yerli üretilmesinin sağlayacağı ulusal ve ekonomik avantajları açıklayınız.

##### 📌 Üretim Altyapısı ve Makine-Teçhizat Planı (Bölüm B)
_Seri üretim için kurulacak tesis ve makine parkuru._

- **[makine_teçhizat_listesi] Alınacak Makine ve Seri Üretim Ekipmanları**
  - *Açıklama:* Yerli üretim hattında kullanılacak makine, kalıp ve test donanımlarını detaylandırınız.

#### 📄 Zorunlu Başvuru Evrakları
- Stratejik Ürün Yerlileştirme Belgesi / Bakanlık Onayı
- KOSGEB KOBİ Beyannamesi
- Yatırım Fizibilite Raporu
- Makine-Teçhizat Proforma Faturaları

---

### 10. KOSGEB Yalın Dönüşüm Destek Programı (`kosgeb_yalin_donusum`)

- **Kurum:** KOSGEB
- **Eşleşme Anahtar Kelimeleri:** `yalın dönüşüm, yalin donusum, model fabrika, kosgeb yalın, yalın üretim`
- **Özet:** İmalat sanayi KOBİ'lerinin Model Fabrikalardan alacakları öğren-dönüş projesi hizmetleri ile israflardan arınmasını ve verimliliklerini artırmasını sağlayan destek programı.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Model Fabrika Hizmet Alımı ve İsraf Analizi (Bölüm A)
_Firma üretim sahasındaki israflar, Model Fabrika eğitimi ve yalın dönüşüm hedefleri._

- **[yalin_donusum_ihtiyaci] Mevcut Üretim İsrafları ve Yalın Dönüşüm Gerekçesi**
  - *Açıklama:* Üretim hattınızdaki hat dengeleme, kurulum süreleri (SMED), stok/fire sorunlarını ve yalın dönüşüm ihtiyacını açıklayınız.
- **[model_fabrika_isbirligi] Seçilen Model Fabrika ve Danışmanlık Kapsamı**
  - *Açıklama:* Hizmet alınacak Yetkinlik ve Dijital Dönüşüm Merkezi (Model Fabrika) ve Eğitim-Dönüşüm modüllerini yazınız.

##### 📌 Öğren-Dönüş Projesi İş Planı ve Verimlilik Hedefleri (Bölüm B)
_Saha uygulaması, verimlilik artış oranı ve bütçe planı._

- **[verimlilik_hedefleri_ve_butce] OEE/Verimlilik Artış Hedefleri ve Hizmet Bütçesi**
  - *Açıklama:* Proje sonunda hedeflenen Toplam Ekipman Etkinliği (OEE) artışını, adam-saat tasarrufunu ve hizmet alım giderlerini detaylandırınız.

#### 📄 Zorunlu Başvuru Evrakları
- KOSGEB KOBİ Beyannamesi
- Model Fabrika Hizmet/Eğitim Teklif Belgesi
- Yalın Dönüşüm Ön Değerlendirme / Anket Raporu
- İmza Sirküleri ve SGK Borcu Yoktur Belgesi

---

### 11. KOSGEB Yeşil Sanayi Destek Programı (`kosgeb_yesil_sanayi`)

- **Kurum:** KOSGEB
- **Eşleşme Anahtar Kelimeleri:** `yeşil sanayi, yesil sanayi`
- **Özet:** KOBİ'lerin kaynak verimliliği, atık yönetimi, yenilenebilir enerji ve karbon emisyonu azaltımına yönelik yeşil dönüşüm projelerinin desteklenmesi.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Mevcut Çevresel Etki ve Kaynak Tüketimi (Bölüm A)
_İşletmenin enerji, su, hammadde tüketimi ve mevcut atık durumu._

- **[enerji_ve_kaynak_haritasi] Mevcut Enerji ve Kaynak Tüketim Durumu**
  - *Açıklama:* Yıllık elektrik, gaz, su tüketimleri ile atık yönetim süreçlerinizi açıklayınız.
- **[proje_surdurulebilirlik_hedefi] Projenin Karbon Ayak İzi ve Tasarruf Hedefleri**
  - *Açıklama:* Yatırım sonunda hedeflenen % enerji/kaynak tasarrufu ve CO2 emisyon azaltım miktarını yazınız.

##### 📌 Yeşil Teknoloji Yatırımları ve Ekipman Planı (Bölüm B)
_Yenilenebilir enerji sistemleri (GES vb.) ve enerji verimli makine alımları._

- **[yatirim_kalemleri] Alınacak Yeşil Teknoloji Ekipman ve Sistemler**
  - *Açıklama:* Enerji verimli motorlar, atık ısı geri kazanım veya GES panelleri gibi sistem detaylarını belirtiniz.

#### 📄 Zorunlu Başvuru Evrakları
- Enerji Etüt Raporu veya Karbon Ayak İzi Belgesi
- KOSGEB KOBİ Beyannamesi
- Teknik Proje Şartnamesi
- Proforma Faturalar

---

### 12. Sanayi ve Teknoloji Bakanlığı Teknoloji Odaklı Sanayi Hamlesi Programı (`sanayi_hamle`)

- **Kurum:** Sanayi ve Teknoloji Bakanlığı
- **Eşleşme Anahtar Kelimeleri:** `sanayi hamlesi, hamle programı, teknoloji odaklı sanayi hamlesi, öncelikli ürün listesi`
- **Özet:** Türkiye'de orta-yüksek ve yüksek teknoloji seviyeli sektörlerdeki katma değerli ürünlerin yerli imkanlarla üretilmesini hedefleyen stratejik yatırım desteği.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Ürün Stratejik Önemi ve Yerlileştirme Potansiyeli (Bölüm A)
_Öncelikli Ürün Listesi'ndeki yer alma gerekçesi ve cari açığı azaltma potansiyeli._

- **[yerli_uretim_gerekcesi] Ürünün Stratejik Önemi ve İthalat Bağımlılığına Katkısı**
  - *Açıklama:* Geliştirilecek/üretilecek ürünün Türkiye'nin ithalat ikamesi ve teknolojik bağımsızlığı açısından önemini açıklayınız.
- **[teknolojik_seviye_ve_patents] Teknoloji Seviyesi ve Fikri Mülkiyet (IPR)**
  - *Açıklama:* Ürünün orta-yüksek veya yüksek teknoloji sınıfındaki konumunu ve patent/lisans durumunu yazınız.

##### 📌 Stratejik Yatırım Tesisi ve Bütçe Planı (Bölüm B)
_Üretim tesisinin fiziki altyapısı, makine parkuru ve finansman modeli._

- **[büyük_olcekli_yatirim_kalemleri] Fabrika/Tesis Altyapısı ve Makine-Teçhizat Bütçesi**
  - *Açıklama:* Kurulacak seri üretim hattı, özelleştirilmiş donanımlar ve yatırım finansman modelini detaylandırınız.

#### 📄 Zorunlu Başvuru Evrakları
- Öncelikli Ürün Listesi Eşleşme Belgesi
- Stratejik Yatırım Pre-Fizibilite Raporu
- ÇED Onay / Muafiyet Belgesi
- Son 3 Yıla Ait YMM Onaylı Mali Tablolar

---

### 13. Ticaret Bakanlığı E-İhracat Destekleri (`ticaret_e_ihracat`)

- **Kurum:** Ticaret Bakanlığı
- **Eşleşme Anahtar Kelimeleri:** `e-ihracat, e ihracat, ticaret bakanlığı e-ihracat`
- **Özet:** Şirketlerin sınır ötesi e-ticaret (B2C/B2B) kapasitelerini artırmaya yönelik dijital pazaryeri entegrasyonu, dijital reklam ve depolama harcamalarının desteklenmesi.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 E-İhracat Stratejisi ve Dijital Pazaryerleri (Bölüm A)
_Açılınacak küresel pazaryerleri (Amazon, Etsy, Allegro vb.) ve dijital pazarlama altyapısı._

- **[hedef_pazaryerleri_ve_urunler] Hedef Küresel Pazaryerleri ve Ürün Gamı**
  - *Açıklama:* E-ihracat yapılacak dijital platformları ve satışı hedeflenen ürün gruplarını açıklayınız.
- **[dijital_reklam_ve_pazarlama_plani] Dijital Reklam ve Arama Motoru Pazarlaması Planı**
  - *Açıklama:* Tıklama başı reklam (PPC), sosyal medya ve fenomen pazarlaması stratejilerinizi detaylandırınız.

##### 📌 Lojistik, Depolama ve Entegrasyon Altyapısı (Bölüm B)
_Yurt dışı depolama (FBA/3PL), sipariş karşılama ve yazılım entegrasyonları._

- **[yurt_disi_depolama_ve_lojistik] Yurt Dışı Depo ve Lojistik Hizmet Alımı**
  - *Açıklama:* Kullanılacak fulfillment/depo merkezleri ve lojistik entegrasyon çözümlerini yazınız.

#### 📄 Zorunlu Başvuru Evrakları
- E-İhracat Yararlanıcı Statü Belgesi
- Yurt Dışı Pazaryeri Mağaza Onay Belgeleri
- Dijital Reklam Harcama Faturaları
- Vergi Levhası ve Şirket Resmi Evrakları

---

### 14. Ticaret Bakanlığı Pazara Giriş Belgesi Desteği (`ticaret_pazara_giris`)

- **Kurum:** Ticaret Bakanlığı
- **Eşleşme Anahtar Kelimeleri:** `pazara giriş belgesi, pazara giris, ticaret bakanlığı pazara giriş`
- **Özet:** Şirketlerin küresel pazarlara erişimini kolaylaştırmak amacıyla uluslararası kalite, çevre, güvenlik belgeleri ile test/analiz raporu giderlerinin desteklenmesi.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Hedef Pazar Analizi ve Belgelendirme Gerekçesi (Bölüm A)
_Hedef ihracat pazarları, pazara giriş engelleri ve gerekli sertifikasyonlar._

- **[hedef_ulkele_ve_potansiyel] Hedef İhracat Ülkeleri ve Pazar Potansiyeli**
  - *Açıklama:* Ürünün ihraç edileceği öncelikli ülkeleri ve bu pazarlardaki talep durumunu açıklayınız.
- **[alınacak_belge_ve_standartlar] Alınacak Kalite/Görünürlük Belgeleri ve Testler**
  - *Açıklama:* Başvurulacak uluslararası belge (CE, ISO, FDA, sertifikasyon vb.) ve gerekçesini yazınız.

##### 📌 Sertifikasyon Maliyet ve Danışmanlık Planı (Bölüm B)
_Belgelendirme kuruluşları, test harcamaları ve danışmanlık bütçesi._

- **[test_analiz_kuruluslari] Akredite Test ve Belgelendirme Kuruluşu Bilgileri**
  - *Açıklama:* Hizmet alınacak akredite kurumların detaylarını ve proforma fatura özetini giriniz.

#### 📄 Zorunlu Başvuru Evrakları
- Ticaret Sicil Gazetesi ve İmza Sirküleri
- Kapasite Raporu veya Yerli Üretim Belgesi
- Belgelendirme Kuruluşu Akreditasyon Belgesi
- Proforma Fatura ve Fiyat Teklifleri

---

### 15. Ticaret Bakanlığı Turquality ve Markalaşma Destek Programı (`ticaret_turquality`)

- **Kurum:** Ticaret Bakanlığı
- **Eşleşme Anahtar Kelimeleri:** `turquality, markalaşma desteği, markalasma destegi, turquality programı, dünya markası`
- **Özet:** Türk markalarının uluslararası pazarlarda küresel birer oyuncu haline gelmesi amacıyla pazarlama, patent, birim kiralama, danışmanlık ve tanıtım harcamalarının desteklenmesi.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Uluslararası Marka Stratejisi ve Kurumsal Altyapı (Bölüm A)
_Firmanın marka tescilleri, küresel pazarlama vizyonu ve kurumsallaşma seviyesi._

- **[global_marka_vizyonu] Uluslararası Markalaşma Stratejisi ve Pazarlama Vizyonu**
  - *Açıklama:* Hedef yurt dışı pazarlarda markanızın konumlandırılması, rakip analizi ve tutundurma stratejilerinizi açıklayınız.
- **[kurumsal_nitelik_ve_patentler] Yurt Dışı Marka Tescilleri ve Yönetim Yetkinliği**
  - *Açıklama:* Hedef ülkelerdeki marka tescillerinizi, kalite belgelerinizi ve kurumsal yönetim altyapınızı özetleyiniz.

##### 📌 Yurt Dışı Birim, Tanıtım ve Danışmanlık Bütçesi (Bölüm B)
_Yurt dışı mağaza/ofis kiralama, reklam-tanıtım ve yönetim danışmanlığı giderleri._

- **[turquality_harcama_planı] Tanıtım, Mağaza/Ofis ve Danışmanlık Harcama Detayları**
  - *Açıklama:* Açılacak yurt dışı birimler, küresel reklam kampanyaları ve alınacak stratejik danışmanlık bütçesini listeleyiniz.

#### 📄 Zorunlu Başvuru Evrakları
- Yurt Dışı Marka Tescil Belgeleri
- YMM Onaylı Uluslararası Satış ve Ciro Tablosu
- Stratejik İş Planı ve Gelişim Yol Haritası (Turquality Ön İnceleme Raporu)
- Hedef Ülke Mağaza/Ofis Kira Sözleşmeleri ve Tanıtım Fatura Örnekleri

---

### 16. TÜBİTAK 1001 - Bilimsel ve Teknolojik Araştırma Projelerini Destekleme Programı (`tubitak_1001`)

- **Kurum:** TÜBİTAK
- **Eşleşme Anahtar Kelimeleri:** `1001, tubitak 1001, 1001 desteği, bilimsel araştırma projesi, 1001 programı`
- **Özet:** Yeni bilimsel bilginin üretilmesi, teknolojik gelişmenin sağlanması veya yeni araştırma yöntemlerinin geliştirilmesine yönelik akademik ve kurumsal araştırma projelerinin desteklenmesi.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Projenin Özgün Değeri ve Araştırma Hipotezi (Bölüm A)
_Bilimsel/teknolojik özgünlük, literatürdeki boşluklar ve çalışma hipotezi._

- **[ozgun_deger_ve_literatur] Bilimsel/Teknolojik Özgün Değer ve Literatür Özeti**
  - *Açıklama:* Projenin ulusal ve uluslararası literatürdeki yerini, özgün değerini ve bilime katkısını açıklayınız.
- **[hipotez_ve_yontem] Araştırma Hipotezi ve Metodoloji**
  - *Açıklama:* Kullanılacak araştırma yöntemlerini, veri toplama ve analiz tekniklerini detaylandırınız.

##### 📌 Yaygın Etki ve Araştırmacı Kadrosu (Bölüm B)
_Makale, patent, nitelikli insan kaynağı yetiştirilmesi ve proje ekibi._

- **[akademik_ve_toplumsal_etki] Hedeflenen Çıktılar (Makale, Lisansüstü Tez, Patent)**
  - *Açıklama:* Proje sonucunda beklenen akademik ve sosyo-ekonomik çıktıları listeleyiniz.

#### 📄 Zorunlu Başvuru Evrakları
- Proje Yürütücüsü ve Araştırmacı Özgeçmişleri (ARDSİS/AVESİS)
- Etik Kurul Onay Belgesi (Gerekli ise)
- Yasal/Özel İzin Belgeleri
- Makine-Teçhizat ve Sarf Malzeme Proforma Faturaları

---

### 17. TÜBİTAK 1501 - Sanayi Ar-Ge Projeleri Destekleme Programı (`tubitak_1501`)

- **Kurum:** TÜBİTAK
- **Eşleşme Anahtar Kelimeleri:** `1501, sanayi ar-ge destek, sanayi arge destek, sanayi ar-ge projeleri destekleme`
- **Özet:** KOBİ sınırı olmaksızın tüm sanayi kuruluşlarına açık Ar-Ge/yenilik destek programı. Proje bazında en fazla 36 ay destek süresi, %75 hibe (geri ödemesiz). Resmi başvuru AGY100/AGY101 formuyla PRODİS üzerinden yapılır — bu şema, TÜBİTAK'ın 'Proje Öneri Bilgileri Formu Hazırlama Kılavuzu' (AGY100-101) Bölüm A-E yapısını izler (1507 ile aynı form, farklı süre/kapsam kuralları).

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Kuruluş ve Proje Özeti (Bölüm A)
_Kuruluşun kısa tanıtımı ve projenin başlatılma gerekçesi, projenin amacı, anahtar kelimeler. Resmi formda 'Proje Kısa Tanıtımı' diğer tüm bölümler doldurulduktan sonra hazırlanması önerilen, değiştirilmeden Yürütme Komitesi'ne sunulan kritik bir bölümdür._

- **[kurulus_tanitimi] Kuruluşun kısa tanıtımı ve ana faaliyet alanı**
  - *Açıklama:* None
- **[baslatilma_gerekcesi] Projenin başlatılma gerekçesi (hangi ihtiyaç/sorun)**
  - *Açıklama:* None
- **[proje_amaci] Projenin amacı**
  - *Açıklama:* None
- **[anahtar_kelimeler] Anahtar kelimeler**
  - *Açıklama:* None

##### 📌 Endüstriyel Ar-Ge İçeriği, Teknoloji Düzeyi ve Yenilikçi Yön (Bölüm B)
_Teknolojik yenilik ve Ar-Ge unsuru içermeyen projeler desteklenmez — bu bölüm değerlendirmede belirleyici niteliktedir._

- **[cagri_hedefler] Projenin genel amacı ve önerilen çözüm ile ulaşılması planlanan hedefler**
  - *Açıklama:* None
- **[teknoloji_duzeyi] Tekniğin/teknolojinin bilinen güncel durumu (state-of-the-art)**
  - *Açıklama:* None
- **[teknik_belirsizlikler] Aşılması gereken teknik/teknolojik belirsizlik ve zorluklar**
  - *Açıklama:* None
- **[yenilikci_yon] Yenilikçi yönler (ürün/süreç yeniliği, mevcut ürün/sistemlerden farkı)**
  - *Açıklama:* None

##### 📌 Proje Planı ve Kuruluş Altyapısı (Bölüm C)
_İş paketleri, proje yönetimi, kuruluşun mevcut altyapısı ve risk yönetimi. 1501'de proje süresi en fazla 36 ay olduğu için iş paketi planlaması genellikle 1507'den daha kapsamlıdır._

- **[is_paketleri] İş paketleri ve iş-zaman planı (paket adı, süre, çıktı)**
  - *Açıklama:* None
- **[proje_yonetimi] Proje yönetimi ve organizasyonu (ekip görevleri)**
  - *Açıklama:* None
- **[kurulus_altyapisi] Kuruluşun mevcut Ar-Ge altyapısı (laboratuvar, donanım vb.)**
  - *Açıklama:* None
- **[risk_yonetimi] Öngörülen riskler ve alınacak önlemler**
  - *Açıklama:* None

##### 📌 Ekonomik Yarara ve Ulusal Kazanıma Dönüşebilirlik (Bölüm D)
_Proje çıktısının ticari başarı potansiyeli, ekonomik getiri tahmini ve ülke ekonomisine katkısı._

- **[ticari_potansiyel] Ticari başarı potansiyeli ve hedef pazar/müşteri**
  - *Açıklama:* None
- **[ekonomik_getiri] Beklenen ekonomik getiri (satış hasılatı, pazar payı artışı vb.)**
  - *Açıklama:* None
- **[ulusal_kazanim] Ulusal kazanımlar (ithalat azaltımı, istihdam, rekabet gücü vb.)**
  - *Açıklama:* None

##### 📌 Proje Bütçesi (Bölüm E)
_TÜBİTAK'ın resmi gider kalemleri (M011-M016) esas alınır. Katma değer vergisi, kâr payı, pazarlama/reklam, patent/marka tescil, kira, kırtasiye gibi giderler desteklenmez. Not: 1507'den farklı olarak, AGY100/AGY101 proje hazırlama/hazırlatma danışmanlık gideri 1501'de desteklenmez._

- **[personel_gideri] Personel gideri (M011)**
  - *Açıklama:* None
- **[seyahat_gideri] Seyahat gideri — yalnızca ulaşım (M012)**
  - *Açıklama:* None
- **[techizat_gideri] Alet/teçhizat/yazılım/yayın alımları (M013)**
  - *Açıklama:* None
- **[hizmet_alimi] Ar-Ge/test kuruluşlarına yaptırılan işler + hizmet/danışmanlık alımı (M014-M015)**
  - *Açıklama:* None
- **[malzeme_gideri] Malzeme ve sarf gideri (M016)**
  - *Açıklama:* None

#### 📄 Zorunlu Başvuru Evrakları
- Vergi levhası (onaylı)
- Kuruluşa ait en son tarihli noter onaylı imza sirküleri
- Ticaret Sicil Gazetesi (tescile ilişkin, ana sözleşme değişiklikleri dahil)
- Anahtar personel özgeçmişleri (ARBİS'e kayıtlı)
- Son hesap dönemine ait bilanço

---

### 18. TÜBİTAK 1505 - Üniversite-Sanayi İşbirliği Destek Programı (`tubitak_1505`)

- **Kurum:** TÜBİTAK
- **Eşleşme Anahtar Kelimeleri:** `1505, tubitak 1505, üniversite sanayi işbirliği, universite sanayi isbirligi`
- **Özet:** Üniversitelerdeki/araştırma kurumlarındaki bilgi birikiminin sanayiye aktarılarak ticari ürüne veya sürece dönüştürülmesi amacıyla yapılan ortak Ar-Ge projelerinin desteklenmesi.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Üniversite-Sanayi İşbirliği ve Projenin Özgün Değeri (Bölüm A)
_Müşteri kuruluş ile müşteri araştırmacı kuruluş arasındaki işbirliği modeli ve teknolojik yenilik._

- **[sanayi_ihtiyaci_ve_teknoloji] Sanayi Kuruluşunun İhtiyacı ve Ar-Ge Niteliği**
  - *Açıklama:* Sanayi ortağının çözmek istediği teknik problemi ve akademiden alınacak bilginin projedeki rolünü açıklayınız.
- **[akademik_ortak_ve_metodoloji] Üniversite/Araştırma Grubu Yetkinliği ve Yöntem**
  - *Açıklama:* Proje yürütücüsü akademisyenin uzmanlığını ve uygulanacak Ar-Ge yöntemini detaylandırınız.

##### 📌 Ticaretleşme Potansiyeli ve Bütçe Paylaşımı (Bölüm B)
_Proje çıktısının sanayide uygulanması, lisanslama ve maliyet paylaşım planı._

- **[ticarilesme_ve_hisse_planı] Ürün/Hizmet Satış Projeksiyonu ve Fikri Hak Paylaşımı**
  - *Açıklama:* Proje sonucunda ortaya çıkacak ürünün sanayi ortağı tarafından pazarlanması ve FMR paylaşım esaslarını belirtiniz.

#### 📄 Zorunlu Başvuru Evrakları
- Üniversite-Sanayi İşbirliği Sözleşmesi / Protokolü
- Akademik Yürütücü Özgeçmişi ve AVESİS Dökümü
- Sanayi Ortağı Ticaret Sicil Gazetesi ve Mali Tablolar
- Proje Bütçe Formları ve Proforma Faturalar

---

### 19. TÜBİTAK 1507 - KOBİ Ar-Ge Başlangıç Destek Programı (`tubitak_1507`)

- **Kurum:** TÜBİTAK
- **Eşleşme Anahtar Kelimeleri:** `1507, kobi ar-ge başlangıç, kobi arge baslangic`
- **Özet:** KOBİ ölçeğindeki işletmelerin Ar-Ge/yenilik projelerine yönelik ilk destek programı. Proje bazında en fazla 8 ay destek süresi, %75 hibe (geri ödemesiz). Resmi başvuru AGY100/AGY101 formuyla PRODİS üzerinden yapılır — bu şema, TÜBİTAK'ın 'Proje Öneri Bilgileri Formu Hazırlama Kılavuzu' (AGY100-101) Bölüm A-E yapısını izler.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Kuruluş ve Proje Özeti (Bölüm A)
_Kuruluşun kısa tanıtımı ve projenin başlatılma gerekçesi, projenin amacı, anahtar kelimeler. Resmi formda 'Proje Kısa Tanıtımı' diğer tüm bölümler doldurulduktan sonra hazırlanması önerilen, değiştirilmeden Yürütme Komitesi'ne sunulan kritik bir bölümdür._

- **[kurulus_tanitimi] Kuruluşun kısa tanıtımı ve ana faaliyet alanı**
  - *Açıklama:* None
- **[baslatilma_gerekcesi] Projenin başlatılma gerekçesi (hangi ihtiyaç/sorun)**
  - *Açıklama:* None
- **[proje_amaci] Projenin amacı**
  - *Açıklama:* None
- **[anahtar_kelimeler] Anahtar kelimeler**
  - *Açıklama:* None

##### 📌 Endüstriyel Ar-Ge İçeriği, Teknoloji Düzeyi ve Yenilikçi Yön (Bölüm B)
_Teknolojik yenilik ve Ar-Ge unsuru içermeyen projeler desteklenmez — bu bölüm değerlendirmede belirleyici niteliktedir._

- **[cagri_hedefler] Projenin genel amacı ve önerilen çözüm ile ulaşılması planlanan hedefler**
  - *Açıklama:* None
- **[teknoloji_duzeyi] Tekniğin/teknolojinin bilinen güncel durumu (state-of-the-art)**
  - *Açıklama:* None
- **[teknik_belirsizlikler] Aşılması gereken teknik/teknolojik belirsizlik ve zorluklar**
  - *Açıklama:* None
- **[yenilikci_yon] Yenilikçi yönler (ürün/süreç yeniliği, mevcut ürün/sistemlerden farkı)**
  - *Açıklama:* None

##### 📌 Proje Planı ve Kuruluş Altyapısı (Bölüm C)
_İş paketleri, proje yönetimi, kuruluşun mevcut altyapısı ve risk yönetimi._

- **[is_paketleri] İş paketleri ve iş-zaman planı (paket adı, süre, çıktı)**
  - *Açıklama:* None
- **[proje_yonetimi] Proje yönetimi ve organizasyonu (ekip görevleri)**
  - *Açıklama:* None
- **[kurulus_altyapisi] Kuruluşun mevcut Ar-Ge altyapısı (laboratuvar, donanım vb.)**
  - *Açıklama:* None
- **[risk_yonetimi] Öngörülen riskler ve alınacak önlemler**
  - *Açıklama:* None

##### 📌 Ekonomik Yarara ve Ulusal Kazanıma Dönüşebilirlik (Bölüm D)
_Proje çıktısının ticari başarı potansiyeli, ekonomik getiri tahmini ve ülke ekonomisine katkısı._

- **[ticari_potansiyel] Ticari başarı potansiyeli ve hedef pazar/müşteri**
  - *Açıklama:* None
- **[ekonomik_getiri] Beklenen ekonomik getiri (satış hasılatı, pazar payı artışı vb.)**
  - *Açıklama:* None
- **[ulusal_kazanim] Ulusal kazanımlar (ithalat azaltımı, istihdam, rekabet gücü vb.)**
  - *Açıklama:* None

##### 📌 Proje Bütçesi (Bölüm E)
_TÜBİTAK'ın resmi gider kalemleri (M011-M016) esas alınır. Katma değer vergisi, kâr payı, pazarlama/reklam, patent/marka tescil, kira, kırtasiye gibi giderler desteklenmez._

- **[personel_gideri] Personel gideri (M011)**
  - *Açıklama:* None
- **[seyahat_gideri] Seyahat gideri — yalnızca ulaşım (M012)**
  - *Açıklama:* None
- **[techizat_gideri] Alet/teçhizat/yazılım/yayın alımları (M013)**
  - *Açıklama:* None
- **[hizmet_alimi] Ar-Ge/test kuruluşlarına yaptırılan işler + hizmet/danışmanlık alımı (M014-M015)**
  - *Açıklama:* None
- **[malzeme_gideri] Malzeme ve sarf gideri (M016)**
  - *Açıklama:* None

#### 📄 Zorunlu Başvuru Evrakları
- Vergi levhası (onaylı)
- Kuruluşa ait en son tarihli noter onaylı imza sirküleri
- Ticaret Sicil Gazetesi (tescile ilişkin, ana sözleşme değişiklikleri dahil)
- Anahtar personel özgeçmişleri (ARBİS'e kayıtlı)
- Son hesap dönemine ait bilanço

---

### 20. TÜBİTAK 1512 - BİGG Bireysel Genç Girişim Destek Programı (`tubitak_1512`)

- **Kurum:** TÜBİTAK
- **Eşleşme Anahtar Kelimeleri:** `1512, bigg, tubitak 1512, bireysel genç girişim, bigg sermaye desteği`
- **Özet:** Girişimcilerin teknoloji ve yenilik odaklı iş fikirlerini nitelikli iş planlarına dönüştürerek sermaye desteğiyle şirketleşmelerini sağlayan program.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 İş Fikri, Teknolojik Yenilik ve Değer Önerisi (Bölüm A)
_Teknolojik iş fikrinin özgünlüğü, yenilikçi yönü ve çözdüğü pazar problemi._

- **[teknolojik_is_fikri_detayi] Teknolojik İş Fikri ve Ar-Ge/Yenilik Unsuru**
  - *Açıklama:* İş fikrinizin temel teknolojisini, yenilikçi yönlerini ve mevcut çözümlerden farkını detaylandırınız.
- **[hedef_pazar_ve_musteri_dogrulama] Hedef Müşteri Segmenti ve Pazar Büyüklüğü**
  - *Açıklama:* Hedef kitlenizi, pazardaki problemi ve yaptığınız doğrulama/görüşme çalışmalarını açıklayınız.

##### 📌 Şirketleşme Yol Haritası ve Bütçe (Bölüm B)
_Kurulacak şirket yapısı, ilk prototip maliyetleri ve personel bütçesi._

- **[prototip_ve_harcama_planı] BİGG Sermaye Desteği Harcama ve İş Paketleri Planı**
  - *Açıklama:* Girişim sermayesi ile yapılacak yazılım/donanım, personel ve şirket kuruluş harcamalarını detaylandırınız.

#### 📄 Zorunlu Başvuru Evrakları
- Girişimci Lisans / Lisansüstü Öğrenci veya Mezuniyet Belgesi
- Uygulayıcı Kuruluş Onay / Değerlendirme Raporu
- İş Fikri Sunum Panosu ve Prototip Şeması
- Girişimci Özgeçmişi

---

### 21. TÜBİTAK 1711 - Yapay Zeka Ekosistem Çağrısı (`tubitak_1711`)

- **Kurum:** TÜBİTAK
- **Eşleşme Anahtar Kelimeleri:** `1711, yapay zeka ekosistem, yapay zeka kredi`
- **Özet:** Özel sektörün ihtiyaç duyduğu yapay zeka çözümlerinin yerli teknoloji geliştirici KOBİ'ler ve üniversiteler/araştırma merkezleri iş birliğiyle geliştirilmesini sağlayan öncelikli alan Ar-Ge destek programı.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Konsorsiyum ve Proje Özeti (Bölüm A)
_Müşteri kuruluş, teknoloji sağlayıcı KOBİ ve üniversite/araştırma merkezinden oluşan konsorsiyum yapısı ve projenin amacı._

- **[konsorsiyum_yapisi] Konsorsiyum ortakları ve görev dağılımı**
  - *Açıklama:* 
- **[musteri_ihtiyaci] Müşteri kuruluşun yapay zeka alanındaki problemi/ihtiyacı**
  - *Açıklama:* 
- **[proje_amaci] Projenin genel amacı**
  - *Açıklama:* 

##### 📌 Yapay Zeka Modeli, Veri Seti ve Yenilikçi Yön (Bölüm B)
_Kullanılacak veri setleri, veri gizliliği, YZ algoritma/mimari seçimi ve teknik zorluklar._

- **[veri_seti_ve_gizlilik] Kullanılacak veri setleri, boyutu ve etiketleme/gizlilik süreçleri**
  - *Açıklama:* 
- **[yz_model_mimarisi] Geliştirilecek YZ modeli, algoritma ve kullanılacak mimari**
  - *Açıklama:* 
- **[teknik_zorluklar] Aşılması gereken teknik belirsizlikler ve doğrulama metrikleri (Accuracy, F1 vb.)**
  - *Açıklama:* 

##### 📌 Ürüne Dönüştürme ve Müşteri Entegrasyonu (Bölüm C)
_Geliştirilen YZ modelinin müşteri kuruluşun canlı sistemlerine entegrasyonu ve ticarileşme potansiyeli._

- **[canliya_alma_plani] YZ modelinin müşteri ortamına entegrasyonu ve canlıya alma planı**
  - *Açıklama:* 
- **[ticari_potansiyel] Çözümün yaygınlaşma ve başka müşterilere satılma potansiyeli**
  - *Açıklama:* 

#### 📄 Zorunlu Başvuru Evrakları
- Konsorsiyum İş Birliği Protokolü
- Müşteri Kuruluş Niyet Mektubu / Taahhütname
- Veri Paylaşımı ve Gizlilik Sözleşmesi Taslağı
- Firma Vergi Levhaları ve İmza Sirküleri

---

### 22. TÜBİTAK 1831 - Yeşil İnovasyon Teknoloji Mentorluk Desteği (`tubitak_1831`)

- **Kurum:** TÜBİTAK
- **Eşleşme Anahtar Kelimeleri:** `1831, yeşil inovasyon, yesil inovasyon, mentorluk desteği`
- **Özet:** KOBİ'lerin yeşil dönüşüm (karbon ayak izi azaltımı, döngüsel ekonomi, kaynak verimliliği) süreçlerinde alacakları teknik mentorluk ve danışmanlık hizmetlerinin desteklenmesi.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Mevcut Durum ve Yeşil Dönüşüm İhtiyacı (Bölüm A)
_İşletmenin enerji, kaynak ve atık yönetimindeki mevcut durumu ve yeşil dönüşüm hedefleri._

- **[mevcut_durum] İşletmenin mevcut üretim ve enerji/kaynak tüketim yapısı**
  - *Açıklama:* 
- **[yesil_donusum_hedefi] Karbon ayak izi azaltımı ve yeşil dönüşüm hedefleri**
  - *Açıklama:* 

##### 📌 Mentorluk Hizmeti ve Çalışma Planı (Bölüm B)
_Alınacak danışmanlık/mentorluk hizmetinin kapsamı ve rehberlik altyapısı._

- **[mentor_bilgisi] TÜBİTAK Havuzundan Seçilen Mentor / Danışman bilgileri**
  - *Açıklama:* 
- **[hizmet_kapsami] Mentorluk sürecinde gerçekleştirilecek analiz ve yol haritası çalışmaları**
  - *Açıklama:* 

#### 📄 Zorunlu Başvuru Evrakları
- Mentorluk Hizmet Sözleşmesi Taslağı
- KOBİ Beyannamesi
- Son yıla ait Enerji / Kaynak Tüketim Belgeleri

---

### 23. AB Ufuk Avrupa / EIC Accelerator Programı (`ufuk_avrupa_eic`)

- **Kurum:** Avrupa Birliği (AB)
- **Eşleşme Anahtar Kelimeleri:** `ufuk avrupa, eic accelerator, horizon europe`
- **Özet:** Radyal yenilikçi, yüksek riskli ve yüksek büyüme potansiyeline sahip derin teknoloji (Deep-Tech) girişimlerinin ticari ölçeklenmesini destekleyen hibe ve karma finansman programı.

#### 📂 Başvuru Raporu Bölümleri (Sections) & Alanlar
##### 📌 Mükemmeliyet ve Derin Teknoloji Yeniliği (Excellence - Section 1)
_Teknolojinin radyal yenilik derecesi, TRL (Teknoloji Hazırlık Seviyesi) ve patent/fikri mülkiyet durumu._

- **[radikal_yenilik_ve_trl] Radyal Yenilik Tanımı ve Mevcut TRL Seviyesi**
  - *Açıklama:* Çözümün mevcut piyasa teknolojilerinden farkını ve TRL seviyesini (Mevcut TRL 5-6 -> Hedef TRL 8-9) açıklayınız.
- **[fikri_mulkiyet_haklari] Fikri ve Sınai Mülkiyet (IPR) Stratejisi**
  - *Açıklama:* Patente konu buluşlar, koruma stratejisi ve özgür uygulama (Freedom to Operate) durumunu belirtiniz.

##### 📌 Pazar Etkisi ve Ölçeklenme Potansiyeli (Impact - Section 2)
_AB ölçeğinde pazar büyüklüğü, ticari model ve ölçeklenme (Scale-up) projeksiyonu._

- **[pazar_boyutu_ve_go_to_market] Pazar Büyüklüğü (TAM/SAM/SOM) ve Pazara Giriş Stratejisi**
  - *Açıklama:* Avrupa ve küresel pazar büyüklüğünü, gelir modelini ve müşteri edinim stratejisini detaylandırınız.

#### 📄 Zorunlu Başvuru Evrakları
- EIC Pitch Deck Sunumu
- Freedom to Operate (FTO) Analiz Raporu
- Finansal Projeksiyon ve Bütçe Tablosu
- Şirket Kurucuları ve Ana Ekip Özgeçmişleri (CV)

---

