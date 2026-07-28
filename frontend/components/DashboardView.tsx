/**
 * Panelim ekranı — karar destek paneli.
 *
 * Gerçek verilere bağlı: `profile` sohbetten çıkarılan (ve oturumda kalıcı
 * olan) BackendUserProfile'dır, `programs` ise en son bilinen eşleşmelerdir.
 * İkisi de boşsa henüz sohbet edilmemiş demektir — boş durum gösterilir.
 */
"use client";
import Ms from "./Ms";
import { formatRelativeTime, latestIngestionRunBySource, profileToChips } from "@/lib/adapter";
import type {
  ApplicationTrackingStatus,
  BackendApplicationRecord,
  BackendIngestionRun,
  BackendUserProfile,
} from "@/lib/api";
import type { Program } from "@/lib/types";

const INGESTION_SOURCE_LABELS: Record<string, string> = {
  kosgeb: "KOSGEB",
  kalkinma: "Kalkınma Ajansı",
  tubitak: "TÜBİTAK",
  google_startup: "Google for Startups",
  avrupa_birligi: "Avrupa Birliği",
  kgf: "KGF",
  turkpatent: "Türk Patent",
  sanayi_bakanligi: "Sanayi Bakanlığı",
  ingest_batch: "Veri işleme",
};

const APPLICATION_STATUS_META: Record<ApplicationTrackingStatus, { label: string; color: string; bg: string }> = {
  taslak: { label: "Taslak", color: "var(--ink-600)", bg: "var(--paper-100)" },
  hazirlaniyor: { label: "Hazırlanıyor", color: "var(--teal-700)", bg: "var(--teal-100)" },
  gonderildi: { label: "Gönderildi", color: "var(--success-700)", bg: "var(--success-100)" },
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
  ingestionRuns,
  onOpenProgram,
  onGoToChat,
  onGoToOnboarding,
  onGoToApplications,
  onNewPresentation,
}: {
  profile: BackendUserProfile | null;
  programs: Program[];
  applications: BackendApplicationRecord[];
  ingestionRuns?: BackendIngestionRun[];
  onOpenProgram: (id: string) => void;
  onGoToChat?: () => void;
  onGoToOnboarding?: () => void;
  onGoToApplications?: () => void;
  onNewPresentation?: () => void;
}) {
  // Profil hiç çıkarılmamışsa panelin gösterecek verisi yok — kullanıcıyı boş
  // kartlarla baş başa bırakmak yerine iki yoldan birini seçtiriyoruz.
  const hasProfile = profile != null;
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

  const latestIngestionRuns = ingestionRuns ? latestIngestionRunBySource(ingestionRuns) : [];

  return (
    <section data-screen-label="Panelim" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 32px 60px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: ".05em" }}>
          Panelim
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              flexShrink: 0,
              background: "linear-gradient(140deg,var(--terracotta-600),var(--terracotta-700))",
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
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-900)", margin: 0, letterSpacing: "-.01em" }}>
              {companyName ?? "İşletmem"}
            </h1>
            {websiteHref ? (
              <a
                href={websiteHref}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12.5, fontWeight: 600, color: "var(--teal-700)" }}
              >
                {website}
              </a>
            ) : (
              <p style={{ fontSize: 13, color: "var(--ink-400)", margin: "2px 0 0" }}>
                İşletme profilin, eşleşme özetin ve yaklaşan son tarihler.
              </p>
            )}
          </div>
        </div>

        {latestIngestionRuns.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {latestIngestionRuns.map((run) => {
              const ok = run.status === "success";
              return (
                <div
                  key={run.source}
                  title={run.error_msg ?? undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 11px",
                    borderRadius: 999,
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: 11.5,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: ok ? "var(--success-700)" : "var(--terracotta-700)",
                    }}
                  />
                  <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>
                    {INGESTION_SOURCE_LABELS[run.source] ?? run.source}
                  </span>
                  <span style={{ color: "var(--ink-400)" }}>
                    {ok ? `${formatRelativeTime(run.finished_at)} güncellendi` : "güncelleme başarısız"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!hasProfile && (
          <div
            style={{
              marginTop: 24,
              padding: "26px 24px",
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Ms name="badge" size={22} color="var(--terracotta-700)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--ink-900)",
                    margin: 0,
                    textTransform: "none",
                    letterSpacing: "normal",
                  }}
                >
                  Henüz bir işletme profilin yok
                </h2>
                <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.6, margin: "6px 0 0" }}>
                  Panel, profilinden çıkan eşleşmeleri ve son tarihleri gösterir.
                  Profilini iki yoldan oluşturabilirsin — ikisi de aynı sonuca çıkar.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
              {onGoToChat && (
                <button
                  onClick={onGoToChat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 18px",
                    borderRadius: 12,
                    background: "linear-gradient(160deg,var(--terracotta-600),var(--terracotta-700))",
                    color: "#fff",
                    fontSize: 13.5,
                    fontWeight: 700,
                    boxShadow: "var(--shadow-cta)",
                  }}
                >
                  <Ms name="forum" size={18} />
                  Sohbetle tamamla
                </button>
              )}
              {onGoToOnboarding && (
                <button
                  onClick={onGoToOnboarding}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 18px",
                    borderRadius: 12,
                    background: "var(--surface-strong)",
                    border: "1.5px solid var(--border-subtle)",
                    color: "var(--ink-900)",
                    fontSize: 13.5,
                    fontWeight: 700,
                  }}
                >
                  <Ms name="assignment_ind" size={18} color="var(--ink-600)" />
                  Formla profil oluştur
                </button>
              )}
            </div>

            <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 12, lineHeight: 1.5 }}>
              Sohbet daha hızlıdır — işletmeni birkaç cümleyle anlatman yeterli.
              Form ise adım adım ilerler, hiçbir alanı atlamak istemiyorsan onu seç.
            </div>
          </div>
        )}

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
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-600)", textTransform: "uppercase", letterSpacing: ".05em", margin: 0 }}>
                Başvuru durumu
              </h2>
              {onGoToApplications && (
                <button onClick={onGoToApplications} style={{ fontSize: 12, fontWeight: 700, color: "var(--terracotta-700)" }}>
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
                      background: "var(--surface)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)" }}>{count}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-400)" }}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {categoryDistribution.length > 1 && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-600)", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 28 }}>
              Kategori dağılımı
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {categoryDistribution.map(([label, count]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: "var(--ink-600)", width: 150, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {label}
                  </span>
                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: "var(--border-subtle)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${(count / maxCategoryCount) * 100}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: "linear-gradient(90deg,var(--terracotta-600),var(--terracotta-700))",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-900)", width: 18, textAlign: "right" }}>{count}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Profil yokken bu bölüm hiç çizilmiyor: yukarıdaki boş durum bloğu
            zaten aynı şeyi (ve ne yapılacağını) söylüyor — üç ayrı yerde
            "profil yok" demek gereksiz tekrar oluyordu. */}
        {hasProfile && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-600)", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 28 }}>
              İşletme profili
            </h2>
            {chips.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {chips.map((ch) => (
                  <div
                    key={ch.label}
                    style={{ display: "flex", flexDirection: "column", gap: 1, padding: "9px 14px", borderRadius: 11, background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: ".04em" }}>{ch.label}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)" }}>{ch.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 12, padding: "16px 18px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, fontSize: 13.5, color: "var(--ink-400)" }}>
                Profil alanları henüz doldurulmadı — sohbet ekranında işletmeni anlat.
              </div>
            )}
          </>
        )}

        {hasProfile && missingFields.length > 0 && (
          <div
            style={{
              marginTop: 14,
              padding: "13px 16px",
              background: "var(--terracotta-100)",
              border: "1px solid var(--terracotta-100)",
              borderRadius: 12,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <Ms name="info" size={18} color="var(--terracotta-700)" style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--terracotta-700)" }}>
                Profilinde eksik bilgiler var
              </div>
              <div style={{ fontSize: 12.5, color: "var(--terracotta-700)", marginTop: 2 }}>
                {missingFields.map((f) => f.label).join(", ")} bilgisini paylaşırsan eşleşmeler daha isabetli olur.
              </div>
              {onGoToChat && (
                <button
                  onClick={onGoToChat}
                  style={{ marginTop: 8, fontSize: 12.5, fontWeight: 700, color: "var(--terracotta-700)", textDecoration: "underline" }}
                >
                  Sohbete dön ve tamamla
                </button>
              )}
            </div>
          </div>
        )}

        {/* Profil yokken eşleşme de yok — "yaklaşan son tarih yok" demek
            boş yere gürültü, boş durum bloğu zaten yönlendiriyor. */}
        {hasProfile && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-600)", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 28 }}>
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
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 13,
                    padding: "14px 16px",
                  }}
                >
                  <Ms name="event" size={20} color={urgent ? "var(--terracotta-700)" : "var(--teal-700)"} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 2 }}>{p.deadlineText}</div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "5px 11px",
                      borderRadius: 999,
                      background: urgent ? "var(--terracotta-100)" : "var(--success-100)",
                      color: urgent ? "var(--terracotta-700)" : "var(--success-700)",
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
              <div style={{ marginTop: 12, padding: "16px 18px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, fontSize: 13.5, color: "var(--ink-400)" }}>
                Yaklaşan bir son tarih yok.
              </div>
            )}
          </>
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
              background: "var(--surface)",
              border: "1.5px dashed var(--border-subtle)",
              textAlign: "left",
            }}
          >
            <Ms name="slideshow" size={20} color="var(--terracotta-700)" />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)" }}>Şirket sunumu oluştur</div>
              <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 1 }}>
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
  const color = tone === "good" ? "var(--success-700)" : tone === "warn" ? "var(--terracotta-700)" : "var(--ink-900)";
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 13, padding: "13px 14px" }}>
      <Ms name={icon} size={18} color={color} />
      <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-400)", marginTop: 2 }}>{label}</div>
    </div>
  );
}