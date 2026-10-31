import { Suspense } from "react";

import OverviewDashboard from "@/components/panel/overview/OverviewDashboard";
import OverviewPlans, { OverviewPlansLoading } from "@/components/panel/overview/OverviewPlans";

export default function HomePage() {
  return <OverviewDashboard plans={<Suspense fallback={<OverviewPlansLoading />}><OverviewPlans /></Suspense>} />;
}
