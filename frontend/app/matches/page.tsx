"use client";
import MatchesView from "@/components/MatchesView";
import { useAppState } from "@/lib/AppStateContext";

export default function MatchesPage() {
  const { apiPrograms, filterCat, setFilterCat, goToProgram } = useAppState();

  return (
    <MatchesView
      programs={apiPrograms}
      filterCat={filterCat}
      onFilterChange={setFilterCat}
      onOpenProgram={goToProgram}
    />
  );
}
