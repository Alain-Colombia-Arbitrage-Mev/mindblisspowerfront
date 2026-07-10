"use client";

import { Ticket } from "lucide-react";
import EmptyStateCard from "@/components/panel/EmptyStateCard";

export default function CouponsPage() {
  return (
    <div className="h-full p-6">
      <EmptyStateCard
        icon={Ticket}
        title="Sin cupones disponibles"
        description="Cuando tengas cupones activos aparecerán en esta sección."
      />
    </div>
  );
}
