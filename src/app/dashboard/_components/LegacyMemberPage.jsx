"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Router } from "react-router-dom";

const legacyPages = {
  home: dynamic(() => import("@/legacy-pages/member/MemberHomeElite"), { ssr: false }),
  network: dynamic(() => import("@/legacy-pages/member/MemberNetwork"), { ssr: false }),
  referrals: dynamic(() => import("@/legacy-pages/member/MemberReferrals"), { ssr: false }),
  warRoom: dynamic(() => import("@/legacy-pages/member/MemberWarRoom"), { ssr: false }),
  teamPro: dynamic(() => import("@/legacy-pages/member/MemberTeam"), { ssr: false }),
  bonuses: dynamic(() => import("@/legacy-pages/member/MemberBonusesElite"), { ssr: false }),
  withdrawals: dynamic(() => import("@/legacy-pages/member/MemberWithdrawals"), { ssr: false }),
  communications: dynamic(() => import("@/legacy-pages/member/MemberCommunications"), { ssr: false }),
  aiAnalysis: dynamic(() => import("@/legacy-pages/member/MemberAI"), { ssr: false }),
  auto: dynamic(() => import("@/legacy-pages/member/MemberAuto"), { ssr: false }),
  ranks: dynamic(() => import("@/legacy-pages/member/MemberRank"), { ssr: false }),
  products: dynamic(() => import("@/legacy-pages/member/MemberProducts"), { ssr: false }),
  activity: dynamic(() => import("@/legacy-pages/member/MemberActivity"), { ssr: false }),
  profile: dynamic(() => import("@/legacy-pages/member/MemberProfile"), { ssr: false }),
  support: dynamic(() => import("@/legacy-pages/member/MemberSupport"), { ssr: false }),
  legal: dynamic(() => import("@/legacy-pages/member/MemberLegalCenter"), { ssr: false }),
};

export default function LegacyMemberPage({ page }) {
  const [ready, setReady] = useState(false);
  const Component = legacyPages[page] || legacyPages.home;

  useEffect(() => {
    if (!localStorage.getItem("user_auth")) localStorage.setItem("user_auth", "true");
    if (!localStorage.getItem("user_id")) localStorage.setItem("user_id", "master-root-001");
    if (!localStorage.getItem("user_role")) localStorage.setItem("user_role", "user");
    if (!localStorage.getItem("selected_user")) localStorage.setItem("selected_user", "master-root-001");
    if (!localStorage.getItem("selected_node")) localStorage.setItem("selected_node", "master-root-001");
    if (!localStorage.getItem("user_data")) {
      localStorage.setItem(
        "user_data",
        JSON.stringify({
          id: "master-root-001",
          name: "Embajador Corona",
          email: "corona@vicion.com",
          rank: "E. Corona",
          role: "user",
          plan: "Elite",
          investment: 25000,
        })
      );
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: "var(--vp-bg)", color: "var(--vp-muted)" }}>
        Cargando...
      </div>
    );
  }

  return (
    <NextReactRouterBridge>
      <Component />
    </NextReactRouterBridge>
  );
}

function NextReactRouterBridge({ children }) {
  const nextRouter = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const navigator = useMemo(
    () => ({
      createHref: toPath,
      push: (to) => nextRouter.push(toPath(to)),
      replace: (to) => nextRouter.replace(toPath(to)),
      go: (delta) => window.history.go(delta),
      back: () => nextRouter.back(),
      forward: () => window.history.forward(),
    }),
    [nextRouter]
  );

  const location = useMemo(
    () => ({
      pathname,
      search: search ? `?${search}` : "",
      hash: "",
      state: null,
      key: "next",
    }),
    [pathname, search]
  );

  return (
    <Router location={location} navigator={navigator} navigationType="POP">
      {children}
    </Router>
  );
}

function toPath(to) {
  if (typeof to === "string") return to;

  const pathname = to.pathname || "";
  const search = to.search || "";
  const hash = to.hash || "";
  return `${pathname}${search}${hash}`;
}
