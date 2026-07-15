/**
 * Panelim ekranı.
 *
 * Gerçek verilere bağlı: `profile` sohbetten çıkarılan (ve oturumda kalıcı
 * olan) BackendUserProfile'dır, `programs` ise en son bilinen eşleşmelerdir.
 * İkisi de boşsa henüz sohbet edilmemiş demektir — boş durum gösterilir.
 */
"use client";
import Ms from "./Ms";
import { profileToChips } from "@/lib/adapter";
import type { BackendUserProfile } from "@/lib/api";
import type { Program } from "@/lib/types";

export default function DashboardView({
  profile,
  programs,
  onOpenProgram,
}: {
  profile: BackendUserProfile | null;
  programs: Program[];
  onOpenProgram: (id: string) => void;
}) {
  const chips = profile ? profileToChips(profile) : [];

  const upcoming = programs
    .filter((p) => p.deadlineDays != null)
    .sort((a, b) => (a.deadlineDays as number) - (b.deadlineDays as number))
    .slice(0, 5);

  return (
    <section data-screen-label="Panelim" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 32px 60px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#14222c", margin: 0, letterSpacing: "-.01em" }}>Panelim</h1>
        <p style={{ fontSize: 14, color: "#5a6b75", marginTop: 6 }}>
          İşletme profilin ve yaklaşan son tarihler.
        </p>

        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 26 }}>
          İşletme profili
        </h2>
        {chips.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {chips.map((ch) => (
              <div
                key={ch.label}
                style={{ display: "flex", flexDirection: "column", gap: 1, padding: "9px 14px", borderRadius: 11, background: "#fff", border: "1px solid #e7e4dc" }}
              >
                <span style={{ fontSize: 10, fontWeight: 600, color: "#97a2aa", textTransform: "uppercase", letterSpacing: ".04em" }}>{ch.label}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "#27353e" }}>{ch.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 12, padding: "16px 18px", background: "#fff", border: "1px solid #e7e4dc", borderRadius: 12, fontSize: 13.5, color: "#8a96a0" }}>
            Henüz profil çıkarılmadı — sohbet ekranında işletmeni anlat.
          </div>
        )}

        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 28 }}>
          Yaklaşan son tarihler
        </h2>
        {upcoming.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {upcoming.map((p) => {
              const days = p.deadlineDays as number;
              const urgent = days < 30;
              return (
                <button
                  key={p.id}
                  onClick={() => onOpenProgram(p.id)}
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
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#27353e" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#8a96a0", marginTop: 2 }}>{p.deadlineText}</div>
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
                    {days} gün kaldı
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ marginTop: 12, padding: "16px 18px", background: "#fff", border: "1px solid #e7e4dc", borderRadius: 12, fontSize: 13.5, color: "#8a96a0" }}>
            Yaklaşan bir son tarih yok.
          </div>
        )}
      </div>
    </section>
  );
}
