"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Cooldown reutilizable para botones de "reenviar código". Evita el spam de
// reenvíos (que dispara el límite de Cognito y, peor, invalida el código
// anterior en cada envío). Uso: const { active, label, start } = useResendCooldown();
// llamar start() cuando se envía/reenvía un código; deshabilitar el botón con
// `active` y mostrar `label`.
export function useResendCooldown(seconds = 45, recipient = '') {
  // Memory-only scope: correcting an address must not block another recipient,
  // or erase the first address's deadline when returning to it. This is a UI
  // hint; the server remains authoritative after navigation, refresh or a tab.
  const scope = typeof recipient === 'string' ? recipient : '';
  const [deadlines, setDeadlines] = useState(() => new Map());
  const [now, setNow] = useState(0);
  const timerRef = useRef(null);
  const deadline = deadlines.get(scope) || 0;
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  const active = remaining > 0;

  const start = useCallback((retryAfter = seconds) => {
    const duration = Number(retryAfter);
    const fallback = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 45;
    const wait = Number.isFinite(duration) && duration > 0 ? Math.ceil(duration) : fallback;
    const startedAt = Date.now();
    setDeadlines(current => new Map(current).set(scope, Math.max(current.get(scope) || 0, startedAt + wait * 1000)));
    setNow(startedAt);
  }, [seconds, scope]);

  useEffect(() => {
    const reconcile = () => setNow(Date.now());
    // A suspended tab may miss hundreds of timer callbacks. The deadline,
    // not the number of callbacks, determines when manual resend is available.
    reconcile();
    if (!active) return undefined;
    timerRef.current = setInterval(reconcile, 1000);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', reconcile);
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', reconcile);
      window.addEventListener('pageshow', reconcile);
    }
    return () => {
      clearInterval(timerRef.current);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', reconcile);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', reconcile);
        window.removeEventListener('pageshow', reconcile);
      }
    };
  }, [deadline, scope, active]);

  const label = remaining > 0
    ? `Reenviar en ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
    : "";

  return { remaining, active, label, start };
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
  "gmail.com.com": "gmail.com",
  "gemail.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.con": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hayoo.com": "yahoo.com",
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
