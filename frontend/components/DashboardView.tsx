"use client";
import Ms from "./Ms";
import type { ProfileChip } from "@/lib/types";

const PROFILE_CHIPS: ProfileChip[] = [
  { label: "Sektör", value: "AI / Yazılım" },
  { label: "İl", value: "Düzce" },
  { label: "Ekip", value: "3 kişi" },
  { label: "Kuruluş", value: "< 1 yıl" },
  { label: "Hedef", value: "Ar-Ge + İstihdam" },
  { label: "Altyapı", value: "Bulut / sunucusuz" },
];

const DEADLINES: { id: string; name: string; dateText: string; days: number }[] = [
  { id: "bigg", name: "TÜBİTAK 1512 BİGG", dateText: "15 Tem 2026", days: 18 },
  { id: "marka", name: "MARKA Proje Teklif Çağrısı", dateText: "30 Eyl 2026", days: 95 },
];

export default function DashboardView({ onOpenProgram }: { onOpenProgram: (id: string) => void }) {
  return (
    <section data-screen-label="Panelim" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 32px 60px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#14222c", margin: 0, letterSpacing: "-.01em" }}>Panelim</h1>
        <p style={{ fontSize: 14, color: "#5a6b75", marginTop: 6 }}>Nova AI Yazılım profili ve yaklaşan son tarihler.</p>

        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 26 }}>
          İşletme profili
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {PROFILE_CHIPS.map((ch) => (
            <div
              key={ch.label}
              style={{ display: "flex", flexDirection: "column", gap: 1, padding: "9px 14px", borderRadius: 11, background: "#fff", border: "1px solid #e7e4dc" }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, color: "#97a2aa", textTransform: "uppercase", letterSpacing: ".04em" }}>{ch.label}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#27353e" }}>{ch.value}</span>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 28 }}>
          Yaklaşan son tarihler
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {DEADLINES.map((d) => {
            const urgent = d.days < 30;
            return (
              <button
                key={d.id}
                onClick={() => onOpenProgram(d.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  textAlign: "left",
                  background: "#fff",
                  border: "1px solid #e7e4dc",
                  borderRadius: 13,
                  padding: "14px 16px",
                }}
              >
                <Ms name="event" size={20} color={urgent ? "#b45309" : "#0f6ea8"} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#27353e" }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: "#8a96a0", marginTop: 2 }}>Son başvuru {d.dateText}</div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "5px 11px",
                    borderRadius: 999,
                    background: urgent ? "#fdf6e3" : "#eaf7ee",
                    color: urgent ? "#b45309" : "#15803d",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.days} gün kaldı
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
