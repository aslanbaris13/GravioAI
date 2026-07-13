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
  BackendSupportProgram,
  BackendUserProfile,
} from "./api";
import type { Condition, DocItem, Program, ProgramCategory } from "./types";

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

/* ------------------------------------------------------------------ */
/* Tutar formatlama                                                     */
/* ------------------------------------------------------------------ */

function formatAmount(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string | null | undefined,
): { hasAmount: boolean; amountText: string; amountSub: string; curCode: string } {
  if (min == null && max == null) {
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
  if (min != null && max != null && min !== max) {
    amountText = `${fmt(min)} – ${fmt(max)}`;
  } else {
    amountText = `${fmt((min ?? max)!)}`;
  }

  return { hasAmount: true, amountText, amountSub: "", curCode: cur };
}

/* ------------------------------------------------------------------ */
/* Son başvuru tarihi                                                   */
/* ------------------------------------------------------------------ */

function formatDeadline(isoDate: string | null | undefined): {
  deadlineText: string;
  deadlineDays: number | null;
} {
  if (!isoDate) return { deadlineText: "Belirtilmemiş", deadlineDays: null };

  const deadline = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = deadline.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (diffDays < 0) return { deadlineText: `${formatted} (Sona erdi)`, deadlineDays: null };
  return { deadlineText: formatted, deadlineDays: diffDays };
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
  const { deadlineText, deadlineDays } = formatDeadline(sp.application_deadline);
  const { status, statusLabel } = adaptStatus(sp.application_status);

  const conditions: Condition[] = er.conditions.map((c) => ({
    state: c.state,
    text: c.text,
    value: c.value,
    hint: c.hint ?? undefined,
  }));

  return {
    id: sp.id,
    name: sp.program_name,
    org: sp.institution ?? "",
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
    sourceLink: sp.official_source ?? sp.application_link ?? "",
    sourceHref: sp.application_link ?? sp.official_source ?? "#",
    updated: new Date().toLocaleDateString("tr-TR"),
    elig: {
      state: er.state,
      score: er.score,
      label: er.label,
    },
    summary: sp.description ?? "",
    /** Detay ekranı için statik kriterler; backend şu an göndermez */
    criteria: [],
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

  return chips;
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
