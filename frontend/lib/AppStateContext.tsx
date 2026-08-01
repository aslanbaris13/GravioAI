/**
 * Uygulama genelinde paylaşılan durum (mesajlar, profil, eşleşmeler, taslaklar)
 * ve bunları değiştiren fonksiyonlar. Sayfalar (app/*) artık gerçek rotalar
 * olduğu için bu state, route değişince kaybolmaması adına layout seviyesinde
 * bir context'te tutuluyor — eskiden tek bir page.tsx'in içindeki state'ti.
 */
"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  assistStream,
  evaluateEligibility,
  fetchApplicationDraft,
  fetchSession,
  getProgram,
  listApplicationTracking,
  listIngestionRuns,
  saveSession,
  startApplicationTracking,
  updateApplicationTracking,
} from "@/lib/api";
import type {
  ApplicationTrackingStatus,
  AssistStreamEvent,
  BackendApplicationRecord,
  BackendEligibilityResult,
  BackendIngestionRun,
  BackendUserProfile,
  ConversationTurn,
} from "@/lib/api";
import { getSessionId } from "@/lib/session";
import { getSupabase } from "@/lib/supabase";
import {
  adaptApplicationDraft,
  adaptProgram,
  adaptSessionState,
  mergeProfile,
  profileToChips,
} from "@/lib/adapter";
import type {
  ApplicationDraft,
  ChatMessage,
  ChatMessageDraft,
  DocItem,
  FollowUp,
  Program,
  ProgramCategory,
} from "@/lib/types";

const TOAST_MS = 2200;

/** Ana sayfadaki ChatWidget'ın yazdığı ilk mesajı /chat'e taşıdığı anahtar.
 *  Tek kaynak olsun diye ChatWidget da bunu import eder. */
export const WIDGET_DRAFT_KEY = "gravioai_widget_draft";

/** Uygunluk değerlendirmesi yapılamadığında kullanılan nötr yer tutucu —
 *  "uygun değilsin" demez, "henüz bakılmadı" der (bkz. ensureProgram). */
const UNEVALUATED_ELIGIBILITY: BackendEligibilityResult = {
  state: "locked",
  score: 0,
  label: "Uygunluk hesaplanmadı",
  conditions: [],
};

const EMPTY_PROFILE: BackendUserProfile = {
  company_name: null,
  website: null,
  sector: null,
  city: null,
  team_size: null,
  company_exists: null,
  company_age_years: null,
  women_entrepreneur: null,
  student: null,
  in_technopark: null,
  goals: [],
  summary: null,
};

interface AppState {
  sidebarOpen: boolean;
  /** Masaüstünde tam panelin daraltılıp ince ikon rayına düşmesi.
   *  `sidebarOpen` mobil çekmece içindir, ikisi ayrı kavram. */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
  filterCat: "all" | ProgramCategory;
  setFilterCat: (v: "all" | ProgramCategory) => void;
  messages: ChatMessage[];
  typing: boolean;
  input: string;
  setInput: (v: string) => void;
  followups: FollowUp[];
  docs: DocItem[];
  toastShow: boolean;
  toastText: string;
  currentProfile: BackendUserProfile | null;
  apiPrograms: Program[];
  applicationDraft: ApplicationDraft | null;
  applyLoading: boolean;
  matchCount: number;
  trackedApplications: BackendApplicationRecord[];
  refreshApplications: () => Promise<void>;
  ingestionRuns: BackendIngestionRun[];
  updateApplicationRecord: (
    id: string,
    fields: { status?: ApplicationTrackingStatus; note?: string; reminder_date?: string },
  ) => Promise<void>;

  onNewChat: () => void;
  onOnboardingComplete: (profile: BackendUserProfile) => void;
  onOnboardingSkip: () => void;
  onSend: () => Promise<void>;
  consumeWidgetDraft: () => void;
  onFollowup: (key: string) => void;
  onSuggestion: (key: string) => void;
  onCtaAction: (action: "go-matches" | "apply-bigg") => void;
  toggleDoc: (id: string) => void;
  onCopyPlan: () => void;
  onDownloadPlan: () => void;
  resolveProgram: (id: string) => Program | null;
  ensureProgram: (id: string) => Promise<Program | null>;
  applyProgram: (id: string) => Promise<void>;

