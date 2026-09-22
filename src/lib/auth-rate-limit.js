/**
 * Guardia de rate limit por endpoint que responde 429.
 * Per-endpoint rate-limit guard that returns a 429.
 *
 * Nivel "balanceado" para tráfico intenso: holgado para usuarios reales,
 * restrictivo para scripts/abuso. Los envíos de correo/OTP se limitan por email
 * (evita spamear la bandeja de una persona y quemar cuota SES) y por IP.
 *
 * Los presets y la construcción de reglas viven en `rate-limit-presets.mjs`
 * (módulo puro, testeable con `node --test`); aquí queda solo el envoltorio
 * HTTP, que depende de `next/server`.
 *
 * "Balanced" level for heavy traffic: generous for real users, tight for
 * scripts/abuse. Email/OTP sends are limited per email (avoids spamming one
 * person's inbox and burning SES quota) and per IP.
 */

import { NextResponse } from "next/server";

import { clientIp, rateLimit } from "@/lib/rate-limit";
import { presetRules, PRESETS } from "./rate-limit-presets.mjs";

// Re-exportado para quien necesite inspeccionar los límites sin duplicarlos.
export { PRESETS };

function tooManyMessage(retryAfterSec) {
  return (
    `Demasiados intentos. Espera ${retryAfterSec}s e inténtalo de nuevo. / ` +
    `Too many attempts. Wait ${retryAfterSec}s and try again.`
  );
}

/**
 * Aplica el preset. Devuelve un NextResponse 429 si está bloqueado, o null si
 * puede continuar. `email` es opcional (se ignora la regla por email si falta).
 *
 * Applies the preset. Returns a 429 NextResponse if blocked, or null to
 * continue. `email` is optional (the per-email rule is skipped if absent).
 *
 * @param {Request} request
 * @param {{name:string, preset:keyof PRESETS, email?:string}} opts
 * @returns {NextResponse|null}
 */
export function authRateLimit(request, { name, preset, email }) {
  const rules = presetRules({ name, preset, ip: clientIp(request), email });
  if (!rules) return null;

  const result = rateLimit(rules);
  if (result.allowed) return null;

  return NextResponse.json(
    { error: tooManyMessage(result.retryAfterSec), retryAfterSec: result.retryAfterSec },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } }
  );
}
