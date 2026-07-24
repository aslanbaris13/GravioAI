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
  /** Verinin çekildiği kaynak sayfa — `official_url` boş/placeholder geldiğinde yedek link olarak kullanılır. */
  source_url?: string | null;
  conditions_summary?: string | null;
  women_entrepreneur?: boolean | null;
  technopark?: boolean | null;
  company_required?: boolean | null;
  student?: boolean | null;
}

export interface BackendUserProfile {
  company_name?: string | null;
  website?: string | null;
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

/** `/application`'ın (LLM ile plan/belge taslağı) ürettiği `BackendApplicationDraft`
 * ile karıştırılmamalı — bu, `applications` tablosundaki kalıcı durum takibi
 * kaydı ("Başvurularım" sayfası). */
export type ApplicationTrackingStatus = "taslak" | "hazirlaniyor" | "gonderildi";

export interface BackendApplicationRecord {
  id: string;
  session_id: string;
  program_id: string;
  program_name: string;
  status: ApplicationTrackingStatus;
  note: string | null;
  reminder_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendRequiredField {
  key: string;
  label: string;
  description: string;
  long_text: boolean;
  prefillable_from_profile: string | null;
}

export interface BackendReportSection {
  id: string;
  title: string;
  description: string;
  required_fields: BackendRequiredField[];
  char_limit: number | null;
}

export interface BackendReportSchema {
  key: string;
  program_name: string;
  institution: string;
  match_keywords: string[];
  summary: string;
  sections: BackendReportSection[];
  required_documents: string[];
}

export interface BackendGeneratedReportSection {
  section_id: string;
  heading: string;
  body: string;
}

export interface BackendGeneratedReport {
  schema_key: string;
  program_name: string;
  title: string;
  sections: BackendGeneratedReportSection[];
}

/** section_id -> {field_key: value} */
export type ReportFieldValues = Record<string, Record<string, string>>;

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
 * `sessionId` verilirse backend, turu bitirdikten sonra profil + eşleşmeleri
 * otomatik olarak hafızaya (user_sessions) kaydeder — çağıran taraf ayrıca
 * `saveSession()` çağırmak zorunda değildir.
 */
export async function assist(
  message: string,
  history?: ConversationTurn[],
  sessionId?: string,
): Promise<BackendAssistResult> {
  return apiFetch<BackendAssistResult>("/assist", {
    method: "POST",
    body: JSON.stringify({ message, history: history ?? [], session_id: sessionId ?? null }),
  });
}

/** `/assist/stream`'in yaydığı olay türleri — bkz. backend `Orchestrator.run_stream`. */
export type AssistStreamEvent =
  | { type: "meta"; profile: BackendUserProfile; matches: BackendProgramMatch[] }
  | { type: "token"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * `assist()`'in streaming karşılığı — yanıt metnini Server-Sent Events (SSE)
 * üzerinden parça parça alır, her olayı `onEvent`'e iletir. `apiFetch`
 * kullanılmıyor çünkü yanıt tek bir JSON değil, satır satır bir SSE akışı.
 */
export async function assistStream(
  message: string,
  history: ConversationTurn[] | undefined,
  sessionId: string | undefined,
  onEvent: (event: AssistStreamEvent) => void,
): Promise<void> {
  const url = `${BASE}/api/assist/stream`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history ?? [], session_id: sessionId ?? null }),
    });
  } catch {
    throw new ApiError(0, "Sunucuya ulaşılamıyor. Backend çalışıyor mu?");
  }
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;
      try {
        onEvent(JSON.parse(dataLine.slice("data: ".length)) as AssistStreamEvent);
      } catch {
        // Bozuk/eksik bir SSE çerçevesi — sessizce atla, akış devam etsin.
      }
    }
  }
}

/**
 * CV/şirket dokümanından (PDF/DOCX/TXT) yapılandırılmış profil çıkarır.
 * `apiFetch` kullanılmıyor çünkü çok parçalı (multipart) gövde gönderiliyor —
 * `Content-Type` header'ı tarayıcı tarafından (boundary ile) otomatik ayarlanmalı.
 */
export async function parseProfileDocument(file: File): Promise<BackendUserProfile> {
  const url = `${BASE}/api/profile/parse-document`;
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(url, { method: "POST", body: formData });
  } catch {
    throw new ApiError(0, "Sunucuya ulaşılamıyor. Backend çalışıyor mu?");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || `HTTP ${res.status}`);
  }
  return res.json() as Promise<BackendUserProfile>;
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

/** Bir programa başvuru sürecini başlatır (Başvurularım — durum takibi).
 * Aynı program için tekrar çağrılırsa mevcut kaydı döner. */
export async function startApplicationTracking(
  sessionId: string,
  programId: string,
  programName: string,
): Promise<BackendApplicationRecord> {
  return apiFetch<BackendApplicationRecord>("/applications", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, program_id: programId, program_name: programName }),
  });
}

