export type EligState = "full" | "partial" | "locked";
export type ConditionState = "met" | "action" | "unmet";
export type ProgramStatus = "open" | "always";
export type ProgramCategory =
  | "kamu"
  | "bulut"
  | "hizlandirici"
  | "vergi"
  | "yatirim"
  | "yarisma"
  | "global";

export interface Criterion {
  icon: string;
  label: string;
  value: string;
}

export interface Condition {
  state: ConditionState;
  text: string;
  value: string;
  hint?: string;
}

export interface Elig {
  state: EligState;
  score: number;
  label: string;
}

export interface Program {
  id: string;
  name: string;
  org: string;
  category: ProgramCategory;
  categoryLabel: string;
  icon: string;
  typeLabel: string;
  hasAmount: boolean;
  amountText: string;
  amountSub: string;
  curCode: string;
  rate: string;
  status: ProgramStatus;
  statusLabel: string;
  deadlineText: string;
  deadlineDays: number | null;
  sourceLink: string;
  sourceHref: string;
  updated: string;
  elig: Elig;
  summary: string;
  criteria: Criterion[];
  conditions: Condition[];
}

export type ViewName =
  | "chat"
  | "matches"
  | "detail"
  | "eligibility"
  | "application"
  | "dashboard";

export interface ProfileChip {
  label: string;
  value: string;
}

export type ChatMessage =
  | { id: string; role: "user"; text: string; delay?: number }
  | { id: string; role: "assistant"; kind: "text"; text: string; delay?: number }
  | { id: string; role: "assistant"; kind: "profile"; chips: ProfileChip[]; delay?: number }
  | { id: string; role: "assistant"; kind: "cards"; programIds: string[]; delay?: number }
  | {
      id: string;
      role: "assistant";
      kind: "cta";
      label: string;
      icon: string;
      action: "go-matches" | "apply-bigg";
      delay?: number;
    }
  | { id: string; role: "assistant"; kind: "note"; text: string; delay?: number }
  | { id: string; role: "assistant"; kind: "loading"; delay?: number }
  | { id: string; role: "assistant"; kind: "error"; text: string; delay?: number };

export type ChatMessageDraft = ChatMessage extends infer T
  ? T extends { id: string }
    ? Omit<T, "id" | "delay">
    : never
  : never;

export interface FollowUp {
  key: string;
  label: string;
}

export interface DocItem {
  id: string;
  label: string;
  done: boolean;
  auto?: boolean;
}

/** Backend ApplicationDraft verisi — ApplicationView'e prop olarak geçer */
export interface ApplicationDraft {
  programName: string;
  planTitle: string;
  planSections: { heading: string; body: string }[];
  docs: DocItem[];
}

/** API çağrısı durumu */
export type ApiStatus = "idle" | "loading" | "error";
