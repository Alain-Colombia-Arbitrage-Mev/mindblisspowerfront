// Placeholders NEUTROS para cuando la sesión/summary aún no cargan o fallan.
// NUNCA poner datos ficticios aquí: los miembros migrados verían un rango,
// código de referido o balance que no es suyo.
export const member = {
  name: "",
  username: "",
  email: "",
  phone: "",
  country: "",
  rank: "Sin rango",
  plan: "—",
  joined: "—",
  sponsor: "—",
  referralCode: "",
  wallet: "Sin billetera configurada",
};

export const activityRows = [
  { event: "Sesion iniciada", area: "Seguridad", date: "Hoy", status: "Completado" },
  { event: "Perfil sincronizado", area: "Cuenta", date: "Hoy", status: "Pendiente" },
  { event: "Codigo de referido disponible", area: "Referidos", date: "Ayer", status: "Completado" },
  { event: "KYC en revision", area: "Cumplimiento", date: "Ayer", status: "Pendiente" },
];
