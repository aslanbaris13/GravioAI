/**
 * Adapter katmanı — backend tipleri → frontend tipleri dönüşümü.
 *
 * Backend alanları Türkçe/snake_case; frontend ProgramCard/EligibilityView
 * beklentisi farklı. Bu katman ikisi arasında köprü kurar ve page.tsx'i
 * backend şemasından bağımsız tutar.
 */

import type {
  BackendApplicationDraft,
  BackendAssistResult,
  BackendEligibilityResult,
  BackendIngestionRun,
  BackendSessionState,
  BackendSupportProgram,
  BackendUserProfile,
} from "./api";
import type { Condition, Criterion, DocItem, Program, ProgramCategory } from "./types";

/* ------------------------------------------------------------------ */
/* Kategori dönüşümü                                                   */
/* ------------------------------------------------------------------ */

const CATEGORY_SLUG: Record<string, ProgramCategory> = {
  "Kamu Destekleri": "kamu",
  "Özel Sektör Bulut ve Yazılım Kredileri": "bulut",
  "Hızlandırıcı ve Kuluçka Merkezleri": "hizlandirici",
  "Vergi ve Lokasyon Teşvikleri": "vergi",
  "Yatırım Kaynakları": "yatirim",
  "Yarışmalar ve Etkinlikler": "yarisma",
  "Global Programlar": "global",
};

const CATEGORY_LABEL: Record<ProgramCategory, string> = {
  kamu: "Kamu Desteği",
  bulut: "Bulut Kredisi",
  hizlandirici: "Hızlandırıcı",
  vergi: "Vergi Teşviki",
  yatirim: "Yatırım",
  yarisma: "Yarışma",
  global: "Global Program",
};

const CATEGORY_ICON: Record<ProgramCategory, string> = {
  kamu: "account_balance",
  bulut: "cloud",
  hizlandirici: "rocket_launch",
  vergi: "savings",
  yatirim: "trending_up",
  yarisma: "emoji_events",
  global: "language",
};

function toSlug(backendCategory: string): ProgramCategory {
  return CATEGORY_SLUG[backendCategory] ?? "kamu";
}

/** Avatar baş harfleri — şirket adı, yoksa sektör, o da yoksa "İŞ".
 *  Sidebar ile daraltılmış ray aynı harfleri göstersin diye ortak. */
export function profileInitials(profile: BackendUserProfile | null): string {
  const companyName = profile?.company_name ?? null;
  const sector = profile?.sector ?? null;
  if (companyName) return companyName.slice(0, 2).toUpperCase();
  if (sector) return sector.slice(0, 2).toUpperCase();
  return "İŞ";
}

/* ------------------------------------------------------------------ */
/* Tutar formatlama                                                     */
/* ------------------------------------------------------------------ */

