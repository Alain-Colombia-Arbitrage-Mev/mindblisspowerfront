import Link from "next/link";
import { ArrowRight, Network } from "lucide-react";
import { useI18n } from "@/i18n/LanguageProvider";

function sideLabel(side) {
  if (side === "L") return "Izquierda";
  if (side === "R") return "Derecha";
  return "Raíz";
}

export default function PositionSnapshotCard({ network }) {
  const { t } = useI18n();
  const positioned = Boolean(network?.positioned && network?.me);
  const me = network?.me || {};

  return (
    <section className="mb-position-card">
      <div className="mb-position-heading">
        <h2>{t("overview.networkTitle")}</h2>
        <Network size={24} aria-hidden="true" />
      </div>
      <p className="mb-position-status">{positioned ? t("overview.positionAt", { side: sideLabel(me.side), level: me.depth ?? "—" }) : t("overview.positionPending")}</p>
      <p className="mb-position-copy">{positioned ? t("overview.nodeVisible", { node: me.affiliateId ? `#${me.affiliateId}` : "—" }) : t("overview.positionCopy")}</p>
      <Link href="/dashboard/network">{t("overview.exploreTree")} <ArrowRight size={14} /></Link>
    </section>
  );
}
