import { NextResponse } from "next/server";

import { customerDomainDecision } from "@/lib/domain-routing";
import { memberMutationError } from "@/lib/member-mutation-policy.mjs";

export function proxy(request) {
  const decision = customerDomainDecision({
    host: request.headers.get("x-forwarded-host") || request.headers.get("host"),
    pathname: request.nextUrl.pathname,
  });

  if (decision.type === "notFound") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (decision.type === "redirect") {
    return NextResponse.redirect(decision.location, 308);
  }

  const mutation = memberMutationError(request);
  if (mutation) return NextResponse.json({ error: mutation.error }, { status: mutation.status, headers: { 'Cache-Control': 'private, no-store' } });

  return NextResponse.next();
}

export const config = {
  // Raw encoded segments must also reach admission; no session/DB work here.
  matcher: ["/((?!_next/static|_next/image|fonts/|mindbliss/|favicon.ico).*)"],
};
