"use client";
import { useEffect, useState } from "react";
import { useAppState } from "@/lib/AppStateContext";
import type { Program } from "@/lib/types";

export type ProgramLoadState = "loading" | "found" | "not-found";

/** `/program/[id]` altındaki sayfalarda ortak program çözümleme.
 *
 * `resolveProgram` yalnızca bu oturumda daha önce görülmüş programlara
 * bakar; boşsa (paylaşılan link, sayfa yenileme, farklı bir akıştan geçiş)
 * "program bulunamadı" göstermeden önce backend'den tek programı çekmeyi
 * dener (`ensureProgram`). */
export function useProgram(id: string): { program: Program | null; state: ProgramLoadState } {
  const { resolveProgram, ensureProgram } = useAppState();
  const cached = resolveProgram(id);
  const [fetched, setFetched] = useState<Program | null>(null);
  const [state, setState] = useState<ProgramLoadState>(cached ? "found" : "loading");

  useEffect(() => {
    if (cached) {
      setState("found");
      return;
    }
    let cancelled = false;
    setState("loading");
    ensureProgram(id).then((program) => {
      if (cancelled) return;
      setFetched(program);
      setState(program ? "found" : "not-found");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, cached]);

  return { program: cached ?? fetched, state };
}
