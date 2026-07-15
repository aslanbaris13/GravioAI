/**
 * Backend HTTP istemcisi.
 *
 * Tüm API çağrıları bu modül üzerinden yapılır; base URL ortam değişkeninden
 * okunur, hata yönetimi merkezi ApiError sınıfıyla sağlanır.
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

/** API isteği başarısız olduğunda fırlatılır. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}/api${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(0, "Sunucuya ulaşılamıyor. Backend çalışıyor mu?");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/* Ham backend tip tanımları (adapter katmanında dönüştürülür)          */
/* ------------------------------------------------------------------ */

export interface BackendCondition {
  state: "met" | "action" | "unmet";
  text: string;
  value: string;
  hint?: string | null;
}

export interface BackendEligibilityResult {
  state: "full" | "partial" | "locked";
  score: number;
  label: string;
  conditions: BackendCondition[];
  summary?: string | null;
}

export interface BackendSupportProgram {
  program_id: string;
  title: string;
  /** Tam Türkçe kategori adı, örn. "Kamu Destekleri" */
  category: string;
  source?: string | null;
  support_type?: string | null;
  amount_min?: number | null;
  amount_max?: number | null;
  currency?: "TRY" | "USD" | "EUR" | null;
  support_rate?: string | null;
  application_status?: "Açık" | "Kapalı" | "Sürekli" | null;
  region?: string | null;
  founded_after?: string | null;
  deadline?: string | null;
  official_url?: string | null;
  conditions_summary?: string | null;
  women_entrepreneur?: boolean | null;
  technopark?: boolean | null;
  company_required?: boolean | null;
  student?: boolean | null;
}

export interface BackendUserProfile {
  sector?: string | null;
  city?: string | null;
  team_size?: number | null;
  company_exists?: boolean | null;
  company_age_years?: number | null;
  women_entrepreneur?: boolean | null;
  student?: boolean | null;
  in_technopark?: boolean | null;
  goals: string[];
  summary?: string | null;
}

export interface BackendProgramMatch {
  program: BackendSupportProgram;
  eligibility: BackendEligibilityResult;
}

export interface BackendAssistResult {
  profile: BackendUserProfile;
  matches: BackendProgramMatch[];
  reply: string;
}

/** Bir oturumun kalıcı durumu — profil + son bilinen eşleşmeler (reply yok) */
export interface BackendSessionState {
  profile: BackendUserProfile;
  matches: BackendProgramMatch[];
}

export interface BackendPlanSection {
  heading: string;
  body: string;
}

export interface BackendRequiredDocument {
  label: string;
  auto: boolean;
  note?: string | null;
}

export interface BackendApplicationDraft {
  program_name: string;
  plan_title: string;
  plan_sections: BackendPlanSection[];
  documents: BackendRequiredDocument[];
}

/* ------------------------------------------------------------------ */
/* API fonksiyonları                                                    */
/* ------------------------------------------------------------------ */

/** Konuşma turu — backend ile senkronize tip */
export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Ana orkestratör çağrısı.
 * Kullanıcı mesajından profil → eşleştirme → uygunluk pipeline'ını çalıştırır.
 * `history` ile önceki konuşma turları gönderilir; backend bağlamsal profil çıkarır.
 */
export async function assist(
  message: string,
  history?: ConversationTurn[],
): Promise<BackendAssistResult> {
  return apiFetch<BackendAssistResult>("/assist", {
    method: "POST",
    body: JSON.stringify({ message, history: history ?? [] }),
  });
}

/**
 * Bir profile ve programa göre başvuru taslağı üretir.
 */
export async function fetchApplicationDraft(
  profile: BackendUserProfile,
  programId: string,
): Promise<BackendApplicationDraft> {
  return apiFetch<BackendApplicationDraft>("/application", {
    method: "POST",
    body: JSON.stringify({ profile, program_id: programId }),
  });
}

/**
 * Tüm programları listeler (opsiyonel kategori filtresi).
 */
export async function getPrograms(
  category?: string,
): Promise<BackendSupportProgram[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiFetch<BackendSupportProgram[]>(`/programs${qs}`);
}

/**
 * Bir oturumun kayıtlı profil + eşleşmelerini getirir.
 * Hiç kayıt yoksa backend boş bir durum döner (profil alanları null, matches: []).
 */
export async function fetchSession(sessionId: string): Promise<BackendSessionState> {
  return apiFetch<BackendSessionState>(`/session/${encodeURIComponent(sessionId)}`);
}

/**
 * Bir oturumun profil + eşleşmelerini kaydeder (üzerine yazar).
 */
export async function saveSession(
  sessionId: string,
  state: BackendSessionState,
): Promise<void> {
  await apiFetch<{ status: string }>(`/session/${encodeURIComponent(sessionId)}`, {
    method: "PUT",
    body: JSON.stringify(state),
  });
}
