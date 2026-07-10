"use client";

import { MessageSquareQuote } from "lucide-react";
import EmptyStateCard from "@/components/panel/EmptyStateCard";

export default function TestimonialsPage() {
  return (
    <div className="h-full p-6">
      <EmptyStateCard
        icon={MessageSquareQuote}
        title="Sin testimonios publicados"
        description="Los testimonios de la comunidad aparecerán en esta sección."
      />
    </div>
  );
}
