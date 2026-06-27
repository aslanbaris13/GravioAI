/**
 * Eşleşmeler ekranı.
 *
 * Programlar artık `programs` prop'u üzerinden gelir.
 * - Chat'ten gelen `apiPrograms` varsa onlar gösterilir (gerçek backend verisi).
 * - Liste boşsa yükleniyor/boş durumu gösterilir.
 * İstatistikler ve filtreler dinamik olarak hesaplanır.
 */
"use client";
import Ms from "./Ms";
import { toVM } from "@/lib/viewmodel";
import type { Program, ProgramCategory } from "@/lib/types";

const CAT_FILTERS: { key: "all" | ProgramCategory; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "kamu", label: "Kamu" },
  { key: "vergi", label: "Vergi & Lokasyon" },
  { key: "bulut", label: "Bulut & Yazılım" },
  { key: "hizlandirici", label: "Hızlandırıcı" },
  { key: "yatirim", label: "Yatırım" },
  { key: "yarisma", label: "Yarışma" },
  { key: "global", label: "Global" },
];

export default function MatchesView({
  programs,
  filterCat,
  onFilterChange,
  onOpenProgram,
}: {
  programs: Program[];
  filterCat: "all" | ProgramCategory;
  onFilterChange: (cat: "all" | ProgramCategory) => void;
  onOpenProgram: (id: string) => void;
}) {
  const filtered =
    filterCat === "all" ? programs : programs.filter((p) => p.category === filterCat);

  // Dinamik istatistikler
  const fullCount = programs.filter((p) => p.elig.state === "full").length;
  const nearestDeadlineDays = programs
    .map((p) => p.deadlineDays)
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b)[0];

  const stats = [
    { icon: "auto_awesome", label: "Toplam eşleşme", value: String(programs.length || "—") },
    { icon: "check_circle", label: "Tam uygun", value: programs.length ? String(fullCount) : "—" },
    {
      icon: "schedule",
      label: "Yaklaşan son tarih",
      value: nearestDeadlineDays != null ? `${nearestDeadlineDays} gün` : "—",
    },
  ];

  const isEmpty = programs.length === 0;

  return (
    <section data-screen-label="Eşleşmelerim" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "30px 32px 60px" }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, color: "#14222c", letterSpacing: "-.02em", margin: 0 }}>
          Eşleşmelerim
        </h1>
        <p style={{ fontSize: 14, color: "#5a6b75", marginTop: 6 }}>
          {isEmpty
            ? "Henüz eşleşme yok — chat ekranında işletmeni anlat."
            : `Profiline göre bulunan ${programs.length} fırsat, uygunluk durumuna göre sıralandı.`}
        </p>

        {/* İstatistik kartları */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 22 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                background: "#fff",
                border: "1px solid #e7e4dc",
                borderRadius: 14,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: "#fff3ea",
                  color: "#ea580c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Ms name={s.icon} size={21} />
              </div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 700, color: "#14222c", lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#8a96a0", marginTop: 1 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Boş durum */}
        {isEmpty && (
          <div
            style={{
              marginTop: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "40px 24px",
              background: "#fff",
              border: "1px solid #e7e4dc",
              borderRadius: 18,
            }}
          >
            <Ms name="search_off" size={40} color="#d0cdc4" />
            <div style={{ fontSize: 17, fontWeight: 700, color: "#27353e", marginTop: 14 }}>
              Henüz eşleşme bulunamadı
            </div>
            <div style={{ fontSize: 14, color: "#8a96a0", marginTop: 8, maxWidth: 380, lineHeight: 1.6 }}>
              Chat ekranında işletmeni anlat; Gravio profilini çıkarıp sana uygun
              destek programlarını buraya listeleyecek.
            </div>
          </div>
        )}

        {/* Filtreler — yalnızca program varsa göster */}
        {!isEmpty && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 26 }}>
              {CAT_FILTERS.map((f) => {
                const active = f.key === filterCat;
                // Filtrede o kategoriden program yoksa soluklaştır
                const count =
                  f.key === "all" ? programs.length : programs.filter((p) => p.category === f.key).length;
                if (count === 0 && f.key !== "all") return null;
                return (
                  <button
                    key={f.key}
                    onClick={() => onFilterChange(f.key)}
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: "8px 15px",
                      borderRadius: 999,
                      border: active ? "1px solid #ea580c" : "1px solid #e3e0d8",
                      background: active ? "#fff3ea" : "#fff",
                      color: active ? "#ea580c" : "#5a6b75",
                    }}
                  >
                    {f.label}
                    {f.key !== "all" && (
                      <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7 }}>({count})</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 22 }}>
              {filtered.map((p) => {
                const c = toVM(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => onOpenProgram(p.id)}
                    style={{
                      textAlign: "left",
                      background: "#fff",
                      border: "1px solid #e7e4dc",
                      borderRadius: 16,
                      padding: 18,
                      boxShadow: "0 1px 2px rgba(20,34,44,.04)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 13,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={c.iconWrapStyle}>
                        <Ms name={c.icon} size={22} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#14222c", lineHeight: 1.25 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#8a96a0", marginTop: 2 }}>{c.org}</div>
                      </div>
                      <span style={c.statusBadgeStyle}>
                        <span style={c.statusDotStyle} />
                        {c.statusLabel}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 19, fontWeight: 800, color: "#ea580c", fontVariantNumeric: "tabular-nums" }}>
                        {c.amountDisplayText}
                      </span>
                      <span style={{ fontSize: 11.5, color: "#97a2aa", fontWeight: 600 }}>{c.amountSub}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={c.eligBadgeStyle}>
                        <Ms name={c.eligIconName} size={14} />
                        {c.eligLabel}
                      </span>
                      <span style={{ fontSize: 11.5, color: "#97a2aa" }}>{c.deadlineText}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
