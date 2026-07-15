# Wireframe — Sohbet Akışı

**Jira**: SCRUM-175 (SCRUM-22 / Chat flow oluşturulması altında)
**Amaç**: `01-kullanici-akisi.md`'deki niyet dallanmasının ekranda nasıl karşılık bulduğunu, düşük çözünürlüklü (low-fidelity) olarak göstermek.

Not: Yüksek çözünürlüklü/piksel-mükemmel tasarım zaten `frontend/components/ChatView.tsx` içinde var (Claude Design prototipinden gelmişti). Burada amaç görsel cila değil, **her niyetin hangi UI bloklarını tetiklediğini** netleştirmek — SCRUM-173 (responsive) ve SCRUM-96 (routing) bu blokları referans alacak.

---

## 1. Masaüstü — temel düzen (mevcut, değişmiyor)

```
┌───────────┬──────────────────────────────────────────────┐
│           │  Gravio Asistan            [Eşleşmeleri gör]  │
│  Sidebar  ├──────────────────────────────────────────────┤
│           │                                                │
│ [+ Yeni]  │     (mesaj akışı, aşağıda niyete göre bloklar) │
│ Sohbet    │                                                │
│ Eşleşmeler│                                                │
│ Profil    │                                                │
│           ├──────────────────────────────────────────────┤
│           │  [takip önerisi çipleri]                       │
│           │  [ giriş kutusu                      ] [gönder]│
└───────────┴──────────────────────────────────────────────┘
```

## 2. Niyete göre mesaj blokları

### `greeting` / `off_topic` — sadece metin
```
┌──────────────────────────────────────────┐
│ 🔶 Gravio Asistan                          │
│ "Merhaba! İşletmeni anlatırsan sana uygun  │
│  destekleri bulabilirim."                  │
└──────────────────────────────────────────┘
```
Profil çipi yok, kart yok, takip önerisi yok — akış kısa kesiliyor.

### `profile_info` — tam zincir (bugünkü davranış)
```
┌──────────────────────────────────────────┐
│ 🏷 ÇIKARILAN İŞLETME PROFİLİ                │
│ [Sektör: Yazılım] [Şehir: Düzce] [Ekip: 3] │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│ 🟧 BİGG 2024          [Uygun · 82/100] >   │
│    KOSGEB · Hibe          200.000 TL      │
├──────────────────────────────────────────┤
│ 🟧 Teknogirişim         [Kısmi · 55/100] > │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│ 🔶 "Profiline göre 2 uygun destek buldum…"  │
└──────────────────────────────────────────┘
[ BİGG 2024 başvurusunu hazırla ]  [ Daha fazla destek göster ]
```

### `program_question` — sadece kartlar (profil çipi yok)
```
┌──────────────────────────────────────────┐
│ 🟧 Ar-Ge Merkezi Desteği     [Bilgi]     > │
├──────────────────────────────────────────┤
│ 🟧 Teknopark Vergi Muafiyeti [Bilgi]     > │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│ 🔶 "İşte Ar-Ge ile ilgili 2 program…"       │
└──────────────────────────────────────────┘
```
Not: Profil bilgisi olmadığı için uygunluk skoru yerine "Bilgi" rozeti — bu, adapter katmanında yeni bir rozet durumu gerektirir (mevcut `eligBadgeStyle` üç durum biliyor: full/partial/locked; dördüncü bir "unscored" state eklenmeli).

### `apply_request` — doğrudan CTA
```
┌──────────────────────────────────────────┐
│ 🔶 "BİGG için başvuru taslağını hazırlıyorum" │
└──────────────────────────────────────────┘
        [ Başvuru taslağını aç → ]
```

## 3. Mobil düzen (SCRUM-173 ile birlikte — henüz yok, hedef)

Şu an `ChatView.tsx` tamamen sabit piksel (`maxWidth: 760`, inline style) — mobilde sidebar ekranın büyük kısmını kaplar. Hedef:

```
┌────────────────────────┐
│ ☰  Gravio Asistan   ⋮  │  <- sidebar hamburger'a döner
├────────────────────────┤
│                        │
│   (mesaj akışı %100    │
│    genişlik, kart       │
│    genişlikleri de %100)│
│                        │
├────────────────────────┤
│ [takip çipleri]         │
│ [giriş kutusu] [gönder] │
└────────────────────────┘
```

Kırılma noktası önerisi: `768px` altı → sidebar gizlenir/hamburger, mesaj balonu `max-width` %100'e yakın, kart satırındaki tutar bilgisi alt satıra düşer.

## 4. Sonraki adım

`03-prompt-akisi.md` ile her niyetin classifier ve ajan promptlarını tanımlayıp Faz 2'ye (SCRUM-96 kodlaması) geçilecek.
