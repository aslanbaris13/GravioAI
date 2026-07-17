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
import { assist, fetchApplicationDraft, fetchSession, saveSession } from "@/lib/api";
import type { BackendAssistResult, BackendUserProfile, ConversationTurn } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import {
  adaptAssistResult,
  adaptApplicationDraft,
  adaptSessionState,
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

const EMPTY_PROFILE: BackendUserProfile = {
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

  onNewChat: () => void;
  onOnboardingComplete: (profile: BackendUserProfile) => void;
  onOnboardingSkip: () => void;
  onSend: () => Promise<void>;
  onFollowup: (key: string) => void;
  onSuggestion: (key: string) => void;
  onCtaAction: (action: "go-matches" | "apply-bigg") => void;
  toggleDoc: (id: string) => void;
  onCopyPlan: () => void;
  onDownloadPlan: () => void;
  resolveProgram: (id: string) => Program | null;
  applyProgram: (id: string) => Promise<void>;

  goToChat: () => void;
  goToMatches: () => void;
  goToProgram: (id: string) => void;
  goToEligibility: (id: string) => void;
  goToReport: (id: string) => void;
  goToReportGenerate: (id: string) => void;
  goToPanel: () => void;
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
  const [applicationDraft, setApplicationDraft] = useState<ApplicationDraft | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);

  const idRef = useRef(1);
  const nextId = () => String(idRef.current++);

  function persistSession(raw: BackendAssistResult) {
    saveSession(getSessionId(), { profile: raw.profile, matches: raw.matches }).catch(() => {});
  }

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

  function onNewChat() {
    setMessages([]);
    setTyping(false);
    setInput("");
    setFollowups([]);
    setCurrentProfile(null);
    setApiPrograms([]);
    setApplicationDraft(null);
    saveSession(getSessionId(), { profile: EMPTY_PROFILE, matches: [] }).catch(() => {});
  }

  function onOnboardingComplete(profile: BackendUserProfile) {
    window.localStorage.setItem("gravioai_onboarding_complete", "1");
    setCurrentProfile(profile);
    push({
      role: "assistant",
      kind: "text",
      text: "Harika, seni tanıdım! Sana uygun destekleri bulmak için bir soru sorabilir ya da \"bana uygun destekleri göster\" diyebilirsin.",
    });
    const chips = profileToChips(profile);
    if (chips.length > 0) push({ role: "assistant", kind: "profile", chips });
    saveSession(getSessionId(), { profile, matches: [] }).catch(() => {});
    router.push("/chat");
  }

  function onOnboardingSkip() {
    window.localStorage.setItem("gravioai_onboarding_complete", "1");
    router.push("/chat");
  }

  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || typing) return;

    setMessages((prev) => [...prev, { id: nextId(), role: "user", text } as ChatMessage]);
    setInput("");
    setFollowups([]);
    setTyping(true);

    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "assistant", kind: "loading" } as ChatMessage,
    ]);

    try {
      const raw = await assist(text, buildHistory(messages));
      persistSession(raw);
      const { profile, programs, reply } = adaptAssistResult(raw);

      setCurrentProfile(profile);
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
      if (reply) responses.push({ role: "assistant", kind: "text", text: reply });

      if (responses.length === 0) {
        responses.push({
          role: "assistant",
          kind: "text",
          text: "Profilini tam çıkaramadım. Sektör, şehir, ekip büyüklüğü ve hedefin hakkında biraz daha bilgi verir misin?",
        });
      }

      replaceLastWith(responses);

      if (programIds.length > 0) {
        setFollowups([
          { key: "apply", label: `${programs[0].name} başvurusunu hazırla` },
          { key: "more", label: "Daha fazla destek göster" },
        ]);
      }
    } catch (err: unknown) {
      removeLastLoading();
      const msg = err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.";
      push({ role: "assistant", kind: "error", text: `Bir sorun oluştu: ${msg}` });
    } finally {
      setTyping(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, typing]);

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
      // Not: assist() (gerçek ağ isteği) bilerek setMessages updater'ının
      // DIŞINDA çağrılıyor — updater'ın içine konursa React 18 StrictMode
      // dev modda updater'ı iki kere çalıştırıp isteği ikiye katlıyor.
      const snapshotHistory = buildHistory(messages);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "user", text: label } as ChatMessage,
        { id: nextId(), role: "assistant", kind: "loading" } as ChatMessage,
      ]);
      setFollowups([]);
      setTyping(true);

      assist(label, snapshotHistory)
        .then((raw) => {
          persistSession(raw);
          const { profile, programs, reply } = adaptAssistResult(raw);
          setCurrentProfile(profile);
          setApiPrograms((prev2) => {
            const existingIds = new Set(prev2.map((p) => p.id));
            const fresh = programs.filter((p) => !existingIds.has(p.id));
            return [...prev2, ...fresh];
          });

          const chips = profileToChips(profile);
          const programIds = programs.map((p) => p.id);
          const responses: ChatMessageDraft[] = [];
          if (chips.length > 0) responses.push({ role: "assistant", kind: "profile", chips });
          if (programIds.length > 0) responses.push({ role: "assistant", kind: "cards", programIds });
          if (reply) responses.push({ role: "assistant", kind: "text", text: reply });

          replaceLastWith(responses);

          if (programIds.length > 0) {
            setFollowups([
              { key: "apply", label: `${programs[0].name} başvurusunu hazırla` },
              { key: "more", label: "Daha fazla destek göster" },
            ]);
          }
        })
        .catch((err: unknown) => {
          removeLastLoading();
          const msg = err instanceof Error ? err.message : "Hata oluştu.";
          setMessages((m) => [
            ...m,
            { id: nextId(), role: "assistant", kind: "error", text: msg } as ChatMessage,
          ]);
        })
        .finally(() => {
          setTyping(false);
          setInput("");
        });
    }, 50);
  }

  function goToChat() {
    router.push("/chat");
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

  /** Başvuru taslağını backend'den çeker ve başvuru sayfasına geçer. */
  async function applyProgram(id: string) {
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
   * (sessizce sahte bir mock programa düşülmüyor). */
  function resolveProgram(id: string): Program | null {
    return apiPrograms.find((p) => p.id === id) ?? null;
  }

  const matchCount = apiPrograms.length;

  const value: AppState = {
    sidebarOpen,
    setSidebarOpen,
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
    onNewChat,
    onOnboardingComplete,
    onOnboardingSkip,
    onSend,
    onFollowup,
    onSuggestion,
    onCtaAction,
    toggleDoc,
    onCopyPlan,
    onDownloadPlan,
    resolveProgram,
    applyProgram,
    goToChat,
    goToMatches,
    goToProgram,
    goToEligibility,
    goToReport,
    goToReportGenerate,
    goToPanel,
  };

  return <AppStateCtx.Provider value={value}>{children}</AppStateCtx.Provider>;
}
