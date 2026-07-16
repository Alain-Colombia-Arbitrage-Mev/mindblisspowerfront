/**
 * Presets de rate limit por endpoint de auth + guardia que responde 429.
 * Per-endpoint rate-limit presets for auth + a guard that returns a 429.
 *
 * Nivel "balanceado" para tráfico intenso: holgado para usuarios reales,
 * restrictivo para scripts/abuso. Los envíos de correo/OTP se limitan por email
 * (evita spamear la bandeja de una persona y quemar cuota SES) y por IP.
 *
 * "Balanced" level for heavy traffic: generous for real users, tight for
 * scripts/abuse. Email/OTP sends are limited per email (avoids spamming one
 * person's inbox and burning SES quota) and per IP.
 */

import { NextResponse } from "next/server";

import { clientIp, rateLimit } from "@/lib/rate-limit";

const MIN = 60_000;

// Cada preset define reglas por IP y/o por email (por minuto salvo indicación).
// Each preset defines per-IP and/or per-email rules (per minute unless noted).
const PRESETS = {
  // Endpoints que ENVÍAN correo/OTP (los más caros: SES + Cognito).
  send: { ip: { limit: 20, windowMs: MIN }, email: { limit: 5, windowMs: MIN } },
  // Intentos de inicio de sesión (password / código).
  login: { ip: { limit: 10, windowMs: MIN }, email: { limit: 10, windowMs: MIN } },
  // Verificación de un código ya recibido (anti fuerza-bruta del OTP).
  verify: { ip: { limit: 10, windowMs: MIN }, email: { limit: 10, windowMs: MIN } },
  // Alta de cuenta.
  register: { ip: { limit: 15, windowMs: MIN } },
};

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
  const conf = PRESETS[preset];
  if (!conf) return null;

  const ip = clientIp(request);
  const rules = [];
  if (conf.ip) rules.push({ key: `${name}:ip:${ip}`, limit: conf.ip.limit, windowMs: conf.ip.windowMs });
  if (conf.email && email) {
    rules.push({ key: `${name}:email:${email}`, limit: conf.email.limit, windowMs: conf.email.windowMs });
  }

  const result = rateLimit(rules);
  if (result.allowed) return null;

  return NextResponse.json(
    { error: tooManyMessage(result.retryAfterSec), retryAfterSec: result.retryAfterSec },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } }
  );
}
