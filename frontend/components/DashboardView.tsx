/**
 * Panelim ekranı — karar destek paneli.
 *
 * Gerçek verilere bağlı: `profile` sohbetten çıkarılan (ve oturumda kalıcı
 * olan) BackendUserProfile'dır, `programs` ise en son bilinen eşleşmelerdir.
 * İkisi de boşsa henüz sohbet edilmemiş demektir — boş durum gösterilir.
 */
"use client";
import Ms from "./Ms";
import { profileToChips } from "@/lib/adapter";
import type { ApplicationTrackingStatus, BackendApplicationRecord, BackendUserProfile } from "@/lib/api";
import type { Program } from "@/lib/types";

const APPLICATION_STATUS_META: Record<ApplicationTrackingStatus, { label: string; color: string; bg: string }> = {
  taslak: { label: "Taslak", color: "#76858d", bg: "#f4f3ee" },
  hazirlaniyor: { label: "Hazırlanıyor", color: "#0f6ea8", bg: "#eef6fb" },
  gonderildi: { label: "Gönderildi", color: "#15803d", bg: "#eaf7ee" },
};

const PROFILE_FIELD_LABELS: { key: keyof BackendUserProfile; label: string }[] = [
  { key: "sector", label: "Sektör" },
  { key: "city", label: "Şehir" },
  { key: "team_size", label: "Ekip büyüklüğü" },
  { key: "goals", label: "Hedefler" },
];

function isFieldMissing(profile: BackendUserProfile, key: keyof BackendUserProfile): boolean {
  const value = profile[key];
  if (Array.isArray(value)) return value.length === 0;
  return value === null || value === undefined;
}

