"use client";
import { useCallback, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";
import ChatView from "@/components/ChatView";
import MatchesView from "@/components/MatchesView";
import DetailView from "@/components/DetailView";
import EligibilityView from "@/components/EligibilityView";
import ApplicationView from "@/components/ApplicationView";
import DashboardView from "@/components/DashboardView";
import { getProgram } from "@/lib/programs";
import { assist, fetchApplicationDraft } from "@/lib/api";
import type { BackendUserProfile, ConversationTurn } from "@/lib/api";
import { adaptAssistResult, adaptApplicationDraft, profileToChips } from "@/lib/adapter";
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

export default function Home() {
  const [view, setView] = useState<ViewName>("chat");
  const [selectedId, setSelectedId] = useState("bigg");
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
      // History snapshot'ını gecikme öncesinde al
      setMessages((prev) => {
        const snapshotHistory = buildHistory(prev);
        const withUser = [
          ...prev,
          { id: nextId(), role: "user", text: label } as ChatMessage,
        ];
        setFollowups([]);
        setTyping(true);

        const withLoading = [
          ...withUser,
          { id: nextId(), role: "assistant", kind: "loading" } as ChatMessage,
        ];

        assist(label, snapshotHistory)
          .then((raw) => {
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

        return withLoading;
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
   * Chat'teki program kartları için program çözümleme.
   * Önce API'den gelen gerçek programlara bak; yoksa mock'a düş.
   */
  function resolveProgram(id: string) {
    return apiPrograms.find((p) => p.id === id) ?? getProgram(id);
  }

  const selectedProgram = resolveProgram(selectedId);
  const matchCount = apiPrograms.length > 0 ? apiPrograms.length : 7;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f4f3ef" }}>
      <Sidebar
        view={view}
        matchCount={matchCount}
        onNewChat={() => {
          onNewChat();
          setView("chat");
        }}
        onNavChat={() => setView("chat")}
        onNavMatches={() => setView("matches")}
        onNavProfile={() => setView("dashboard")}
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
          <DetailView
            program={selectedProgram}
            onBack={() => setView("matches")}
            onCheckEligibility={() => setView("eligibility")}
          />
        )}
        {view === "eligibility" && (
          <EligibilityView
            program={selectedProgram}
            onBack={() => setView("detail")}
            onPrimaryAction={() => applyProgram(selectedProgram.id)}
          />
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
        {view === "dashboard" && <DashboardView onOpenProgram={openProgram} />}
      </main>
      <Toast show={toastShow} text={toastText} />
    </div>
  );
}
