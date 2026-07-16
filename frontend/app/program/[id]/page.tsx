"use client";
import { useParams } from "next/navigation";
import DetailView from "@/components/DetailView";
import ProgramNotFound from "@/components/ProgramNotFound";
import { useAppState } from "@/lib/AppStateContext";

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { resolveProgram, goToMatches, goToEligibility } = useAppState();
  const program = resolveProgram(id);

  if (!program) return <ProgramNotFound onBack={goToMatches} />;

  return (
    <DetailView
      program={program}
      onBack={goToMatches}
      onCheckEligibility={() => goToEligibility(id)}
    />
  );
}
