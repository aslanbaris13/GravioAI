import type { CSSProperties } from "react";
import type { EligState, Program, ProgramCategory, ProgramStatus } from "./types";

const CATEGORY_COLORS: Record<ProgramCategory, [string, string]> = {
  kamu: ["#fff3ea", "#ea580c"],
  bulut: ["#eef6fb", "#0f6ea8"],
  hizlandirici: ["#f3eefb", "#7a4fd0"],
  vergi: ["#eaf7ee", "#15803d"],
  yatirim: ["#fef3ed", "#c2410c"],
  yarisma: ["#fdf6e3", "#b45309"],
  global: ["#eef6fb", "#0f6ea8"],
};

export function iconWrap(category: ProgramCategory, big = false): CSSProperties {
  const [bg, color] = CATEGORY_COLORS[category] ?? ["#f4f3ee", "#5a6b75"];
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
  full: ["#eaf7ee", "#cdeccf", "#15803d"],
  partial: ["#fdf6e3", "#f0e0b0", "#b45309"],
  locked: ["#f1f0ec", "#e2dfd6", "#76858d"],
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
    status === "open" ? ["#eaf7ee", "#15803d", "#16a34a"] : ["#eef6fb", "#0f6ea8", "#2a8fd0"];
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
    color: "#97a2aa",
    background: "#f4f3ee",
    border: "1px solid #e7e4dc",
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
      background: urgent ? "#fdf6e3" : "#eaf7ee",
      color: urgent ? "#b45309" : "#15803d",
    };
  }
  return {
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 12px",
    borderRadius: 999,
    background: "#eef6fb",
    color: "#0f6ea8",
  };
}

export function deadlineDaysText(deadlineDays: number | null): string {
  return deadlineDays != null ? `${deadlineDays} gün kaldı` : "Sürekli";
}

const RING_COLORS: Record<EligState, string> = {
  full: "#16a34a",
  partial: "#d99a2b",
  locked: "#9aa6ad",
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
    background: `conic-gradient(${RING_COLORS[state]} ${score * 3.6}deg, #ececec 0deg)`,
  };
}

export function eligHeadline(state: EligState): string {
  if (state === "full") return "Tüm koşulları karşılıyorsun";
  if (state === "partial") return "Neredeyse hazırsın — 1 koşul kaldı";
  return "Şu an bir koşul karşılanmıyor";
}

export const CONDITION_STYLE = {
  met: { icon: "check_circle", col: "#15803d", bg: "#fbfdfb", bd: "#e3efe5", tag: "Karşılandı", tagBg: "#eaf7ee", tagFg: "#15803d" },
  action: { icon: "bolt", col: "#0f6ea8", bg: "#fbfdff", bd: "#dde9f2", tag: "Hazır", tagBg: "#eef6fb", tagFg: "#0f6ea8" },
  unmet: { icon: "pending", col: "#b45309", bg: "#fffdf6", bd: "#f0e6c8", tag: "Eksik", tagBg: "#fdf6e3", tagFg: "#b45309" },
} as const;

export function eligCta(state: EligState): { icon: string; text: string; btn: string } {
  if (state === "full") {
    return {
      icon: "rocket_launch",
      text: "Bu programa tam uygunsun. Başvuru paketini hemen hazırlayabilirim.",
      btn: "Başvuru hazırla",
    };
  }
  if (state === "partial") {
    return {
      icon: "lightbulb",
      text: "Tek koşul kaldı. Onu tamamlamak için bir plan oluşturup yine de başvuruya başlayabilirsin.",
      btn: "Yine de başla",
    };
  }
  return {
    icon: "schedule",
    text: "Şu an bir koşul karşılanmıyor. Uygun olduğunda seni proaktif olarak bilgilendireyim mi?",
    btn: "Takibe al",
  };
}
