import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { matchesRoute, memberPageFor } from "./member-navigation.mjs";

const require = createRequire(import.meta.url);
const icon = () => React.createElement("svg", { "aria-hidden": true });
const Link = ({ children, ...props }) => React.createElement("a", props, children);

function moduleAt(relative, mocks = {}) {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === "lucide-react") return new Proxy({}, { get: () => icon });
    if (id === "./IntentLink") return { default: Link };
    if (id === "@/lib/member-navigation.mjs") return { matchesRoute };
    if (id === "@/lib/personal-wallet.mjs") return { PERSONAL_WALLET_ASSET: "USDT" };
    if (id === "@/lib/wallet-binding.mjs") return { readWalletBinding: async () => ({ linked: false, address: "" }) };
    if (["@/components/wallet/PersonalWalletBalance", "@/components/wallet/PersonalWalletBalances"].includes(id)) return { default: () => null };
    if (id === "@/lib/administrative-wallet.mjs") return { readAdministrativeWallet: async () => ({ status: "pending" }) };
    if (id === "@/i18n/LanguageProvider") return { useI18n: () => ({ t: key => ({
      "nav.account": "CUENTA", "nav.summary": "Resumen", "nav.memberships": "Membresías", "nav.wallet": "Billetera",
      "nav.communityGroup": "COMUNIDAD", "nav.community": "Comunidad", "nav.referrals": "Referidos por niveles", "nav.ranks": "Rangos",
      "nav.settings": "AJUSTES", "nav.profile": "Mi perfil", "nav.logout": "Cerrar sesión", "nav.myWallet": "Mi wallet",
      "nav.openWallet": "Abrir wallet", "nav.personalAccount": "Cuenta personal", "nav.helpCenter": "Centro de ayuda y soporte",
      "dashboard.memberNavigation": "Navegación del miembro", "session.close": "Cerrar sesión", "session.closing": "Cerrando sesión",
    }[key] || key) }) };
    if (id === './LogoutButton') return moduleAt('../components/panel/LogoutButton.jsx', {
      '@/lib/member-logout.mjs': { logoutMember: async () => {} },
      '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' ') },
      '@/i18n/LanguageProvider': { useI18n: () => ({ t: key => ({ 'session.close': 'Cerrar sesión', 'session.closing': 'Cerrando sesión', 'session.closeFailed': 'No pudimos confirmar el cierre de sesión. Intenta de nuevo.' }[key] || key) }) },
    });
    if (id.startsWith("./Sidebar")) return moduleAt(`../components/panel/${id.slice(2)}.jsx`);
    return require(id);
  }, module, module.exports);
  return module.exports;
}

test("actual member sidebar removes identity verification while preserving account, plans, network and support navigation", () => {
  const { default: Sidebar } = moduleAt("../components/panel/PanelSidebar.jsx");
  const html = renderToStaticMarkup(React.createElement(Sidebar, {
    pathname: "/dashboard/referrals",
    member: { name: "Test Member", email: "member@example.test" },
  }));
  assert.doesNotMatch(html, /\/dashboard\/kyc|Verificación de identidad|KYC|Identidad verificada/);
  assert.doesNotMatch(html, /wallet-administrative|administrativeWallet|Wallet administrativa|wallet\.mindblisspower\.com/);
  for (const href of ["/dashboard", "/dashboard/referrals", "/dashboard/support", "/dashboard/packages",
    "/dashboard/payments", "/dashboard/profile", "/dashboard/rank", "/dashboard/network"]) {
    assert.ok(html.includes(`href="${href}"`), `missing retained destination ${href}`);
  }
  assert.match(html, /<button[^>]*type="button"[^>]*aria-label="Cerrar sesión"/);
  assert.doesNotMatch(html, /href="\/api\/auth\/logout"/);
  assert.match(html, /aria-label="Navegación del miembro"/);
  assert.match(html, /href="\/dashboard\/referrals"[^>]*aria-current="page"/);
});

test("retired KYC route has no remaining navigation title or false verified state", () => {
  assert.deepEqual(memberPageFor("/dashboard/kyc"), { title: "Mi cuenta", section: "Mindbliss Power" });
  assert.deepEqual(memberPageFor("/dashboard/profile"), { title: "Mi perfil", section: "Mi cuenta" });
  assert.deepEqual(memberPageFor("/dashboard/packages"), { title: "Membresías", section: "Mi cuenta" });
  const source = readFileSync(new URL("./member-navigation.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\/dashboard\/kyc|Verificación de identidad/);
});

test("existing KYC bookmarks redirect on the server to profile without documents, polling or account mutation", () => {
  const destination = [];
  const redirectSignal = new Error("synthetic-next-redirect");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => assert.fail("retired KYC route performed network I/O");
  try {
    const { default: Page } = moduleAt("../app/dashboard/kyc/page.jsx", {
      "next/navigation": { redirect: path => { destination.push(path); throw redirectSignal; } },
    });
    assert.throws(() => Page(), error => error === redirectSignal);
    assert.deepEqual(destination, ["/dashboard/profile"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
  const source = readFileSync(new URL("../app/dashboard/kyc/page.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /["']use client["']|useEffect|setInterval|\bfetch\s*\(|KycDocument|kyc_status|verified|approved|POST|upload/);
});
