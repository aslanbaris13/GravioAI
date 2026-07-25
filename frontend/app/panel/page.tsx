"use client";
import DashboardView from "@/components/DashboardView";
import { useAppState } from "@/lib/AppStateContext";

export default function PanelPage() {
  const {
    currentProfile,
    apiPrograms,
    trackedApplications,
    goToProgram,
    goToChat,
    goToApplications,
    goToNewPresentation,
  } = useAppState();
  return (
    <DashboardView
      profile={currentProfile}
      programs={apiPrograms}
      applications={trackedApplications}
      onOpenProgram={goToProgram}
      onGoToChat={goToChat}
      onGoToApplications={goToApplications}
      onNewPresentation={goToNewPresentation}
    />
  );
}
