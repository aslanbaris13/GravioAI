import type { CSSProperties } from "react";
import type { Condition, EligState, Program, ProgramCategory, ProgramStatus } from "./types";

/** Kategori renkleri marka ailesinde tutulur (bkz. globals.css) — parlak
 *  mavi/mor yerine teal, terracotta ve onlara komşu ısınmış tonlar. */
const CATEGORY_COLORS: Record<ProgramCategory, [string, string]> = {
  kamu: ["var(--terracotta-100)", "var(--terracotta-700)"],
  bulut: ["var(--teal-100)", "var(--teal-700)"],
  hizlandirici: ["var(--plum-100)", "var(--plum-700)"],
  vergi: ["var(--success-100)", "var(--success-700)"],
  yatirim: ["var(--danger-100)", "var(--danger-700)"],
  yarisma: ["var(--warn-100)", "var(--warn-700)"],
  global: ["var(--slate-100)", "var(--slate-700)"],
};

export function iconWrap(category: ProgramCategory, big = false): CSSProperties {
  const [bg, color] = CATEGORY_COLORS[category] ?? ["var(--neutral-100)", "var(--neutral-600)"];
  const size = big ? 56 : 44;
  return {
    width: size,
    height: size,
    borderRadius: big ? 16 : 13,
    background: bg,
    color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
}

const ELIG_COLORS: Record<EligState, [string, string, string]> = {
  full: ["var(--success-100)", "var(--success-200)", "var(--success-700)"],
  partial: ["var(--warn-100)", "var(--warn-200)", "var(--warn-700)"],
  locked: ["var(--neutral-100)", "var(--neutral-200)", "var(--neutral-600)"],
};

export function eligBadge(state: EligState): CSSProperties {
  const [bg, border, fg] = ELIG_COLORS[state];
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
    background: bg,
    color: fg,
    border: `1px solid ${border}`,
  };
}

export function eligIcon(state: EligState): string {
  return state === "full" ? "check_circle" : state === "partial" ? "pending" : "lock";
}

export function statusBadge(status: ProgramStatus): { badge: CSSProperties; dot: CSSProperties } {
  const [bg, fg, dotColor] =
    status === "open"
      ? ["var(--success-100)", "var(--success-700)", "var(--success-500)"]
      : ["var(--teal-100)", "var(--teal-700)", "var(--teal-500)"];
  return {
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 11.5,
      fontWeight: 600,
      background: bg,
      color: fg,
    },
    dot: { width: 7, height: 7, borderRadius: "50%", background: dotColor, display: "inline-block" },
  };
}

export function curBadge(): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--neutral-600)",
    background: "var(--neutral-100)",
    border: "1px solid var(--border-subtle)",
    padding: "2px 7px",
    borderRadius: 6,
    letterSpacing: ".03em",
  };
}

export function amountDisplay(p: Program): {
  text: string;
  code: string;
  curBadge: CSSProperties;
} {
  if (!p.hasAmount) {
    return { text: p.amountText, code: "", curBadge: { display: "none" } };
  }
  const sym = p.curCode === "USD" ? " $" : p.curCode === "TRY" ? " ₺" : "";
  return { text: p.amountText + sym, code: p.curCode, curBadge: curBadge() };
}

export interface ProgramVM extends Program {
  iconWrapStyle: CSSProperties;
  iconWrapLgStyle: CSSProperties;
  eligBadgeStyle: CSSProperties;
  eligIconName: string;
  eligLabel: string;
  statusBadgeStyle: CSSProperties;
  statusDotStyle: CSSProperties;
  amountDisplayText: string;
  curCodeDisplay: string;
  curBadgeStyle: CSSProperties;
}

export function toVM(p: Program): ProgramVM {
  const ad = amountDisplay(p);
  const sb = statusBadge(p.status);
  return {
    ...p,
    iconWrapStyle: iconWrap(p.category, false),
    iconWrapLgStyle: iconWrap(p.category, true),
    eligBadgeStyle: eligBadge(p.elig.state),
    eligIconName: eligIcon(p.elig.state),
    eligLabel: p.elig.label,
    statusBadgeStyle: sb.badge,
    statusDotStyle: sb.dot,
    amountDisplayText: ad.text,
    curCodeDisplay: ad.code,
    curBadgeStyle: ad.curBadge,
  };
}

