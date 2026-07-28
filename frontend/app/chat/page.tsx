"use client";
import { useEffect, useRef } from "react";
import ChatView from "@/components/ChatView";
import { useAppState } from "@/lib/AppStateContext";

export default function ChatPage() {
  const {
    consumeWidgetDraft,
    messages,
    typing,
    input,
    setInput,
    onSend,
    followups,
    onFollowup,
    onSuggestion,
    goToMatches,
    goToProgram,
    applyProgram,
    onCtaAction,
    resolveProgram,
  } = useAppState();

  // Ana sayfadaki widget'tan gelinmişse, orada yazılan mesajı sohbete taşı.
  // Ref koruması StrictMode'un effect'i iki kez çalıştırmasına karşı.
  const draftConsumed = useRef(false);
  useEffect(() => {
    if (draftConsumed.current) return;
    draftConsumed.current = true;
    consumeWidgetDraft();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ChatView
      messages={messages}
      typing={typing}
      input={input}
      onInput={setInput}
      onSend={onSend}
      followups={followups}
      onFollowup={onFollowup}
      onSuggestion={onSuggestion}
      onNavMatches={goToMatches}
      onOpenProgram={goToProgram}
      onApplyProgram={applyProgram}
      onCtaAction={onCtaAction}
      resolveProgram={resolveProgram}
    />
  );
}