export default function DashboardView({
  profile,
  programs,
  applications,
  onOpenProgram,
  onGoToChat,
  onGoToApplications,
  onNewPresentation,
}: {
  profile: BackendUserProfile | null;
  programs: Program[];
  applications: BackendApplicationRecord[];
  onOpenProgram: (id: string) => void;
  onGoToChat?: () => void;
  onGoToApplications?: () => void;
  onNewPresentation?: () => void;
}) {
  // Web sitesi zaten başlığın altında gösteriliyor — chip listesinde tekrarlamıyoruz.
  const chips = profile ? profileToChips(profile).filter((c) => c.label !== "Web sitesi") : [];

  const upcoming = programs
    .filter((p) => p.deadlineDays != null)
    .sort((a, b) => (a.deadlineDays as number) - (b.deadlineDays as number))
    .slice(0, 5);

  const fullyEligibleCount = programs.filter((p) => p.elig.state === "full").length;
  const urgentCount = programs.filter((p) => p.deadlineDays != null && (p.deadlineDays as number) < 30).length;

  const missingFields = profile
    ? PROFILE_FIELD_LABELS.filter((f) => isFieldMissing(profile, f.key))
    : PROFILE_FIELD_LABELS;

  const companyName = profile?.company_name ?? null;
  const website = profile?.website ?? null;
  const websiteHref = website ? (website.startsWith("http") ? website : `https://${website}`) : null;
  const initials = (companyName ?? profile?.sector ?? "İşletmem").slice(0, 2).toUpperCase();

  // Kategori dağılımı — yeni veri toplamadan, mevcut eşleşmelerden türetilir.
  const categoryCounts = new Map<string, number>();
  for (const p of programs) {
    categoryCounts.set(p.categoryLabel, (categoryCounts.get(p.categoryLabel) ?? 0) + 1);
  }
  const categoryDistribution = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCategoryCount = categoryDistribution[0]?.[1] ?? 1;

  const applicationStatusCounts: Record<ApplicationTrackingStatus, number> = {
    taslak: 0,
    hazirlaniyor: 0,
    gonderildi: 0,
  };
  for (const a of applications) applicationStatusCounts[a.status] += 1;

  return (
    <section data-screen-label="Panelim" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 32px 60px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#97a2aa", textTransform: "uppercase", letterSpacing: ".05em" }}>
          Panelim
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              flexShrink: 0,
              background: "linear-gradient(140deg,#f97316,#ea580c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {initials}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#14222c", margin: 0, letterSpacing: "-.01em" }}>
              {companyName ?? "İşletmem"}
            </h1>
            {websiteHref ? (
              <a
                href={websiteHref}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12.5, fontWeight: 600, color: "#0f6ea8" }}
              >
                {website}
              </a>
            ) : (
              <p style={{ fontSize: 13, color: "#8a96a0", margin: "2px 0 0" }}>
                İşletme profilin, eşleşme özetin ve yaklaşan son tarihler.
              </p>
            )}
          </div>
        </div>

        {programs.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 22 }}>
            <StatTile icon="auto_awesome" value={programs.length} label="Toplam eşleşme" />
            <StatTile icon="check_circle" value={fullyEligibleCount} label="Tam uygun" tone="good" />
            <StatTile icon="schedule" value={urgentCount} label="30 gün içinde son tarih" tone={urgentCount > 0 ? "warn" : "neutral"} />
          </div>
        )}

        {applications.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 28 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", margin: 0 }}>
                Başvuru durumu
              </h2>
              {onGoToApplications && (
                <button onClick={onGoToApplications} style={{ fontSize: 12, fontWeight: 700, color: "#ea580c" }}>
                  Tümünü gör
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {(Object.keys(APPLICATION_STATUS_META) as ApplicationTrackingStatus[]).map((status) => {
                const meta = APPLICATION_STATUS_META[status];
                const count = applicationStatusCounts[status];
                return (
                  <div
                    key={status}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 14px",
                      borderRadius: 11,
                      background: "#fff",
                      border: "1px solid #e7e4dc",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "#27353e" }}>{count}</span>
                    <span style={{ fontSize: 12, color: "#8a96a0" }}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {categoryDistribution.length > 1 && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 28 }}>
              Kategori dağılımı
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {categoryDistribution.map(([label, count]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: "#5a6b75", width: 150, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {label}
                  </span>
                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#efece3", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${(count / maxCategoryCount) * 100}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: "linear-gradient(90deg,#f97316,#ea580c)",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#27353e", width: 18, textAlign: "right" }}>{count}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 28 }}>
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

        {missingFields.length > 0 && (
          <div
            style={{
              marginTop: 14,
              padding: "13px 16px",
              background: "#fdf6e8",
              border: "1px solid #f0e0b8",
              borderRadius: 12,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <Ms name="info" size={18} color="#a86b12" style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#7a5f1e" }}>
                Profilinde eksik bilgiler var
              </div>
              <div style={{ fontSize: 12.5, color: "#8a6a2e", marginTop: 2 }}>
                {missingFields.map((f) => f.label).join(", ")} bilgisini paylaşırsan eşleşmeler daha isabetli olur.
              </div>
              {onGoToChat && (
                <button
                  onClick={onGoToChat}
                  style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: "#a86b12", textDecoration: "underline" }}
                >
                  Sohbete dön ve tamamla
                </button>
              )}
            </div>
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

        {onNewPresentation && (
          <button
            onClick={onNewPresentation}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              marginTop: 28,
              padding: "14px 16px",
              borderRadius: 13,
              background: "#fff",
              border: "1.5px dashed #d8c9b0",
              textAlign: "left",
            }}
          >
            <Ms name="slideshow" size={20} color="#ea580c" />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#27353e" }}>Şirket sunumu oluştur</div>
              <div style={{ fontSize: 12, color: "#8a96a0", marginTop: 1 }}>
                Yatırımcı/müşteri sunumu — düzenlenebilir PPTX olarak indir
              </div>
            </div>
          </button>
        )}
      </div>
    </section>
  );
}

function StatTile({
  icon,
  value,
  label,
  tone = "neutral",
}: {
  icon: string;
  value: number;
  label: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const color = tone === "good" ? "#15803d" : tone === "warn" ? "#b45309" : "#27353e";
  return (
    <div style={{ background: "#fff", border: "1px solid #e7e4dc", borderRadius: 13, padding: "13px 14px" }}>
      <Ms name={icon} size={18} color={color} />
      <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "#8a96a0", marginTop: 2 }}>{label}</div>
    </div>
  );
}
