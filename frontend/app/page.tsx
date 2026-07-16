"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";
import Ms from "@/components/Ms";
import ChatView from "@/components/ChatView";
import MatchesView from "@/components/MatchesView";
import DetailView from "@/components/DetailView";
import EligibilityView from "@/components/EligibilityView";
import ApplicationView from "@/components/ApplicationView";
import DashboardView from "@/components/DashboardView";
import OnboardingView from "@/components/OnboardingView";
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
  ViewName,
} from "@/lib/types";

const TOAST_MS = 2200;
const ONBOARDING_DONE_KEY = "gravioai_onboarding_complete";

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

export default function Home() {
  const [view, setView] = useState<ViewName>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [filterCat, setFilterCat] = useState<"all" | ProgramCategory>("all");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [toastShow, setToastShow] = useState(false);
  const [toastText, setToastText] = useState("");

  // Gerçek API'den gelen veriler
  const [currentProfile, setCurrentProfile] = useState<BackendUserProfile | null>(null);
  const [apiPrograms, setApiPrograms] = useState<Program[]>([]);
  const [applicationDraft, setApplicationDraft] = useState<ApplicationDraft | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);

  const idRef = useRef(1);
  const nextId = () => String(idRef.current++);

  /** Oturumun profil + eşleşmelerini kalıcı kılar; başarısız olursa sohbeti bozmadan yutar. */
  function persistSession(raw: BackendAssistResult) {
    saveSession(getSessionId(), { profile: raw.profile, matches: raw.matches }).catch(() => {});
  }

  /** İlk ziyarette (localStorage'da tamamlanma işareti yoksa) onboarding'i gösterir.
   * SSR ile hydration uyumsuzluğu yaşamamak için varsayılan view her zaman "chat" —
   * bu effect çalışıp gerekiyorsa "onboarding"e geçiriyor (tek kare gecikme, sorun değil). */
  useEffect(() => {
    const done = window.localStorage.getItem(ONBOARDING_DONE_KEY);
    if (!done) setView("onboarding");
  }, []);

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

  /** Mevcut mesaj listesini backend history formatına dönüştürür.
   * Yalnızca text mesajları alır; profil/kart/cta gibi UI-özel turlar kapsam dışı.
   */
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
      // Son "loading" mesajını kaldır, yenilerini ekle
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
    // Kalıcı oturumu da temizle — aksi halde sayfa yenilenince eski profil/eşleşmeler geri gelir
    saveSession(getSessionId(), { profile: EMPTY_PROFILE, matches: [] }).catch(() => {});
  }

  /** Onboarding tamamlandığında: profil çıkarma ajanına hiç uğramadan (LLM
   * çağrısı yok) profili doğrudan kaydeder ve sohbete devam eder. */
  function onOnboardingComplete(profile: BackendUserProfile) {
    window.localStorage.setItem(ONBOARDING_DONE_KEY, "1");
    setCurrentProfile(profile);
    push({
      role: "assistant",
      kind: "text",
      text: "Harika, seni tanıdım! Sana uygun destekleri bulmak için bir soru sorabilir ya da \"bana uygun destekleri göster\" diyebilirsin.",
    });
    const chips = profileToChips(profile);
    if (chips.length > 0) push({ role: "assistant", kind: "profile", chips });
    saveSession(getSessionId(), { profile, matches: [] }).catch(() => {});
    setView("chat");
  }

  function onOnboardingSkip() {
    window.localStorage.setItem(ONBOARDING_DONE_KEY, "1");
    setView("chat");
  }

  /** Ana gönderme fonksiyonu — gerçek API çağrısı yapar */
  const onSend = useCallback(async () => {
    const text = input.trim();
    if (!text || typing) return;

    // Kullanıcı mesajını ekle
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text } as ChatMessage,
    ]);
    setInput("");
    setFollowups([]);
    setTyping(true);

    // Yükleniyor göstergesi
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
        // Aynı id varsa güncelle, yoksa ekle
        const existingIds = new Set(prev.map((p) => p.id));
        const fresh = programs.filter((p) => !existingIds.has(p.id));
        return [...prev, ...fresh];
      });

      const chips = profileToChips(profile);
      const programIds = programs.map((p) => p.id);

      const responses: ChatMessageDraft[] = [];

      if (chips.length > 0) {
        responses.push({ role: "assistant", kind: "profile", chips });
      }

      if (programIds.length > 0) {
        responses.push({ role: "assistant", kind: "cards", programIds });
      }

      if (reply) {
        responses.push({ role: "assistant", kind: "text", text: reply });
      }

      if (responses.length === 0) {
        responses.push({
          role: "assistant",
          kind: "text",
          text: "Profilini tam çıkaramadım. Sektör, şehir, ekip büyüklüğü ve hedefin hakkında biraz daha bilgi verir misin?",
        });
      }

      replaceLastWith(responses);

      // Takip önerileri
      if (programIds.length > 0) {
        setFollowups([
          { key: "apply", label: `${programs[0].name} başvurusunu hazırla` },
          { key: "more", label: "Daha fazla destek göster" },
        ]);
      }
    } catch (err: unknown) {
      removeLastLoading();
      const msg =
        err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.";
      push({
        role: "assistant",
        kind: "error",
        text: `Bir sorun oluştu: ${msg}`,
      });
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
      setView("matches");
      return;
    }
    // Fallback
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
    // Kısa gecikme ile gönder
    setTimeout(() => {
      // Not: assist() (gerçek ağ isteği) bilerek setMessages updater'ının
      // DIŞINDA çağrılıyor — updater'ın içine konursa React 18 StrictMode
      // dev modda updater'ı iki kere çalıştırıp isteği ikiye katlıyor
      // (Gemini kotası kısıtlıyken canlıda gözlemlenen bug tam buydu).
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

  function openProgram(id: string) {
    setSelectedId(id);
    setView("detail");
  }

  /** Başvuru taslağını backend'den çeker ve ApplicationView'e geçer */
  async function applyProgram(id: string) {
    setSelectedId(id);

    // Profil yoksa direkt yönlendir (detay ekranına dön)
    if (!currentProfile) {
      setView("application");
      return;
    }

    setApplyLoading(true);
    try {
      const raw = await fetchApplicationDraft(currentProfile, id);
      const draft = adaptApplicationDraft(raw);
      setApplicationDraft(draft);
      setDocs(draft.docs);
    } catch {
      // Taslak çekilemezse boş state ile devam et
      setApplicationDraft(null);
      setDocs([]);
    } finally {
      setApplyLoading(false);
      setView("application");
    }
  }

  function onCtaAction(action: "go-matches" | "apply-bigg") {
    if (action === "apply-bigg") {
      // BİGG mock ID'si; gerçek veride program_id backend'den gelir
      const biggId = apiPrograms.find((p) =>
        p.name.toLowerCase().includes("bigg"),
      )?.id ?? "bigg";
      applyProgram(biggId);
    } else {
      setView("matches");
    }
  }

  function toggleDoc(id: string) {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, done: !d.done } : d)));
    // ApplicationDraft'taki docs'u da senkronize et
    setApplicationDraft((prev) =>
      prev
        ? {
            ...prev,
            docs: prev.docs.map((d) => (d.id === id ? { ...d, done: !d.done } : d)),
          }
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
    // Fallback: boş taslak yoksa
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

  /**
   * Chat'teki program kartları için program çözümleme — yalnızca API'den
   * gelen gerçek programlara bakar. Bulunamazsa null döner (eskiden burada
   * sessizce sahte bir mock programa düşülüyordu — kaldırıldı).
   */
  function resolveProgram(id: string): Program | null {
    return apiPrograms.find((p) => p.id === id) ?? null;
  }

  const selectedProgram = resolveProgram(selectedId);
  const matchCount = apiPrograms.length;

  if (view === "onboarding") {
    return <OnboardingView onComplete={onOnboardingComplete} onSkip={onOnboardingSkip} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f4f3ef" }}>
      <button
        className="mobile-menu-button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Menüyü aç"
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 20,
          width: 38,
          height: 38,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          background: "#0d2a3c",
          boxShadow: "0 2px 10px rgba(20,34,44,.25)",
        }}
      >
        <Ms name="menu" size={20} color="#fff" />
      </button>
      <div
        className={`sidebar-backdrop${sidebarOpen ? " sidebar-open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar
        view={view}
        matchCount={matchCount}
        open={sidebarOpen}
        onNewChat={() => {
          onNewChat();
          setView("chat");
          setSidebarOpen(false);
        }}
        onNavChat={() => {
          setView("chat");
          setSidebarOpen(false);
        }}
        onNavMatches={() => {
          setView("matches");
          setSidebarOpen(false);
        }}
        onNavProfile={() => {
          setView("dashboard");
          setSidebarOpen(false);
        }}
      />
      <main style={{ flex: 1, minWidth: 0, position: "relative" }}>
        {view === "chat" && (
          <ChatView
            messages={messages}
            typing={typing}
            input={input}
            onInput={setInput}
            onSend={onSend}
            followups={followups}
            onFollowup={onFollowup}
            onSuggestion={onSuggestion}
            onNavMatches={() => setView("matches")}
            onOpenProgram={openProgram}
            onApplyProgram={applyProgram}
            onCtaAction={onCtaAction}
            resolveProgram={resolveProgram}
          />
        )}
        {view === "matches" && (
          <MatchesView
            programs={apiPrograms}
            filterCat={filterCat}
            onFilterChange={setFilterCat}
            onOpenProgram={openProgram}
          />
        )}
        {view === "detail" && (
          selectedProgram ? (
            <DetailView
              program={selectedProgram}
              onBack={() => setView("matches")}
              onCheckEligibility={() => setView("eligibility")}
            />
          ) : (
            <ProgramNotFound onBack={() => setView("matches")} />
          )
        )}
        {view === "eligibility" && (
          selectedProgram ? (
            <EligibilityView
              program={selectedProgram}
              onBack={() => setView("detail")}
              onPrimaryAction={() => applyProgram(selectedProgram.id)}
            />
          ) : (
            <ProgramNotFound onBack={() => setView("matches")} />
          )
        )}
        {view === "application" && (
          <ApplicationView
            docs={docs}
            applicationDraft={applicationDraft}
            applyLoading={applyLoading}
            onToggleDoc={toggleDoc}
            onBack={() => setView("detail")}
            onCopyPlan={onCopyPlan}
            onDownloadPlan={onDownloadPlan}
          />
        )}
        {view === "dashboard" && (
          <DashboardView profile={currentProfile} programs={apiPrograms} onOpenProgram={openProgram} />
        )}
      </main>
      <Toast show={toastShow} text={toastText} />
    </div>
  );
}

/** Seçili program artık bilinen eşleşmeler arasında yoksa gösterilir (mock veriye düşmek yerine). */
function ProgramNotFound({ onBack }: { onBack: () => void }) {
  return (
    <section style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <Ms name="search_off" size={40} color="#d0cdc4" />
        <div style={{ fontSize: 16, fontWeight: 700, color: "#27353e", marginTop: 14 }}>
          Program bulunamadı
        </div>
        <div style={{ fontSize: 13.5, color: "#8a96a0", marginTop: 8, lineHeight: 1.6 }}>
          Bu program artık bilinen eşleşmeler arasında değil. Sohbete dönüp tekrar sorabilirsin.
        </div>
        <button
          onClick={onBack}
          style={{
            marginTop: 18,
            padding: "10px 18px",
            borderRadius: 10,
            background: "linear-gradient(160deg,#f97316,#ea580c)",
            color: "#fff",
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          Eşleşmelere dön
        </button>
      </div>
    </section>
  );
}
