import { rawIdToken } from "@/lib/admin-bff";
import { NextResponse } from "next/server";

import { memberOnboardingSchema, toPaymentsOnboarding } from "@/lib/member-onboarding-schema";
import { rateLimit } from "@/lib/rate-limit";
import { hasSameOrigin } from "@/lib/request-origin";
import { verifyIdToken } from "@/lib/verify-id-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function context() {
  const idToken = await rawIdToken();
  if (!idToken) return { error: "unauthenticated", status: 401 };
  const claims = await verifyIdToken(idToken);
  const email = String(claims?.email || "").trim().toLowerCase();
  if (!email) return { error: "session-invalid", status: 401 };
  const base = process.env.VP_PAYMENTS_URL;
  const token = process.env.PAYMENTS_SERVICE_TOKEN;
  if (!base || !token) return { error: "payments-unconfigured", status: 503 };
  return { idToken, email, base, token };
}

export async function GET() {
  const c = await context();
  if (c.error) return noStoreJson({ error: c.error }, c.status);
  try {
    const response = await fetch(`${c.base}/api/member/onboarding?email=${encodeURIComponent(c.email)}`, {
      headers: { "X-VP-Service-Token": c.token, "X-VP-Id-Token": c.idToken },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return noStoreJson(data, response.status);
  } catch {
    return noStoreJson({ error: "payments-unreachable" }, 502);
  }
}

export async function POST(request) {
  if (!hasSameOrigin(request)) return noStoreJson({ error: "invalid_origin" }, 403);
  const mediaType = String(request.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    return noStoreJson({ error: "json_required" }, 415);
  }

  const c = await context();
  if (c.error) return noStoreJson({ error: c.error }, c.status);
  const limit = rateLimit([{ key: `member-onboarding:${c.email}`, limit: 10, windowMs: 60_000 }]);
  if (!limit.allowed) {
    const response = noStoreJson({ error: "rate_limited" }, 429);
    response.headers.set("Retry-After", String(limit.retryAfterSec));
    return response;
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 16 * 1024) return noStoreJson({ error: "payload_too_large" }, 413);
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return noStoreJson({ error: "invalid_json" }, 400);
  }
  const parsed = memberOnboardingSchema.safeParse(input);
  if (!parsed.success) return noStoreJson({ error: "invalid_onboarding" }, 400);

  try {
    const response = await fetch(`${c.base}/api/member/onboarding`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-VP-Service-Token": c.token,
        "X-VP-Id-Token": c.idToken,
      },
      body: JSON.stringify(toPaymentsOnboarding(parsed.data, c.email)),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return noStoreJson(data, response.status);
  } catch {
    return noStoreJson({ error: "payments-unreachable" }, 502);
  }
}

function noStoreJson(body, status) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}
