/**
 * Başvurularım ekranı — bir programa "Başvuru hazırla" dendiği andan itibaren
 * `applications` tablosunda takip edilen kayıtları listeler. Eşleşmelerim'den
 * kasıtlı olarak ayrı: orası "sana uygun olabilecek programlar", burası
 * "başvurmaya başladığın programlar ve ilerleme durumları".
 */
"use client";
import Ms from "./Ms";
import type { ApplicationTrackingStatus, BackendApplicationRecord } from "@/lib/api";

const STATUS_ORDER: ApplicationTrackingStatus[] = ["taslak", "hazirlaniyor", "gonderildi"];

const STATUS_META: Record<ApplicationTrackingStatus, { label: string; color: string; bg: string; border: string }> = {
  taslak: { label: "Taslak", color: "var(--ink-600)", bg: "var(--paper-100)", border: "var(--border-subtle)" },
  hazirlaniyor: { label: "Hazırlanıyor", color: "var(--teal-700)", bg: "var(--teal-100)", border: "var(--teal-100)" },
  gonderildi: { label: "Gönderildi", color: "var(--success-700)", bg: "var(--success-100)", border: "var(--success-200)" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function ApplicationsView({
  applications,
  onOpenProgram,
  onGoToMatches,
  onChangeStatus,
}: {
  applications: BackendApplicationRecord[];
  onOpenProgram: (id: string) => void;
  onGoToMatches: () => void;
  onChangeStatus: (id: string, status: ApplicationTrackingStatus) => void;
}) {
  const isEmpty = applications.length === 0;
  const sorted = [...applications].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return (
    <section data-screen-label="Başvurularım" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 32px 60px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-900)", margin: 0, letterSpacing: "-.01em" }}>
          Başvurularım
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-600)", marginTop: 6 }}>
          {isEmpty
            ? "Henüz başvuru başlatmadın."
            : `${sorted.length} program için başvuru sürecin burada — durumunu güncel tut.`}
        </p>

        {isEmpty ? (
          <div
            style={{
              marginTop: 22,
              padding: "34px 24px",
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 14,
              textAlign: "center",
            }}
          >
            <Ms name="assignment" size={32} color="var(--border-subtle)" />
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)", marginTop: 12 }}>
              Henüz başvuru başlatmadın
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-400)", marginTop: 6, maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
              Eşleşmelerim'den bir programı aç ve "Başvuru hazırla" de — süreç burada takip edilebilir hale gelir.
            </div>
            <button
              onClick={onGoToMatches}
              style={{
                marginTop: 16,
                padding: "10px 18px",
                borderRadius: 10,
                background: "linear-gradient(160deg,var(--terracotta-600),var(--terracotta-700))",
                color: "#fff",
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              Eşleşmelerime git
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
            {sorted.map((app) => {
              const meta = STATUS_META[app.status];
              return (
                <div
                  key={app.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 14,
                    padding: 18,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <button
                      onClick={() => onOpenProgram(app.program_id)}
                      style={{ textAlign: "left", fontSize: 15, fontWeight: 700, color: "var(--ink-900)", lineHeight: 1.3 }}
                    >
                      {app.program_name}
                    </button>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: meta.bg,
                        color: meta.color,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 4 }}>
                    Son güncelleme: {formatDate(app.updated_at)}
                  </div>

                  {app.note && (
                    <div style={{ fontSize: 12.5, color: "var(--ink-600)", marginTop: 8, lineHeight: 1.5 }}>{app.note}</div>
                  )}

                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    {STATUS_ORDER.map((s) => {
                      const active = s === app.status;
                      const m = STATUS_META[s];
                      return (
                        <button
                          key={s}
                          onClick={() => onChangeStatus(app.id, s)}
                          disabled={active}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "6px 12px",
                            borderRadius: 999,
                            border: `1px solid ${active ? m.border : "var(--border-subtle)"}`,
                            background: active ? m.bg : "var(--surface)",
                            color: active ? m.color : "var(--ink-400)",
                            cursor: active ? "default" : "pointer",
                          }}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}