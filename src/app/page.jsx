import { redirect } from "next/navigation";
import { referralLinkCode } from "@/lib/referral-links.mjs";
import { registrationUrl } from "./register/registration-model.mjs";

export const dynamic = "force-dynamic";

/** @param {{ searchParams?: Promise<Record<string, string | string[] | undefined>> }} [props] */
export default async function HomePage({ searchParams } = {}) {
  const params = (await searchParams) ?? {};
  const ref = referralLinkCode(params.ref);
  if (ref) {
    // Old root links enter a real registration flow. Only the public sponsor
    // code survives; binary placement remains a backend decision.
    redirect(registrationUrl("", ref));
  }
  redirect("/dashboard");
}
