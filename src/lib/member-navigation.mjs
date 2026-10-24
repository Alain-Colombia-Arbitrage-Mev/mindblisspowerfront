const PAGES = [
  ["/dashboard/communications/news", "Noticias", "Comunidad"],
  ["/dashboard/communications/testimonials", "Testimonios", "Comunidad"],
  ["/dashboard/communications", "Mensajes", "Comunidad"],
  ["/dashboard/support", "Soporte", "Mi cuenta"],
  ["/dashboard/packages", "Membresías", "Mi cuenta"],
  ["/dashboard/payments", "Pagos", "Finanzas"],
  ["/dashboard/withdrawals", "Billetera y retiros", "Finanzas"],
  ["/dashboard/coupons", "Cupones", "Mi cuenta"],
  ["/dashboard/kyc", "Verificación de identidad", "Mi cuenta"],
  ["/dashboard/profile", "Mi perfil", "Mi cuenta"],
  ["/dashboard/ranks", "Rangos", "Mi red"],
  ["/dashboard/rank", "Rangos", "Mi red"],
  ["/dashboard/team", "Mi equipo", "Mi red"],
  ["/dashboard/network", "Red binaria", "Mi red"],
  ["/dashboard/tools", "Herramientas", "Mi cuenta"],
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

export function matchesRoute(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
