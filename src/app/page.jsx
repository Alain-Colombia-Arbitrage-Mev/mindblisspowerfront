import { redirect } from "next/navigation";
import { referralLinkCode } from "@/lib/referral-links.mjs";
import { registrationUrl } from "./register/registration-model.mjs";

export const dynamic = "force-dynamic";

/** @param {{ searchParams?: Promise<Record<string, string | string[] | undefined>> }} [props] */
export default async function HomePage({ searchParams } = {}) {
  const params = (await searchParams) ?? {};
  const ref = referralLinkCode(params.ref);
  if (ref) {
    const side = typeof params.side === "string" ? params.side.trim().toUpperCase() : "";
    // Old root links enter a real registration flow. Only the public code and
    // branch survive; no mailbox, redirect target, identity or role is copied.
    redirect(registrationUrl("", ref, side));
  }
  redirect("/dashboard");
}