export function formatAmount(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string | null | undefined,
): { hasAmount: boolean; amountText: string; amountSub: string; curCode: string } {
  // Kaynak veride tutarı bilinmeyen alanlar 0 olarak geliyor (23 programın
  // 19'unda amount_min = 0). Sıfır bir destek tutarı anlamsız olduğu için
  // "bilgi yok" sayılır; aksi halde ekranda "0 ₺" ya da "0 – 10 M" gibi
  // yanıltıcı değerler çıkıyordu.
  const minV = min || null;
  const maxV = max || null;

  if (minV == null && maxV == null) {
    return { hasAmount: false, amountText: "Belirtilmemiş", amountSub: "", curCode: "" };
  }

  const cur = currency ?? "TRY";
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} M`
      : n >= 1_000
        ? `${(n / 1_000).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} K`
        : n.toLocaleString("tr-TR");

  let amountText: string;
  let amountSub = "";
  if (minV != null && maxV != null && minV !== maxV) {
    amountText = `${fmt(minV)} – ${fmt(maxV)}`;
  } else {
    amountText = `${fmt((minV ?? maxV)!)}`;
    // Yalnızca üst sınır biliniyorsa bunu belirt: "10 M ₺" tek başına
    // sabit bir tutar sanılabilir, oysa tavan değer.
    if (minV == null && maxV != null) amountSub = "kadar";
  }

  return { hasAmount: true, amountText, amountSub, curCode: cur };
}

/* ------------------------------------------------------------------ */
/* Son başvuru tarihi                                                   */
/* ------------------------------------------------------------------ */

function formatDeadline(isoDate: string | null | undefined): {
  deadlineText: string;
  deadlineDays: number | null;
  deadlineExpired: boolean;
} {
  if (!isoDate) return { deadlineText: "Belirtilmemiş", deadlineDays: null, deadlineExpired: false };

  const deadline = new Date(isoDate);
  if (Number.isNaN(deadline.getTime())) {
    // Backend, tarih bulunamadığında ISO tarih yerine açıklayıcı bir
    // Türkçe mesaj gönderebilir (bkz. BOS_ALAN_MESAJLARI) — o durumda
    // mesajı olduğu gibi göster.
    return { deadlineText: isoDate, deadlineDays: null, deadlineExpired: false };
  }
  // "YYYY-MM-DD" biçimindeki tarihler JS'te UTC gece yarısı olarak parse
  // edilir — bu yüzden karşılaştırılacak "bugün" de UTC gece yarısına göre
  // hesaplanmalı, yoksa UTC'nin ilerisindeki dilimlerde (ör. Türkiye, UTC+3)
  // gün sayısı bir fazla çıkar.
  const today = new Date();
  const todayUTCMidnight = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = deadline.getTime() - todayUTCMidnight;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = deadline.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (diffDays < 0) {
    return { deadlineText: `${formatted} (Sona erdi)`, deadlineDays: null, deadlineExpired: true };
  }
  return { deadlineText: formatted, deadlineDays: diffDays, deadlineExpired: false };
}

/* ------------------------------------------------------------------ */
/* Başvuru durumu                                                       */
/* ------------------------------------------------------------------ */

function adaptStatus(
  raw: string | null | undefined,
): { status: "open" | "always"; statusLabel: string } {
  if (raw === "Sürekli") return { status: "always", statusLabel: "Sürekli Açık" };
  if (raw === "Açık") return { status: "open", statusLabel: "Başvurular Açık" };
  return { status: "open", statusLabel: raw ?? "Açık" };
}

/* ------------------------------------------------------------------ */
/* Temel kriterler                                                      */
/* ------------------------------------------------------------------ */

/** Backend, bilgi bulunamadığında null yerine bu açıklayıcı mesajları
 * gönderir (bkz. backend/core/constants.py::BOS_ALAN_MESAJLARI) — kriter
 * listesinde anlamsız bir chip olarak görünmesinler diye eleniyor.
 * "Bölge şartı belirtilmemiş" güncel connector pipeline'ının (bkz.
 * backend/connectors/base.py) ürettiği bir mesaj değil — region hiç
 * bulunamazsa doğrudan "Ulusal" varsayılanına düşer; bu yalnızca eski bir
 * statik taslak dosyasından (tubitak_taslak.json) kalan artık veri, yine de
 * aynı şekilde eleniyor. */
const EMPTY_FIELD_MESSAGES = new Set([
  "Kuruluş tarihi şartı belirtilmemiş",
  "Son başvuru tarihi belirtilmemiş",
  "Destek oranı belirtilmemiş",
  "Resmi link belirtilmemiş",
  "Bölge şartı belirtilmemiş",
]);

/** SupportProgram'ın gerçek alanlarından "Temel kriterler" chip'lerini üretir. */
function buildCriteria(sp: BackendSupportProgram): Criterion[] {
  const criteria: Criterion[] = [];

  if (sp.region && !EMPTY_FIELD_MESSAGES.has(sp.region)) {
    criteria.push({ icon: "public", label: "Bölge", value: sp.region });
  }
  if (sp.company_required != null) {
    criteria.push({
      icon: "apartment",
      label: "Şirket şartı",
      value: sp.company_required ? "Kurulu şirket gerekli" : "Şirket şartı yok",
    });
  }
  if (sp.founded_after && !EMPTY_FIELD_MESSAGES.has(sp.founded_after)) {
    criteria.push({ icon: "event", label: "Kuruluş şartı", value: sp.founded_after });
  }
  if (sp.women_entrepreneur) {
    criteria.push({ icon: "badge", label: "Kadın girişimci", value: "Özel avantaj var" });
  }
  if (sp.student) {
    criteria.push({ icon: "school", label: "Öğrenci", value: "Başvurabilir" });
  }
  if (sp.technopark) {
    criteria.push({ icon: "location_city", label: "Teknopark", value: "Şartı var" });
  }

  return criteria;
}

/* ------------------------------------------------------------------ */
/* Ana dönüştürücüler                                                  */
/* ------------------------------------------------------------------ */

/** Backend SupportProgram + EligibilityResult → Frontend Program */
export function adaptProgram(
  sp: BackendSupportProgram,
  er: BackendEligibilityResult,
): Program {
  const category = toSlug(sp.category);
  const { hasAmount, amountText, amountSub, curCode } = formatAmount(
    sp.amount_min,
    sp.amount_max,
    sp.currency,
  );
  const { deadlineText, deadlineDays, deadlineExpired } = formatDeadline(sp.deadline);
  const { status, statusLabel } = adaptStatus(sp.application_status);

  const conditions: Condition[] = er.conditions.map((c) => ({
    state: c.state,
    text: c.text,
    value: c.value,
    hint: c.hint ?? undefined,
  }));

  // `official_url` çoğunlukla TÜBİTAK'ın program-özel başvuru portalı (ör.
  // eteydeb.tubitak.gov.tr) — `source_url`'den kasıtlı olarak farklıdır, o
  // yüzden birini diğerine eşitlemiyoruz. Ama `official_url` boş/placeholder
  // geldiğinde link alanını tamamen boş bırakmak yerine, elimizdeki gerçek
  // kaynak sayfasını (`source_url`) gösteriyoruz — "hiç link yok" demek
  // yanıltıcı, hâlbuki resmi kurumun sitesine giden gerçek bir link var.
  const hasOfficialLink = !!sp.official_url && !EMPTY_FIELD_MESSAGES.has(sp.official_url);
  const link = hasOfficialLink ? sp.official_url! : sp.source_url ?? "";

  return {
    id: sp.program_id,
    name: sp.title,
    org: sp.source ?? "",
    category,
    categoryLabel: CATEGORY_LABEL[category],
    icon: CATEGORY_ICON[category],
    typeLabel: sp.support_type ?? "",
    hasAmount,
    amountText,
    amountSub,
    curCode,
    rate: sp.support_rate ?? "",
    status,
    statusLabel,
    deadlineText,
    deadlineDays,
    deadlineExpired,
    sourceLink: link,
    sourceHref: link || "#",
    updated: new Date().toLocaleDateString("tr-TR"),
    elig: {
      state: er.state,
      score: er.score,
      label: er.label,
    },
    summary: sp.conditions_summary ?? "",
    criteria: buildCriteria(sp),
    conditions,
  };
}

/** Backend AssistResult → UI'da kullanılacak yapı */
export function adaptAssistResult(raw: BackendAssistResult): {
  profile: BackendUserProfile;
  programs: Program[];
  reply: string;
} {
  const programs = raw.matches.map((m) =>
    adaptProgram(m.program, m.eligibility),
  );
  return { profile: raw.profile, programs, reply: raw.reply };
}

/** Backend SessionState (kalıcı oturum) → UI'da kullanılacak yapı — reply yok */
export function adaptSessionState(raw: BackendSessionState): {
  profile: BackendUserProfile;
  programs: Program[];
} {
  const programs = raw.matches.map((m) => adaptProgram(m.program, m.eligibility));
  return { profile: raw.profile, programs };
}

/** Backend UserProfile → Profil chip'leri (ChatView'de gösterilir) */
export function profileToChips(
  p: BackendUserProfile,
): { label: string; value: string }[] {
  const chips: { label: string; value: string }[] = [];

  if (p.sector) chips.push({ label: "Sektör", value: p.sector });
  if (p.city) chips.push({ label: "İl", value: p.city });
  if (p.team_size != null)
    chips.push({ label: "Ekip", value: `${p.team_size} kişi` });
  if (p.company_age_years != null)
    chips.push({
      label: "Kuruluş",
      value:
        p.company_age_years < 1
          ? "< 1 yıl"
          : `${p.company_age_years} yıl`,
    });
  if (p.goals.length > 0)
    chips.push({ label: "Hedef", value: p.goals.slice(0, 2).join(", ") });
  if (p.in_technopark) chips.push({ label: "Altyapı", value: "Teknopark" });
  if (p.website) chips.push({ label: "Web sitesi", value: p.website });

  return chips;
}

/** Sohbetin her turu kendi profil çıkarımını döner (bazı intent'lerde neredeyse
 * boştur, örn. PROGRAM_QUESTION sadece sorguyu `summary`'ye koyar). Alan bazında
 * birleştirir — yeni turda dolu olmayan alanlarda önceki bilinen değeri korur,
 * böylece bir önceki turda çıkarılan sektör/şehir/ekip bilgisi kaybolmaz. */
export function mergeProfile(
  prev: BackendUserProfile | null,
  next: BackendUserProfile,
): BackendUserProfile {
  if (!prev) return next;
  return {
    company_name: next.company_name ?? prev.company_name,
    website: next.website ?? prev.website,
    sector: next.sector ?? prev.sector,
    city: next.city ?? prev.city,
    team_size: next.team_size ?? prev.team_size,
    company_exists: next.company_exists ?? prev.company_exists,
    company_age_years: next.company_age_years ?? prev.company_age_years,
    women_entrepreneur: next.women_entrepreneur ?? prev.women_entrepreneur,
    student: next.student ?? prev.student,
    in_technopark: next.in_technopark ?? prev.in_technopark,
    goals: next.goals.length > 0 ? next.goals : prev.goals,
    summary: next.summary ?? prev.summary,
  };
}

/** Backend ApplicationDraft → ApplicationView'in beklediği belgeler ve plan */
export function adaptApplicationDraft(raw: BackendApplicationDraft): {
  programName: string;
  planTitle: string;
  planSections: { heading: string; body: string }[];
  docs: DocItem[];
} {
  const docs: DocItem[] = raw.documents.map((d, i) => ({
    id: `doc-${i}`,
    label: d.label,
    done: d.auto, // Gravio'nun hazırladıkları başlangıçta "tamamlandı" işaretli
    auto: d.auto,
  }));

  return {
    programName: raw.program_name,
    planTitle: raw.plan_title,
    planSections: raw.plan_sections,
    docs,
  };
}

/* ------------------------------------------------------------------ */
/* Veri senkronizasyonu (ingestion) geçmişi                             */
/* ------------------------------------------------------------------ */

/** Her kaynağın (kosgeb/tubitak/...) en güncel çalıştırmasını döner — liste
 * `started_at`'e göre en yeni önce geldiği varsayılır (bkz. `listIngestionRuns`). */
export function latestIngestionRunBySource(runs: BackendIngestionRun[]): BackendIngestionRun[] {
  const seen = new Set<string>();
  const latest: BackendIngestionRun[] = [];
  for (const run of runs) {
    if (seen.has(run.source)) continue;
    seen.add(run.source);
    latest.push(run);
  }
  return latest.sort((a, b) => a.source.localeCompare(b.source, "tr"));
}

/** "3 gün önce", "2 saat önce" gibi göreli bir zaman metni üretir. */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return "az önce";
  if (diffMin < 60) return `${diffMin} dakika önce`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} saat önce`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} gün önce`;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}
