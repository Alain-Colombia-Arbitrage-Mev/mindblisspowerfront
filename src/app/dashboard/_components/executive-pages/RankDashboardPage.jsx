"use client";

import { useEffect, useState } from "react";

import { readRankCatalog } from "@/lib/rank-catalog.mjs";
import { readMemberJson } from "@/lib/member-read.mjs";
import { rankPagePresentation, validRankPosition } from './rank-page-model.mjs';

import { Activity, BarChart3, CheckCircle2, DollarSign, Shield, TrendingUp, Trophy } from "lucide-react";

import { ExecutiveModulePage } from './executive-ui';
import { useI18n } from "@/i18n/LanguageProvider";

export function RankDashboardPage() {
  const { t } = useI18n();
  // Rango REAL del miembro (mlm.affiliate.current_rank_id) + carrera de rangos
  // real (mlm.rank). Antes mostraba "Corona" hardcodeado para todos.
  const [catalog, setCatalog] = useState({ loading: true, data: null, error: false });
  const [position, setPosition] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    // Public definitions and the private member proof are independent. A
    // catalog outage must not erase a confirmed rank or imply maximum rank.
    void readRankCatalog()
      .then(data => { if (!cancelled) setCatalog({ loading: false, data, error: false }); })
      .catch(() => { if (!cancelled) setCatalog({ loading: false, data: null, error: true }); });
    void readMemberJson('/api/member/tree?view=position', { signal: controller.signal, validate: validRankPosition })
      .then(data => { if (!cancelled) setPosition({ loading: false, data, error: null }); })
      .catch(error => {
        if (!cancelled) setPosition({ loading: false, data: null, error: { status: error?.status } });
      });
    return () => { cancelled = true; controller.abort(); };
  }, []);

  const presentation = rankPagePresentation(catalog, position);

  const config = {
    eyebrow: t("rankPage.eyebrow"),
    title: t("rankPage.title"),
    subtitle: t("rankPage.subtitle"),
    action: { label: t("rankPage.viewActivity"), href: "/dashboard/activity", icon: Activity },
    metrics: [
      { label: t("rankPage.currentRank"), ...presentation.current, icon: Trophy, tone: "accent" },
      { label: t("rankPage.nextRank"), ...presentation.next, icon: TrendingUp, tone: "success" },
      { label: t("rankPage.nextBonus"), ...presentation.bonus, icon: DollarSign, tone: "warning" },
      { label: t("rankPage.ranksInPath"), ...presentation.catalog, icon: Shield, tone: "muted" },
    ],
    cards: [
      { title: t("rankPage.immediateRequirement"), text: t("rankPage.immediateRequirementCopy"), icon: CheckCircle2, status: t("rankPage.inProgress") },
      { title: t("rankPage.points"), text: t("rankPage.pointsCopy"), icon: BarChart3, status: t("rankPage.audited") },
      { title: t("rankPage.nextLevel"), text: t("rankPage.nextLevelCopy"), icon: Trophy, status: t("rankPage.pending") },
    ],
    tableTitle: t("rankPage.path"),
    tableIcon: Trophy,
    columns: [t("rankPage.rank"), t("rankPage.status"), t("rankPage.requiredPoints"), t("rankPage.bonus")],
    rows: presentation.rows,
    tableMessage: t("rankPage.noRecords"),
    searchPlaceholder: t("rankPage.search"),
  };
  return <ExecutiveModulePage config={config} />;
}
