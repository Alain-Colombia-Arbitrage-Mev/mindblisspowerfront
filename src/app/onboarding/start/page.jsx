import { redirect } from "next/navigation";

// Las páginas legacy (Planes, Participar, UserLogin) enlazan /onboarding/start.
// El wizard real vive en /onboarding — redirección permanente.
export default function OnboardingStartPage() {
  redirect("/onboarding?source=start");
}
