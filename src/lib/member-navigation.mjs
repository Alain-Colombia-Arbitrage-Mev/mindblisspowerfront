const PAGES = [
  ["/dashboard/communications/news", "Noticias", "Comunidad"],
  ["/dashboard/communications/testimonials", "Testimonios", "Comunidad"],
  ["/dashboard/communications", "Mensajes", "Comunidad"],
  ["/dashboard/support", "Soporte", "Mi cuenta"],
  ["/dashboard/packages", "Membresías", "Mi cuenta"],
  ["/dashboard/payments", "Billetera", "Mi cuenta"],
  ["/dashboard/wallet-personal/requests", "Solicitudes de recarga", "Mi cuenta"],
  ["/dashboard/wallet-personal/pay", "Transferir", "Mi cuenta"],
  ["/dashboard/wallet-personal", "Wallet personal", "Mi cuenta"],
  ["/dashboard/withdrawals", "Billetera", "Mi cuenta"],
  ["/dashboard/coupons", "Cupones", "Mi cuenta"],
  ["/dashboard/profile", "Mi perfil", "Mi cuenta"],
  ["/dashboard/ranks", "Rangos", "Mi red"],
  ["/dashboard/rank", "Rangos", "Mi red"],
  ["/dashboard/team", "Mi equipo", "Mi red"],
  ["/dashboard/network", "Red binaria", "Mi red"],
  ["/dashboard/tools", "Herramientas", "Mi cuenta"],
];

const PAGE_KEYS = [
  ["/dashboard/communications/news", "pages.news", "pages.community"],
  ["/dashboard/communications/testimonials", "pages.testimonials", "pages.community"],
  ["/dashboard/communications", "pages.messages", "pages.community"],
  ["/dashboard/support", "pages.support", "pages.account"],
  ["/dashboard/packages", "pages.memberships", "pages.account"],
  ["/dashboard/payments", "nav.wallet", "pages.account"],
  ["/dashboard/wallet-personal/requests", "funding.history", "pages.account"],
  ["/dashboard/wallet-personal/pay", "companyPayment.transferAction", "pages.account"],
  ["/dashboard/wallet-personal", "nav.personalWallet", "pages.account"],
  ["/dashboard/withdrawals", "nav.wallet", "pages.account"],
  ["/dashboard/coupons", "pages.coupons", "pages.account"],
  ["/dashboard/profile", "pages.profile", "pages.account"],
  ["/dashboard/ranks", "pages.ranks", "pages.network"],
  ["/dashboard/rank", "pages.ranks", "pages.network"],
  ["/dashboard/team", "pages.team", "pages.network"],
  ["/dashboard/network", "pages.binaryNetwork", "pages.network"],
  ["/dashboard/tools", "pages.tools", "pages.account"],
];

export function memberPageFor(pathname = "") {
  if (pathname === "/dashboard" || matchesRoute(pathname, "/dashboard/home")) {
    return { title: "Resumen", section: "Mi cuenta" };
  }
  const match = PAGES.find(([prefix]) => matchesRoute(pathname, prefix));
  return {
    title: match?.[1] ?? "Mi cuenta",
    section: match?.[2] ?? "Mindbliss Power",
  };
}

export function memberPageKeysFor(pathname = "") {
  if (pathname === "/dashboard" || matchesRoute(pathname, "/dashboard/home")) {
    return { title: "pages.summary", section: "pages.account" };
  }
  const match = PAGE_KEYS.find(([prefix]) => matchesRoute(pathname, prefix));
  return {
    title: match?.[1] ?? "pages.account",
    section: match?.[2] ?? "pages.product",
  };
}

export function matchesRoute(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