/** Bir oturumun tüm başvuru takibi kayıtlarını getirir. */
export async function listApplicationTracking(sessionId: string): Promise<BackendApplicationRecord[]> {
  return apiFetch<BackendApplicationRecord[]>(`/applications?session_id=${encodeURIComponent(sessionId)}`);
}

/** Bir başvuru kaydının durum/not/hatırlatma alanlarını günceller. */
export async function updateApplicationTracking(
  id: string,
  fields: { status?: ApplicationTrackingStatus; note?: string; reminder_date?: string },
): Promise<BackendApplicationRecord> {
  return apiFetch<BackendApplicationRecord>(`/applications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
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
 * Tek bir programı id'siyle getirir. `apiPrograms` önbelleğinde yoksa
 * (ör. doğrudan bir program linkiyle gelindiğinde) yedek olarak kullanılır.
 */
export async function getProgram(id: string): Promise<BackendSupportProgram> {
  return apiFetch<BackendSupportProgram>(`/programs/${encodeURIComponent(id)}`);
}

/**
 * Bir profili belirli bir programa karşı değerlendirir (Uygunluk Ajanı).
 */
export async function evaluateEligibility(
  profile: BackendUserProfile,
  programId: string,
): Promise<BackendEligibilityResult> {
  return apiFetch<BackendEligibilityResult>("/eligibility", {
    method: "POST",
    body: JSON.stringify({ profile, program_id: programId }),
  });
}

/**
 * Bir programın başlığından hangi rapor gereksinim şemasının eşleştiğini
 * bulur — henüz her program için hazır bir şema yok, eşleşme yoksa null döner.
 */
export async function resolveReportSchema(
  programTitle: string,
): Promise<BackendReportSchema | null> {
  const qs = `?program_title=${encodeURIComponent(programTitle)}`;
  return apiFetch<BackendReportSchema | null>(`/report-schemas/resolve${qs}`);
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

/**
 * Bir rapor şemasına göre, bölüm bölüm rapor içeriği üretir (Rapor Yazma Ajanı).
 */
export async function generateReport(
  schemaKey: string,
  profile: BackendUserProfile,
  fieldValues: ReportFieldValues,
): Promise<BackendGeneratedReport> {
  return apiFetch<BackendGeneratedReport>("/reports/generate", {
    method: "POST",
    body: JSON.stringify({ schema_key: schemaKey, profile, field_values: fieldValues }),
  });
}

/**
 * Üretilmiş bir raporu düzenlenebilir .docx dosyası olarak indirir.
 * apiFetch kullanmıyor çünkü yanıt JSON değil, ikili (binary) dosya içeriği.
 */
export async function exportReportDocx(report: BackendGeneratedReport): Promise<Blob> {
  const url = `${BASE}/api/reports/export-docx`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
  } catch {
    throw new ApiError(0, "Sunucuya ulaşılamıyor. Backend çalışıyor mu?");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || `HTTP ${res.status}`);
  }
  return res.blob();
}

export interface BackendPresentationSlide {
  slide_id: string;
  heading: string;
  bullets: string[];
}

export interface BackendGeneratedPresentation {
  title: string;
  subtitle: string;
  slides: BackendPresentationSlide[];
}

/** `presentations` tablosunda arşivlenmiş, kalıcı bir sunum kaydı ("Geçmiş Sunumlarım"). */
export interface BackendPresentationRecord {
  id: string;
  session_id: string;
  title: string;
  subtitle: string;
  company_name: string;
  slides: BackendPresentationSlide[];
  created_at: string;
}

/**
 * Sabit slayt iskeletinden, profile özel bir yatırımcı/müşteri sunumu üretir.
 * `sessionId` verilirse üretilen sunum "Geçmiş Sunumlarım" arşivine de kaydedilir.
 */
export async function generatePresentation(
  profile: BackendUserProfile,
  companyName: string,
  extraContext: string,
  sessionId?: string,
): Promise<BackendGeneratedPresentation> {
  return apiFetch<BackendGeneratedPresentation>("/presentations/generate", {
    method: "POST",
    body: JSON.stringify({
      profile,
      company_name: companyName,
      extra_context: extraContext,
      session_id: sessionId ?? null,
    }),
  });
}

/** Bir oturumun daha önce ürettiği tüm sunumları getirir. */
export async function listPresentations(sessionId: string): Promise<BackendPresentationRecord[]> {
  return apiFetch<BackendPresentationRecord[]>(`/presentations?session_id=${encodeURIComponent(sessionId)}`);
}

/**
 * Üretilmiş bir sunumu düzenlenebilir .pptx dosyası olarak indirir.
 */
export async function exportPresentationPptx(
  presentation: BackendGeneratedPresentation,
): Promise<Blob> {
  const url = `${BASE}/api/presentations/export-pptx`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(presentation),
    });
  } catch {
    throw new ApiError(0, "Sunucuya ulaşılamıyor. Backend çalışıyor mu?");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || `HTTP ${res.status}`);
  }
  return res.blob();
}
