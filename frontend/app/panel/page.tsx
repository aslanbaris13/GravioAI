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
    goToOnboarding,
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
      onGoToOnboarding={goToOnboarding}
      onGoToApplications={goToApplications}
      onNewPresentation={goToNewPresentation}
    />
  );
}
