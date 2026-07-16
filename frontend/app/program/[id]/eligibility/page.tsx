"use client";
import { useParams } from "next/navigation";
import EligibilityView from "@/components/EligibilityView";
import ProgramNotFound from "@/components/ProgramNotFound";
import { useAppState } from "@/lib/AppStateContext";

export default function ProgramEligibilityPage() {
  const { id } = useParams<{ id: string }>();
  const { resolveProgram, goToMatches, goToProgram, applyProgram } = useAppState();
  const program = resolveProgram(id);

  if (!program) return <ProgramNotFound onBack={goToMatches} />;

  return (
    <EligibilityView
      program={program}
      onBack={() => goToProgram(id)}
      onPrimaryAction={() => applyProgram(id)}
    />
  );
}
