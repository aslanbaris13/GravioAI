"use client";
import { useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";
import ChatView from "@/components/ChatView";
import MatchesView from "@/components/MatchesView";
import DetailView from "@/components/DetailView";
import EligibilityView from "@/components/EligibilityView";
import ApplicationView from "@/components/ApplicationView";
import DashboardView from "@/components/DashboardView";
import { getProgram } from "@/lib/programs";
import type { ChatMessage, ChatMessageDraft, DocItem, FollowUp, ProgramCategory, ViewName } from "@/lib/types";

const INITIAL_DOCS: DocItem[] = [
  { id: "d1", label: "Nüfus kayıt örneği", done: true },
  { id: "d2", label: "Öğrenci/mezuniyet belgesi", done: true },
  { id: "d3", label: "İş planı / Gravio taslağı", done: true, auto: true },
  { id: "d4", label: "Proje sunumu (10 slayt)", done: false, auto: true },
  { id: "d5", label: "Tahmini bütçe tablosu", done: true, auto: true },
  { id: "d6", label: "KVKK açık rıza metni", done: false },
];

const TYPING_MS = 1150;
const TOAST_MS = 2200;

export default function Home() {
  const [view, setView] = useState<ViewName>("chat");
  const [selectedId, setSelectedId] = useState("bigg");
  const [filterCat, setFilterCat] = useState<"all" | ProgramCategory>("all");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [docs, setDocs] = useState<DocItem[]>(INITIAL_DOCS);
  const [toastShow, setToastShow] = useState(false);
  const [toastText, setToastText] = useState("");

  const idRef = useRef(1);
  const nextId = () => String(idRef.current++);

  function push(msg: ChatMessageDraft) {
    setMessages((prev) => [...prev, { ...msg, id: nextId() } as ChatMessage]);
  }

  function pushMany(msgs: ChatMessageDraft[]) {
    setMessages((prev) => [
      ...prev,
      ...msgs.map((m, i) => ({ ...m, id: nextId(), delay: i * 90 } as ChatMessage)),
    ]);
  }

  function startTyping(cb: () => void) {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      cb();
    }, TYPING_MS);
  }

  function userThen(text: string, cb: () => void) {
    push({ role: "user", text });
    setInput("");
    setFollowups([]);
    startTyping(cb);
  }

  function respondProfile() {
    push({
      role: "assistant",
      kind: "profile",
      chips: [
        { label: "Sektör", value: "AI / Yazılım" },
        { label: "İl", value: "Düzce" },
        { label: "Ekip", value: "3 kişi" },
        { label: "Kuruluş", value: "< 1 yıl" },
        { label: "Hedef", value: "Ar-Ge + İstihdam" },
        { label: "Altyapı", value: "Bulut / sunucusuz" },
      ],
    });
    pushMany([{ role: "assistant", kind: "cards", programIds: ["bigg", "aws", "google", "nvidia", "marka"] }]);
    setFollowups([
      { key: "bigg", label: "BİGG başvurusunu hazırla" },
      { key: "cloud", label: "Bulut kredisi seçeneklerini göster" },
    ]);
  }

  function respondCloud() {
    push({ role: "assistant", kind: "cards", programIds: ["aws", "google", "nvidia"] });
    setFollowups([{ key: "profile", label: "Tüm uygun destekleri göster" }]);
  }

  function respondBigg() {
    push({
      role: "assistant",
      kind: "cta",
      label: "TÜBİTAK 1512 BİGG başvurusunu hazırla",
      icon: "rocket_launch",
      action: "apply-bigg",
    });
  }

  function respondGeneric() {
    push({
      role: "assistant",
      kind: "text",
      text:
        "İşletmeni biraz daha anlatır mısın? Sektör, ekip büyüklüğü, kuruluş tarihi ve hedefin (örn. Ar-Ge, bulut altyapısı) hakkında bilgi verirsen sana en uygun destekleri çıkarabilirim.",
    });
    setFollowups([
      { key: "profile", label: "Düzce'de yeni bir AI yazılım girişimi kurdum, 3 kişiyiz" },
      { key: "cloud", label: "Bulut altyapısı için kredi arıyorum" },
    ]);
  }

  function onSuggestion(key: string) {
    const labelMap: Record<string, string> = {
      profile: "Düzce'de yeni bir AI yazılım girişimi kurdum, 3 kişiyiz",
      cloud: "Bulut altyapısı için kredi arıyorum",
      arge: "Ar-Ge hibesine uygun muyum?",
      all: "Yeni şirketim için tüm destekleri göster",
    };
    const fn = key === "cloud" ? respondCloud : respondProfile;
    userThen(labelMap[key] ?? key, fn);
  }

  function onFollowup(key: string) {
    const labelMap: Record<string, string> = {
      bigg: "BİGG başvurusunu hazırla",
      cloud: "Bulut kredisi seçeneklerini göster",
      profile: "Tüm uygun destekleri göster",
    };
    const fn = key === "bigg" ? respondBigg : key === "cloud" ? respondCloud : respondProfile;
    userThen(labelMap[key] ?? key, fn);
  }

  function onSend() {
    const text = input.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    const hasHistory = messages.length > 0;
    let fn = respondGeneric;
    if (lower.includes("bigg") || lower.includes("başvuru")) fn = respondBigg;
    else if (lower.includes("bulut") || lower.includes("kredi") || lower.includes("aws")) fn = respondCloud;
    else if (!hasHistory || lower.includes("uygun") || lower.includes("destek")) fn = respondProfile;
    userThen(text, fn);
  }

  function onNewChat() {
    setMessages([]);
    setTyping(false);
    setInput("");
    setFollowups([]);
  }

  function openProgram(id: string) {
    setSelectedId(id);
    setView("detail");
  }

  function applyProgram(id: string) {
    setSelectedId(id);
    setView("application");
  }

  function onCtaAction(action: "go-matches" | "apply-bigg") {
    if (action === "apply-bigg") applyProgram("bigg");
    else setView("matches");
  }

  function toggleDoc(id: string) {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, done: !d.done } : d)));
  }

  function flash(text: string) {
    setToastText(text);
    setToastShow(true);
    setTimeout(() => setToastShow(false), TOAST_MS);
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
    a.download = "TUBITAK-BIGG-Is-Plani-Taslagi.txt";
    a.click();
    URL.revokeObjectURL(url);
    flash("Taslak indiriliyor");
  }

  const selectedProgram = getProgram(selectedId);
  const matchCount = 7;

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
          />
        )}
        {view === "matches" && (
          <MatchesView filterCat={filterCat} onFilterChange={setFilterCat} onOpenProgram={openProgram} />
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

function buildPlanText(): string {
  return [
    "Nova — Otonom Bulut Maliyet Optimizasyon Ajanı",
    "",
    "PROJE ADI",
    "Nova — KOBİ'ler ve erken aşama yazılım girişimleri için otonom bulut maliyet optimizasyon ajanı.",
    "",
    "ÖZET",
    "Nova, işletmelerin AWS/GCP/Azure bulut faturalarını sürekli izleyen, anormal maliyet artışlarını tespit eden ve kullanılmayan kaynakları otomatik olarak kapatan bir yapay zekâ ajanıdır. Manuel maliyet denetimine kıyasla %20-35 oranında tasarruf hedefler.",
    "",
    "PROBLEM VE ÇÖZÜM",
    "Küçük ekipler bulut maliyetlerini takip edecek özel bir FinOps kadrosuna sahip değil; faturalar kontrolsüz büyüyor. Nova, kaynak kullanım verilerini sürekli analiz ederek gereksiz harcamaları otomatik tespit eder ve onaylı aksiyonları kendi başına uygular.",
    "",
    "PAZAR VE HEDEF KİTLE",
    "Birincil hedef kitle, Türkiye'de bulut altyapısı kullanan erken-orta ölçekli yazılım şirketleri ve KOBİ'lerdir. İlk faz hedefi: 50 pilot şirket, 6 ay içinde.",
    "",
    "EKİP",
    "3 kurucu ortak: yazılım mimarisi/bulut altyapısı, makine öğrenmesi/veri mühendisliği, iş geliştirme/müşteri ilişkileri. Tüm ekip Düzce merkezli ve tam zamanlı.",
    "",
    "TALEP EDİLEN DESTEK",
    "TÜBİTAK 1512 BİGG programından 600.000 TL hibe sermaye talep ediyoruz. Bütçe: ürün geliştirme (%55), bulut altyapı/test maliyetleri (%20), pazara giriş (%15), operasyonel giderler (%10).",
  ].join("\n");
}