  /** Girişli kullanıcının e-postası; anonimse null. */
  userEmail: string | null;
  signOut: () => Promise<void>;

  goToChat: () => void;
  goToOnboarding: () => void;
  goToMatches: () => void;
  goToProgram: (id: string) => void;
  goToEligibility: (id: string) => void;
  goToReport: (id: string) => void;
  goToReportGenerate: (id: string) => void;
  goToPanel: () => void;
  goToNewPresentation: () => void;
  goToApplications: () => void;
}

const AppStateCtx = createContext<AppState | null>(null);

export function useAppState(): AppState {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error("useAppState, AppStateProvider içinde kullanılmalı");
  return ctx;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterCat, setFilterCat] = useState<"all" | ProgramCategory>("all");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [toastShow, setToastShow] = useState(false);
  const [toastText, setToastText] = useState("");

  const [currentProfile, setCurrentProfile] = useState<BackendUserProfile | null>(null);
  const [apiPrograms, setApiPrograms] = useState<Program[]>([]);
  // Yalnızca görüntülemek için çekilen programlar (ana sayfadaki vitrinden,
  // paylaşılan bir linkten ya da sayfa yenilemesinden gelinen detaylar).
  // `apiPrograms`ten kasıtlı olarak ayrı tutulur: orası profile göre gerçekten
  // eşleşen programların listesidir ve Eşleşmelerim/Panelim ile sidebar
  // rozetini besler — göz atılan bir program eşleşme sayılmamalı.
  const [browsedPrograms, setBrowsedPrograms] = useState<Program[]>([]);
  const [applicationDraft, setApplicationDraft] = useState<ApplicationDraft | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [trackedApplications, setTrackedApplications] = useState<BackendApplicationRecord[]>([]);
  const [ingestionRuns, setIngestionRuns] = useState<BackendIngestionRun[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  /** Supabase oturumunu dinler. Yapılandırma yoksa (anahtarlar henüz yok)
   *  hiçbir şey yapmaz — uygulama anonim çalışmaya devam eder. */
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const idRef = useRef(1);
  const nextId = () => String(idRef.current++);

  /** Uygulama açılışında önceki oturumdan kalan profil + eşleşmeleri geri yükler. */
  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    fetchSession(sessionId)
      .then((raw) => {
        const { profile, programs } = adaptSessionState(raw);
        const chips = profileToChips(profile);
        if (chips.length === 0 && programs.length === 0) return;

        setCurrentProfile(profile);
        setApiPrograms(programs);

        const responses: ChatMessageDraft[] = [
          { role: "assistant", kind: "note", text: "Önceki oturumundan devam ediyorsun." },
        ];
        if (chips.length > 0) responses.push({ role: "assistant", kind: "profile", chips });
        if (programs.length > 0) {
          responses.push({ role: "assistant", kind: "cards", programIds: programs.map((p) => p.id) });
        }
        replaceLastWith(responses);
      })
      .catch(() => {
        // Oturum çekilemezse sessizce yeni bir sohbet gibi devam et
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Başvurularım listesini backend'den yeniden çeker. */
  const refreshApplications = useCallback(async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    try {
      const records = await listApplicationTracking(sessionId);
      setTrackedApplications(records);
    } catch {
      // Sessizce yoksay — Başvurularım sayfası boş/eski listeyle devam eder
    }
  }, []);

  useEffect(() => {
    void refreshApplications();
  }, [refreshApplications]);

  /** Panelde "veri ne zaman güncellendi" göstermek için — oturumdan bağımsız,
   *  uygulama açılışında bir kez çekilir. */
  useEffect(() => {
    listIngestionRuns()
      .then(setIngestionRuns)
      .catch(() => {
        // Sessizce yoksay — panel bu bilgi olmadan da çalışır
      });
  }, []);

  /** Bir başvuru kaydının durum/not alanlarını günceller ve listeyi tazeler. */
  async function updateApplicationRecord(
    id: string,
    fields: { status?: ApplicationTrackingStatus; note?: string; reminder_date?: string },
  ) {
    const updated = await updateApplicationTracking(id, fields);
    setTrackedApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }

  function goToApplications() {
    router.push("/applications");
  }

  /** Yalnızca text mesajları alır; profil/kart/cta gibi UI-özel turlar kapsam dışı. */
  function buildHistory(msgs: ChatMessage[]): ConversationTurn[] {
    const turns: ConversationTurn[] = [];
    for (const m of msgs) {
      if (m.role === "user") {
        turns.push({ role: "user", content: m.text });
      } else if (m.role === "assistant" && m.kind === "text") {
        turns.push({ role: "assistant", content: m.text });
      }
    }
    return turns;
  }

  function push(msg: ChatMessageDraft) {
    setMessages((prev) => [...prev, { ...msg, id: nextId() } as ChatMessage]);
  }

  function replaceLastWith(msgs: ChatMessageDraft[]) {
    setMessages((prev) => {
      const withoutLoading = prev.filter((m) => !(m.role === "assistant" && m.kind === "loading"));
      return [
        ...withoutLoading,
        ...msgs.map((m, i) => ({ ...m, id: nextId(), delay: i * 90 } as ChatMessage)),
      ];
    });
  }

  function removeLastLoading() {
    setMessages((prev) => prev.filter((m) => !(m.role === "assistant" && m.kind === "loading")));
  }

  /** Yeni sohbet yalnızca konuşma metnini sıfırlar — işletme profili ve
   *  eşleşmeler (Eşleşmelerim, Panelim) korunur. Önceden profil de
   *  sıfırlanıp backend'e boş profil olarak kaydediliyordu; bu da yeni bir
   *  sohbete başlamanın önceden bulunan eşleşmeleri de silmesine yol
   *  açıyordu — ChatGPT/Claude gibi araçlarda "yeni sohbet" hesabı/geçmiş
   *  verileri silmez, sadece o anki konuşmayı sıfırlar. */
  function onNewChat() {
    setMessages([]);
    setTyping(false);
    setInput("");
    setFollowups([]);
    setApplicationDraft(null);
  }

  function onOnboardingComplete(profile: BackendUserProfile) {
    window.localStorage.setItem("gravioai_onboarding_complete", "1");
    setCurrentProfile(profile);
    router.push("/chat");

    // Onboarding'in yapılandırılmış (zengin) profilini önce kaydediyoruz ki
    // aşağıdaki sendMessage turu backend'de bunu temel alıp birleştirsin
    // (merge_profile) — yoksa serbest metinden yeniden çıkarım, formda
    // toplanan company_name/website gibi alanları kaybedebilir.
    saveSession(getSessionId(), { profile, matches: [] }).catch(() => {});

    // Eşleşmelerim'in onboarding sonrası boş kalmaması için gerçek eşleştirme
    // turu burada tetiklenir — kullanıcının "bana uygun destekleri göster"
    // yazmasını beklemeden. `profile.summary` onboarding formunun ürettiği
    // (serbest metin veya yapılandırılmış alanlardan kurulmuş) özet metindir.
    const openingMessage = profile.summary?.trim() || "İşletmemi tanıttım, bana uygun destekleri göster.";
    void sendMessage(openingMessage, []);
  }

  function onOnboardingSkip() {
    window.localStorage.setItem("gravioai_onboarding_complete", "1");
    router.push("/chat");
  }

  /** onSend ve onSuggestion'ın ortak çekirdeği — assistStream() ile yanıtı
   * token token alır: "meta" gelince profil/kart mesajları, ilk "token"
   * gelince yeni bir metin balonu, sonrakilerde o balonun metnine ekleme. */
  async function sendMessage(text: string, history: ConversationTurn[]) {
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text } as ChatMessage,
      { id: nextId(), role: "assistant", kind: "loading" } as ChatMessage,
    ]);
    setFollowups([]);
    setTyping(true);

    let streamingMessageId: string | null = null;
    let sawAnyContent = false;
    let lastPrograms: Program[] = [];

    function onEvent(event: AssistStreamEvent) {
      if (event.type === "meta") {
        const { profile, programs } = adaptSessionState({ profile: event.profile, matches: event.matches });
        lastPrograms = programs;
        setCurrentProfile((prev) => mergeProfile(prev, profile));
        setApiPrograms((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const fresh = programs.filter((p) => !existingIds.has(p.id));
          return [...prev, ...fresh];
        });

        const chips = profileToChips(profile);
        const programIds = programs.map((p) => p.id);
        const responses: ChatMessageDraft[] = [];
        if (chips.length > 0) responses.push({ role: "assistant", kind: "profile", chips });
        if (programIds.length > 0) responses.push({ role: "assistant", kind: "cards", programIds });
        if (responses.length > 0) sawAnyContent = true;
        replaceLastWith(responses);
      } else if (event.type === "token") {
        sawAnyContent = true;
        if (streamingMessageId === null) {
          const id = nextId();
          streamingMessageId = id;
          setMessages((prev) => [
            ...prev,
            { id, role: "assistant", kind: "text", text: event.text, delay: 0 } as ChatMessage,
          ]);
        } else {
          const id = streamingMessageId;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id && m.role === "assistant" && m.kind === "text"
                ? { ...m, text: m.text + event.text }
                : m,
            ),
          );
        }
      } else if (event.type === "error") {
        push({ role: "assistant", kind: "error", text: `Bir sorun oluştu: ${event.message}` });
      } else if (event.type === "done") {
        if (!sawAnyContent) {
          push({
            role: "assistant",
            kind: "text",
            text: "Profilini tam çıkaramadım. Sektör, şehir, ekip büyüklüğü ve hedefin hakkında biraz daha bilgi verir misin?",
          });
        }
        if (lastPrograms.length > 0) {
          setFollowups([
            { key: "apply", label: `${lastPrograms[0].name} başvurusunu hazırla` },
            { key: "more", label: "Daha fazla destek göster" },
          ]);
        }
      }
    }

    try {
      await assistStream(text, history, getSessionId(), onEvent);
    } catch (err: unknown) {
      removeLastLoading();
      const msg = err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.";
      push({ role: "assistant", kind: "error", text: `Bir sorun oluştu: ${msg}` });
    } finally {
      setTyping(false);
    }
  }

  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || typing) return;
    const history = buildHistory(messages);
    setInput("");
    await sendMessage(text, history);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, typing]);

  /** Ana sayfadaki ChatWidget, kullanıcının yazdığı ilk mesajı localStorage'a
   *  bırakıp /chat'e yönlendirir. Sohbet ekranı açılınca o mesaj burada
   *  tüketilip gerçek bir tura dönüştürülür — yoksa kullanıcı yazdığı soruyu
   *  kaybedip boş bir sohbete düşüyordu. */
  function consumeWidgetDraft() {
    let draft: string | null = null;
    try {
      draft = window.localStorage.getItem(WIDGET_DRAFT_KEY);
      if (draft) window.localStorage.removeItem(WIDGET_DRAFT_KEY);
    } catch {
      return; // depolama kapalıysa taslak da yoktur
    }
    const text = draft?.trim();
    if (!text || typing) return;
    const history = buildHistory(messages);
    // onSuggestion ile aynı gerekçe: StrictMode'un çift render'ında isteği
    // ikiye katlamamak için ağ çağrısı bir tur ertelenir.
    setTimeout(() => void sendMessage(text, history), 50);
  }

  function onFollowup(key: string) {
    if (key === "apply" && apiPrograms.length > 0) {
      applyProgram(apiPrograms[0].id);
      return;
    }
    if (key === "more") {
      router.push("/matches");
      return;
    }
    setInput(key);
  }

  function onSuggestion(suggestionKey: string) {
    const labelMap: Record<string, string> = {
      profile: "Düzce'de yeni bir AI yazılım girişimi kurdum, 3 kişiyiz",
      cloud: "Bulut altyapısı için kredi arıyorum",
      arge: "Ar-Ge hibesine uygun muyum?",
      all: "Yeni şirketim için tüm destekleri göster",
    };
    const label = labelMap[suggestionKey] ?? suggestionKey;
    setInput(label);
    setTimeout(() => {
      // Not: sendMessage() (gerçek ağ isteği) bilerek setTimeout ile
      // ertelenip çağrılıyor — doğrudan render sırasında tetiklenirse
      // React 18 StrictMode dev modda iki kere çalışıp isteği ikiye katlıyor.
      const snapshotHistory = buildHistory(messages);
      setInput("");
      void sendMessage(label, snapshotHistory);
    }, 50);
  }

  function goToChat() {
    router.push("/chat");
  }

  function goToOnboarding() {
    router.push("/onboarding");
  }

  /** Çıkış — oturumu kapatır ve kullanıcıya ait TÜM yerel state'i sıfırlar.
   *  Bu temizlik olmazsa aynı tarayıcıda giriş yapan bir sonraki kişi,
   *  öncekinin profilini, eşleşmelerini ve başvurularını görür. */
  async function signOut() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();

    setUserEmail(null);
    setMessages([]);
    setTyping(false);
    setInput("");
    setFollowups([]);
    setCurrentProfile(null);
    setApiPrograms([]);
    setBrowsedPrograms([]);
    setApplicationDraft(null);
    setDocs([]);
    setTrackedApplications([]);
    router.push("/");
  }

  function goToMatches() {
    router.push("/matches");
  }

  function goToProgram(id: string) {
    router.push(`/program/${id}`);
  }

  function goToEligibility(id: string) {
    router.push(`/program/${id}/eligibility`);
  }

  function goToReport(id: string) {
    router.push(`/program/${id}/report`);
  }

  function goToReportGenerate(id: string) {
    router.push(`/program/${id}/report/generate`);
  }

  function goToPanel() {
    router.push("/panel");
  }

  function goToNewPresentation() {
    router.push("/presentations/new");
  }

  /** Başvuru taslağını backend'den çeker ve başvuru sayfasına geçer. */
  async function applyProgram(id: string) {
    // Başvuru sürecini Başvurularım'da takip edilebilir hale getirir — plan/belge
    // taslağı üretiminden bağımsız, sessizce en iyi çaba (best-effort): burası
    // başarısız olsa da kullanıcı başvuru akışına devam edebilmeli.
    const sessionId = getSessionId();
    const program = resolveProgram(id);
    if (sessionId && program) {
      startApplicationTracking(sessionId, id, program.name)
        .then(() => refreshApplications())
        .catch(() => {});
    }

    if (!currentProfile) {
      router.push(`/program/${id}/application`);
      return;
    }

    setApplyLoading(true);
    try {
      const raw = await fetchApplicationDraft(currentProfile, id);
      const draft = adaptApplicationDraft(raw);
      setApplicationDraft(draft);
      setDocs(draft.docs);
    } catch {
      setApplicationDraft(null);
      setDocs([]);
    } finally {
      setApplyLoading(false);
      router.push(`/program/${id}/application`);
    }
  }

  function onCtaAction(action: "go-matches" | "apply-bigg") {
    if (action === "apply-bigg") {
      const biggId = apiPrograms.find((p) => p.name.toLowerCase().includes("bigg"))?.id ?? "bigg";
      applyProgram(biggId);
    } else {
      router.push("/matches");
    }
  }

  function toggleDoc(id: string) {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, done: !d.done } : d)));
    setApplicationDraft((prev) =>
      prev
        ? { ...prev, docs: prev.docs.map((d) => (d.id === id ? { ...d, done: !d.done } : d)) }
        : prev,
    );
  }

  function flash(text: string) {
    setToastText(text);
    setToastShow(true);
    setTimeout(() => setToastShow(false), TOAST_MS);
  }

  function buildPlanText(): string {
    if (applicationDraft) {
      const lines: string[] = [
        applicationDraft.planTitle,
        "",
        ...applicationDraft.planSections.flatMap((s) => [s.heading, s.body, ""]),
      ];
      return lines.join("\n");
    }
    return "Başvuru taslağı henüz yüklenmedi.";
  }

  function onCopyPlan() {
    navigator.clipboard
      ?.writeText(buildPlanText())
      .then(() => flash("İş planı taslağı kopyalandı"))
      .catch(() => flash("Kopyalama desteklenmiyor, indirmeyi deneyebilirsin"));
  }

  function onDownloadPlan() {
    const blob = new Blob([buildPlanText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = applicationDraft
      ? `${applicationDraft.programName.replace(/\s+/g, "-")}-Is-Plani.txt`
      : "Basvuru-Is-Plani.txt";
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    flash("Taslak indiriliyor");
  }

  /** Yalnızca API'den gelen gerçek programlara bakar — bulunamazsa null döner
   * (sessizce sahte bir mock programa düşülmüyor). Önce eşleşmelere, sonra
   * yalnızca görüntülenmiş programlara bakar: aynı program ikisinde birdense
   * eşleşme kaydı kazanır, çünkü orada gerçek uygunluk değerlendirmesi var. */
  function resolveProgram(id: string): Program | null {
    return (
      apiPrograms.find((p) => p.id === id) ??
      browsedPrograms.find((p) => p.id === id) ??
      null
    );
  }

  /** `resolveProgram` bu oturumda daha önce görülmüş (sohbetten/session'dan
   * gelen) programlara bakar — doğrudan bir program linkiyle (paylaşılan
   * link, sayfa yenileme sonrası) gelindiğinde önbellek boş olabilir ve
   * program aslında var olsa da "program bulunamadı" gösterilir. Bu durumda
   * backend'den tek programı + uygunluğunu çekip önbelleğe ekleriz. */
  async function ensureProgram(id: string): Promise<Program | null> {
    const cached = resolveProgram(id);
    if (cached) return cached;

    // Programın kendisi ile uygunluk değerlendirmesi kasıtlı olarak ayrı
    // denenir: /eligibility bir LLM çağrısıdır (yavaş + rate-limit'li) ve
    // profili olmayan bir ziyaretçi için zaten anlamlı bir sonuç üretmez.
    // Başarısız olursa programı komple "bulunamadı" saymak yanlış olur —
    // detay ekranının gösterdiği her şey (tutar, kriterler, kaynak, özet)
    // programın kendisinden gelir. Bu yüzden nötr bir uygunluk yer tutucusuyla
    // devam ediyoruz; gerçek değerlendirme kullanıcı Uygunluk ekranına
    // geçtiğinde yapılır.
    let sp;
    try {
      sp = await getProgram(id);
    } catch {
      return null; // program gerçekten yok/erişilemiyor
    }

    let er: BackendEligibilityResult;
    try {
      er = await evaluateEligibility(currentProfile ?? EMPTY_PROFILE, id);
    } catch {
      er = UNEVALUATED_ELIGIBILITY;
    }

    const program = adaptProgram(sp, er);
    // Eşleşme listesine DEĞİL, göz atılanlar önbelleğine yazılır — bu program
    // kullanıcının profiline göre eşleştirilmedi, sadece açıldı.
    setBrowsedPrograms((prev) => (prev.some((p) => p.id === program.id) ? prev : [...prev, program]));
    return program;
  }

  // Süresi geçmiş programlar Eşleşmelerim listesinde gösterilmiyor
  // (bkz. MatchesView) — sidebar rozeti de aynı sayıyı yansıtmalı.
  const matchCount = apiPrograms.filter((p) => !p.deadlineExpired).length;

  const value: AppState = {
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    filterCat,
    setFilterCat,
    messages,
    typing,
    input,
    setInput,
    followups,
    docs,
    toastShow,
    toastText,
    currentProfile,
    apiPrograms,
    applicationDraft,
    applyLoading,
    matchCount,
    trackedApplications,
    refreshApplications,
    ingestionRuns,
    updateApplicationRecord,
    onNewChat,
    onOnboardingComplete,
    onOnboardingSkip,
    onSend,
    consumeWidgetDraft,
    onFollowup,
    onSuggestion,
    onCtaAction,
    toggleDoc,
    onCopyPlan,
    onDownloadPlan,
    resolveProgram,
    ensureProgram,
    applyProgram,
    userEmail,
    signOut,
    goToChat,
    goToOnboarding,
    goToMatches,
    goToProgram,
    goToEligibility,
    goToReport,
    goToReportGenerate,
    goToPanel,
    goToNewPresentation,
    goToApplications,
  };

  return <AppStateCtx.Provider value={value}>{children}</AppStateCtx.Provider>;
}
