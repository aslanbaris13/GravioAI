"use client";
import { useParams } from "next/navigation";
import DetailView from "@/components/DetailView";
import ProgramLoading from "@/components/ProgramLoading";
import ProgramNotFound from "@/components/ProgramNotFound";
import { useAppState } from "@/lib/AppStateContext";
import { useProgram } from "@/lib/useProgram";

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { goToMatches, goToEligibility, goToReport, apiPrograms } = useAppState();
  const { program, state } = useProgram(id);

  if (state === "loading") return <ProgramLoading />;
  if (!program) return <ProgramNotFound onBack={goToMatches} />;

  return (
    <DetailView
      program={program}
      onBack={apiPrograms.length > 0 ? goToMatches : undefined}
      onCheckEligibility={() => goToEligibility(id)}
      onViewReportRequirements={() => goToReport(id)}
    />
  );
}