export function deadlinePillStyle(deadlineDays: number | null): CSSProperties {
  if (deadlineDays != null) {
    const urgent = deadlineDays < 30;
    return {
      fontSize: 12,
      fontWeight: 700,
      padding: "6px 12px",
      borderRadius: 999,
      whiteSpace: "nowrap",
      background: urgent ? "var(--warn-100)" : "var(--success-100)",
      color: urgent ? "var(--warn-700)" : "var(--success-700)",
    };
  }
  return {
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 12px",
    borderRadius: 999,
    background: "var(--teal-100)",
    color: "var(--teal-700)",
  };
}

export function deadlineDaysText(deadlineDays: number | null): string {
  return deadlineDays != null ? `${deadlineDays} gün kaldı` : "Sürekli";
}

const RING_COLORS: Record<EligState, string> = {
  full: "var(--success-500)",
  partial: "var(--warn-500)",
  locked: "var(--neutral-600)",
};

export function eligRingStyle(state: EligState, score: number): CSSProperties {
  return {
    width: 78,
    height: 78,
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `conic-gradient(${RING_COLORS[state]} ${score * 3.6}deg, var(--sand-200) 0deg)`,
  };
}

/** "Karşılandı" dışındaki koşullar — kullanıcının hâlâ tamamlaması/sağlaması gereken koşullar. */
function remainingConditions(conditions: Condition[]): Condition[] {
  return conditions.filter((c) => c.state !== "met");
}

export function eligHeadline(state: EligState, conditions: Condition[]): string {
  if (state === "full") return "Tüm koşulları karşılıyorsun";
  const remaining = remainingConditions(conditions);
  if (state === "partial") {
    return remaining.length === 1
      ? "Neredeyse hazırsın — 1 koşul kaldı"
      : `Neredeyse hazırsın — ${remaining.length} koşul kaldı`;
  }
  return remaining.length === 1 ? "Şu an bir koşul karşılanmıyor" : `Şu an ${remaining.length} koşul karşılanmıyor`;
}

/** Koşul kartları: zemin her durumda kart yüzeyi, durum bilgisini kenarlık +
 *  ikon + etiket taşır (renkli zemin üstünde renkli etiket okunmuyordu). */
export const CONDITION_STYLE = {
  met: { icon: "check_circle", col: "var(--success-700)", bg: "var(--surface)", bd: "var(--success-200)", tag: "Karşılandı", tagBg: "var(--success-100)", tagFg: "var(--success-700)" },
  action: { icon: "bolt", col: "var(--teal-700)", bg: "var(--surface)", bd: "var(--teal-200)", tag: "Hazır", tagBg: "var(--teal-100)", tagFg: "var(--teal-700)" },
  unmet: { icon: "pending", col: "var(--warn-700)", bg: "var(--surface)", bd: "var(--warn-200)", tag: "Eksik", tagBg: "var(--warn-100)", tagFg: "var(--warn-700)" },
} as const;

export function eligCta(state: EligState, conditions: Condition[]): { icon: string; text: string; btn: string } {
  if (state === "full") {
    return {
      icon: "rocket_launch",
      text: "Bu programa tam uygunsun. Başvuru paketini hemen hazırlayabilirim.",
      btn: "Başvuru hazırla",
    };
  }
  const remaining = remainingConditions(conditions);
  if (state === "partial") {
    const text =
      remaining.length === 1
        ? `"${remaining[0].text}" koşulu tamamlanmadı. Yukarıdaki koşul kartında ne yapman gerektiği yazıyor — onu tamamlayıp yine de başvuruya başlayabilirsin.`
        : `${remaining.length} koşul tamamlanmadı: ${remaining.map((c) => `"${c.text}"`).join(", ")}. Yukarıdaki koşul kartlarında her biri için ne yapman gerektiği yazıyor — tamamlayıp yine de başvuruya başlayabilirsin.`;
    return { icon: "lightbulb", text, btn: "Yine de başla" };
  }
  const lockedText =
    remaining.length === 1
      ? `"${remaining[0].text}" koşulu şu an karşılanmıyor. Uygun olduğunda seni proaktif olarak bilgilendireyim mi?`
      : `${remaining.length} koşul şu an karşılanmıyor. Uygun olduğunda seni proaktif olarak bilgilendireyim mi?`;
  return { icon: "schedule", text: lockedText, btn: "Takibe al" };
}
