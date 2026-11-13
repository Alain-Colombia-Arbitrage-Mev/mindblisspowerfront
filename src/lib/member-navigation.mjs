const PAGES = [
  ["/dashboard/support", "Soporte", "Mi cuenta"],
  ["/dashboard/payments", "Billetera", "Mi cuenta"],
  ["/dashboard/wallet-administrative", "Wallet administrativa", "Mi cuenta"],
  ["/dashboard/withdrawals", "Billetera", "Mi cuenta"],
  ["/dashboard/coupons", "Cupones", "Mi cuenta"],
  ["/dashboard/profile", "Mi perfil", "Mi cuenta"],
  ["/dashboard/tools", "Herramientas", "Mi cuenta"],
];
const PAGE_KEYS = [
  ["/dashboard/support", "pages.support", "pages.account"],
  ["/dashboard/payments", "nav.wallet", "pages.account"],
  ["/dashboard/wallet-administrative", "nav.administrativeWallet", "pages.account"],
  ["/dashboard/withdrawals", "nav.wallet", "pages.account"],
  ["/dashboard/coupons", "pages.coupons", "pages.account"],
  ["/dashboard/profile", "pages.profile", "pages.account"],
  ["/dashboard/tools", "pages.tools", "pages.account"],
];

export function memberPageFor(pathname = "") {
  if (pathname === "/dashboard" || matchesRoute(pathname, "/dashboard/home")) return { title: "Resumen", section: "Mi cuenta" };
  const match = PAGES.find(([prefix]) => matchesRoute(pathname, prefix));
  return { title: match?.[1] ?? "Mi cuenta", section: match?.[2] ?? "Mindbliss Power" };
}

export function memberPageKeysFor(pathname = "") {
  if (pathname === "/dashboard" || matchesRoute(pathname, "/dashboard/home")) return { title: "pages.summary", section: "pages.account" };
  const match = PAGE_KEYS.find(([prefix]) => matchesRoute(pathname, prefix));
  return { title: match?.[1] ?? "pages.account", section: match?.[2] ?? "pages.product" };
}

export function matchesRoute(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
