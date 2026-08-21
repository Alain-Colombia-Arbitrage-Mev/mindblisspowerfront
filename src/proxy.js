import { NextResponse } from "next/server";

import { customerDomainDecision } from "@/lib/domain-routing";

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/dashboard/admin/:path*",
    "/dashboard/command-center/:path*",
    "/dashboard/ai/:path*",
    "/dashboard/ai-analysis/:path*",
  ],
};
