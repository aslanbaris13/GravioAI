"use client";
import { useState } from "react";
import type { CSSProperties } from "react";
import Ms from "./Ms";

/**
 * Programı yürüten kurumun logosu.
 *
 * Logolar `public/orgs/` altından okunur. Dosya yoksa ya da yüklenemezse
 * bileşen sessizce kategori ikonuna döner — yani eksik bir logo ekranı
 * bozmaz, sadece eski görünüme dönülür.
 *
 * Kurum adları veri kaynağında serbest metin ("KOSGEB", "TÜBİTAK 1501",
 * "TÜBITAK") olduğu için eşleştirme tam eşitlik yerine desenle yapılır.
 */
const ORG_LOGOS: { pattern: RegExp; src: string }[] = [
  { pattern: /kosgeb/, src: "/orgs/kosgeb.png" },
  { pattern: /tubitak/, src: "/orgs/tubitak.png" },
];

/**
 * Kurum adını aksansız küçük harfe indirger.
 *
 * Doğrudan `/tübitak/i` ile eşleştirmek ÇALIŞMAZ: veri "TÜBİTAK" yazıyor ve
 * Türkçe noktalı büyük İ (U+0130), JS'in `i` bayrağıyla `i` harfine
 * katlanmıyor — regex sessizce hiç eşleşmiyor. NFD ile ayrıştırıp birleşen
 * aksan işaretlerini atınca İ→I, Ü→U olur; noktasız ı ayrıca eşlenir.
 */
function normalizeOrg(org: string): string {
  return org
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .toLowerCase();
}

export function orgLogoSrc(org?: string | null): string | null {
  if (!org) return null;
  const key = normalizeOrg(org);
  return ORG_LOGOS.find((o) => o.pattern.test(key))?.src ?? null;
}

export default function OrgLogo({
  org,
  icon,
  wrapStyle,
  iconSize = 28,
}: {
  org?: string | null;
  /** Logo bulunamazsa gösterilecek kategori ikonu (Material Symbols adı). */
  icon: string;
  /** Kart/detay ekranındaki mevcut ikon kutusu stili. */
  wrapStyle: CSSProperties;
  iconSize?: number;
}) {
  const src = orgLogoSrc(org);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div style={wrapStyle}>
        <Ms name={icon} size={iconSize} />
      </div>
    );
  }

  // Logoların en/boy oranı çok farklı (KOSGEB yatık ~2.3, TÜBİTAK dikey ~0.75).
  // Kare kutuya sığdırmak ikisini de gereksiz küçültüyor; bu yüzden yükseklik
  // kategori kutusuyla aynı kalır, genişlik logonun oranına göre büyür.
  const box = Number(wrapStyle.height) || 44;

  return (
    <div
      style={{
        ...wrapStyle,
        // Kurum logoları kendi renklerini taşır — kategori rengi yerine nötr
        // açık bir zemin veriliyor ki logo her kategoride aynı okunsun.
        background: "var(--surface-strong)",
        border: "1px solid var(--border-subtle)",
        height: box,
        width: "auto",
        minWidth: box,
        maxWidth: box * 2.4,
        padding: "8px 10px",
      }}
    >
      <img
        src={src}
        alt={org ?? ""}
        onError={() => setFailed(true)}
        style={{ height: "100%", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }}
      />
    </div>
  );
}
