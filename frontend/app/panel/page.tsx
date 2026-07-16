"use client";
import DashboardView from "@/components/DashboardView";
import { useAppState } from "@/lib/AppStateContext";

export default function PanelPage() {
  const { currentProfile, apiPrograms, goToProgram } = useAppState();
  return <DashboardView profile={currentProfile} programs={apiPrograms} onOpenProgram={goToProgram} />;
}
