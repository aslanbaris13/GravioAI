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
  id: string;
  /** Tam Türkçe kategori adı, örn. "Kamu Destekleri" */
  category: string;
  subcategory?: string | null;
  program_name: string;
  institution?: string | null;
  support_type?: string | null;
  amount_min?: number | null;
  amount_max?: number | null;
  currency?: "TRY" | "USD" | "EUR" | null;
  support_rate?: string | null;
  application_status?: "Açık" | "Kapalı" | "Sürekli" | null;
  application_deadline?: string | null;
  application_link?: string | null;
  official_source?: string | null;
  description?: string | null;
  target_audience?: string | null;
  sector?: string | null;
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

/**
 * Ana orkestratör çağrısı.
 * Kullanıcı mesajından profil → eşleştirme → uygunluk pipeline'ını çalıştırır.
 */
export async function assist(message: string): Promise<BackendAssistResult> {
  return apiFetch<BackendAssistResult>("/assist", {
    method: "POST",
    body: JSON.stringify({ message }),
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
