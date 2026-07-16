"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ONBOARDING_DONE_KEY = "gravioai_onboarding_complete";

/** Kök rota: onboarding tamamlanmışsa /chat'e, değilse /onboarding'e yönlendirir. */
export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const done = window.localStorage.getItem(ONBOARDING_DONE_KEY);
    router.replace(done ? "/chat" : "/onboarding");
  }, [router]);

  return null;
}
