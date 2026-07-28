// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import LandingView from "@/components/LandingView";

// const ONBOARDING_DONE_KEY = "gravioai_onboarding_complete";

// /**
//  * Kök rota: daha önce onboarding'i tamamlamış (dönen) kullanıcı doğrudan
//  * /chat'e yönlendirilir. Yeni ziyaretçiye ise pazarlama/tanıtım ana sayfası
//  * (LandingView) gösterilir — "Başla" / "Giriş yap" ile akışa girer.
//  */
// export default function RootPage() {
//   const router = useRouter();
//   const [checked, setChecked] = useState(false);
//   const [returning, setReturning] = useState(false);

//   useEffect(() => {
//     const done = window.localStorage.getItem(ONBOARDING_DONE_KEY);
//     if (done) {
//       setReturning(true);
//       router.replace("/chat");
//     } else {
//       setChecked(true);
//     }
//   }, [router]);

//   if (returning || !checked) return null;

//   return <LandingView />;
// }
import LandingView from "@/components/LandingView";

/**
 * Kök rota: kullanıcı daha önce gelmiş olsa da olmasa da her zaman
 * pazarlama/tanıtım ana sayfası (LandingView) gösterilir.
 * "Başla" -> /onboarding, "Giriş yap" -> /panel.
 */
export default function RootPage() {
  return <LandingView />;
}