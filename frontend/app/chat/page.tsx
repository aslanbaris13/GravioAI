"use client";
import ChatView from "@/components/ChatView";
import { useAppState } from "@/lib/AppStateContext";

export default function ChatPage() {
  const {
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
