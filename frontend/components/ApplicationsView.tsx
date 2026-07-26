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
  taslak: { label: "Taslak", color: "#76858d", bg: "#f4f3ee", border: "#e3e0d8" },
  hazirlaniyor: { label: "Hazırlanıyor", color: "#0f6ea8", bg: "#eef6fb", border: "#dde9f2" },
  gonderildi: { label: "Gönderildi", color: "#15803d", bg: "#eaf7ee", border: "#d3ecd9" },
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
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#14222c", margin: 0, letterSpacing: "-.01em" }}>
          Başvurularım
        </h1>
        <p style={{ fontSize: 14, color: "#5a6b75", marginTop: 6 }}>
          {isEmpty
            ? "Henüz başvuru başlatmadın."
            : `${sorted.length} program için başvuru sürecin burada — durumunu güncel tut.`}
        </p>

        {isEmpty ? (
          <div
            style={{
              marginTop: 22,
              padding: "34px 24px",
              background: "#fff",
              border: "1px solid #e7e4dc",
              borderRadius: 14,
              textAlign: "center",
            }}
          >
            <Ms name="assignment" size={32} color="#d0cdc4" />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#27353e", marginTop: 12 }}>
              Henüz başvuru başlatmadın
            </div>
            <div style={{ fontSize: 13, color: "#8a96a0", marginTop: 6, maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
              Eşleşmelerim'den bir programı aç ve "Başvuru hazırla" de — süreç burada takip edilebilir hale gelir.
            </div>
            <button
              onClick={onGoToMatches}
              style={{
                marginTop: 16,
                padding: "10px 18px",
                borderRadius: 10,
                background: "linear-gradient(160deg,#f97316,#ea580c)",
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
                    background: "#fff",
                    border: "1px solid #e7e4dc",
                    borderRadius: 14,
                    padding: 18,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <button
                      onClick={() => onOpenProgram(app.program_id)}
                      style={{ textAlign: "left", fontSize: 15, fontWeight: 700, color: "#14222c", lineHeight: 1.3 }}
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

                  <div style={{ fontSize: 12, color: "#97a2aa", marginTop: 4 }}>
                    Son güncelleme: {formatDate(app.updated_at)}
                  </div>

                  {app.note && (
                    <div style={{ fontSize: 12.5, color: "#5a6b75", marginTop: 8, lineHeight: 1.5 }}>{app.note}</div>
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
                            border: `1px solid ${active ? m.border : "#e3e0d8"}`,
                            background: active ? m.bg : "#fff",
                            color: active ? m.color : "#8a96a0",
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
