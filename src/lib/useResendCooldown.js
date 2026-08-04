"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Cooldown reutilizable para botones de "reenviar código". Evita el spam de
// reenvíos (que dispara el límite de Cognito y, peor, invalida el código
// anterior en cada envío). Uso: const { active, label, start } = useResendCooldown();
// llamar start() cuando se envía/reenvía un código; deshabilitar el botón con
// `active` y mostrar `label`.
export function useResendCooldown(seconds = 45) {
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef(null);

  const start = useCallback(() => setRemaining(seconds), [seconds]);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    timerRef.current = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [remaining]);

  const label = remaining > 0
    ? `Reenviar en ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
    : "";

  return { remaining, active: remaining > 0, label, start };
}

// Detecta dominios de Microsoft, que suelen retrasar o filtrar a spam los
// correos de Cognito/SES — causa frecuente de "el código no llega".
export function isMicrosoftEmail(email) {
  return /@(hotmail|outlook|live|msn)\./i.test(String(email || ""));
}

// Typos frecuentes de dominio observados en rebotes reales del pool (usuarios
// UNCONFIRMED con gamil.com / gmil.com): el código jamás llega porque el correo
// rebota. Devuelve el email corregido si el dominio parece un typo, o "".
const DOMAIN_TYPO_FIXES = {
  "gamil.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gemail.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.con": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "icloud.con": "icloud.com",
  "icloud.co": "icloud.com",
  "iclod.com": "icloud.com",
};

export function suggestEmailFix(email) {
  const value = String(email || "").trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at < 1) return "";
  const fixed = DOMAIN_TYPO_FIXES[value.slice(at + 1)];
  return fixed ? `${value.slice(0, at + 1)}${fixed}` : "";
}
