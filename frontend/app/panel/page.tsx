"use client";
import DashboardView from "@/components/DashboardView";
import { useAppState } from "@/lib/AppStateContext";

export default function PanelPage() {
  const { currentProfile, apiPrograms, goToProgram, goToChat, goToNewPresentation } = useAppState();
  return (
    <DashboardView
      profile={currentProfile}
      programs={apiPrograms}
      onOpenProgram={goToProgram}
      onGoToChat={goToChat}
      onNewPresentation={goToNewPresentation}
    />
  );
}
