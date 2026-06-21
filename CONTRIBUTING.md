# 🌿 Katkı Rehberi & Git Çalışma Akışı

GravioAI ekibi **Git Flow** benzeri bir dallanma modeli kullanır. Bu kurallara herkes uyar.

## 🔒 Temel Kural

> **`main` üzerinde doğrudan çalışmak YASAKTIR.**
> Hiç kimse `main`'e veya `develop`'a doğrudan commit atmaz. Tüm çalışma kendi özel dalında yapılır, oradan `develop`'a merge edilir.

## 🌳 Dal Yapısı

```
main (production)         ← yalnızca onaylı, kararlı sürümler
  └── develop             ← ekibin ortak entegrasyon dalı (herkes buradan dallanır)
        ├── feat_frontend     ← örn. frontend çalışması
        ├── feat_backend      ← örn. backend çalışması
        ├── feat_matching     ← örn. eşleştirme ajanı
        └── ...               ← her iş için ayrı dal
```

| Dal | Amaç | Kim push eder? |
|---|---|---|
| `main` | Production / kararlı sürüm | Kimse doğrudan; yalnızca `develop`'tan release merge |
| `develop` | Ortak entegrasyon dalı | Yalnızca onaylı PR merge'leri ile |
| `feat_*` / `fix_*` | Tekil iş/özellik dalları | Geliştirici kendi dalına |

## 🏷️ Dal İsimlendirme

İş türüne göre önek kullan, küçük harf ve `_` ile:

- `feat_<konu>` — yeni özellik (örn. `feat_frontend`, `feat_profile_agent`)
- `fix_<konu>` — hata düzeltme (örn. `fix_chat_scroll`)
- `docs_<konu>` — dokümantasyon (örn. `docs_readme`)
- `chore_<konu>` — yapılandırma/bakım (örn. `chore_ci`)

## 🔄 Çalışma Akışı (Adım Adım)

### 1. Güncel `develop`'tan dalını aç
```bash
git checkout develop
git pull origin develop
git checkout -b feat_frontend     # işine uygun isim ver
```

### 2. Çalış ve commit'le
```bash
git add .
git commit -m "feat: sohbet arayüzü iskeleti"
```
> ⚠️ Commit mesajlarında dış araç/AI ismi geçmez.

### 3. Dalını uzağa pushla
```bash
git push -u origin feat_frontend
```

### 4. `develop`'a Pull Request aç
- GitHub'da **base: `develop`** ← **compare: `feat_frontend`** olacak şekilde PR aç.
- En az bir takım arkadaşı **review/onay** verir.
- Onaylanınca `develop`'a **merge** edilir.

### 5. Release: `develop` → `main`
Sürüm production'a hazır olduğunda (sprint sonu / kararlı durum):
- **base: `main`** ← **compare: `develop`** PR'ı açılır.
- Onaylandığında `main`'e merge edilir.

## 📝 Commit Mesajı Biçimi

`<tür>: <kısa açıklama>` — örnekler:

```
feat: eşleştirme ajanına pgvector araması eklendi
fix: profil çıkarmada il alanı boş kalıyordu
docs: README mimari diyagramı güncellendi
chore: requirements.txt bağımlılıkları sabitlendi
```

Türler: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`

## ✅ PR Açmadan Önce Kontrol Listesi

- [ ] Dalım güncel `develop`'tan açıldı
- [ ] Commit mesajları biçime uygun
- [ ] `main`'e doğrudan bir şey push etmedim
- [ ] PR base dalı doğru (`develop`)
- [ ] Bir takım arkadaşından review istedim
