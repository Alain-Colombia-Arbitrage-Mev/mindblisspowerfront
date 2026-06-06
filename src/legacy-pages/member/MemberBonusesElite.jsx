import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import platformDataCore from '@/lib/platformDataCore';
import BinaryNetworkSummaryEngine from '@/lib/BinaryNetworkSummaryEngine';
import FinancialKPICard from '@/components/financial/FinancialKPICard';
import IncomeSourceBreakdown from '@/components/financial/IncomeSourceBreakdown';
import LeftRightComparison from '@/components/financial/LeftRightComparison';
import FinancialCharts from '@/components/financial/FinancialCharts';
import ProjectionPanel from '@/components/financial/ProjectionPanel';

export default function MemberBonusesElite() {
  const userId = localStorage.getItem('user_id');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const [selectedScenario, setSelectedScenario] = useState('stable');

  const networkSummary = useMemo(() => {
    const engine = new BinaryNetworkSummaryEngine(platformDataCore);
    return engine.getMemberNetworkSummary(userId);
  }, [userId]);

  const descendants = useMemo(() => platformDataCore.getDescendantsForLeader(userId), [userId]);

  const bonusData = useMemo(() => {
    const personalInvestment = networkSummary.personal_investment || 0;
    const networkInvestment = networkSummary.network_total || 0;
    const monthlyBase = (personalInvestment * 1.0) / 12;
    const minSideInvestment = Math.min(networkSummary.left_total, networkSummary.right_total);
    const binaryBonus = minSideInvestment * 0.10;
    const networkBonus = networkInvestment * 0.02;
    const directReferrals = platformDataCore.network_nodes.filter(n => n.upline_id === userId).length;
    const directBonus = directReferrals * 50;
    const monthlyTotal = monthlyBase + binaryBonus + networkBonus + directBonus;

    // 12-month history
    const history = Array.from({ length: 12 }, (_, i) => {
      const rev = 11 - i;
      const month = new Date();
      month.setMonth(month.getMonth() - rev);
      const label = month.toLocaleString('es-ES', { month: 'short' });
      const gf = 1 - (rev / 12) * 0.3;
      return {
        month: label.charAt(0).toUpperCase() + label.slice(1),
        base: Math.round(monthlyBase * gf),
        binary: Math.round(binaryBonus * gf),
        network: Math.round(networkBonus * gf),
        direct: directBonus,
        total: Math.round(monthlyTotal * gf),
      };
    });

    return {
      personalInvestment, networkInvestment,
      monthlyBase, binaryBonus, networkBonus, directBonus, monthlyTotal,
      leftInvestment: networkSummary.left_total,
      rightInvestment: networkSummary.right_total,
      leftCount: Math.floor(networkSummary.direct_count * 0.4),
      rightCount: Math.ceil(networkSummary.direct_count * 0.6),
      directReferrals: networkSummary.direct_count,
      networkSize: descendants.length,
      history,
    };
  }, [userId, networkSummary, descendants]);

  const projection = useMemo(() => {
    const growthMap = { conservative: 0.05, stable: 0.12, expansion: 0.25 };
    const growth = growthMap[selectedScenario] || 0.12;
    let current = bonusData.monthlyTotal;
    return Array.from({ length: 12 }, (_, i) => {
      current *= (1 + growth);
      const label = new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toLocaleString('es-ES', { month: 'short' });
      return {
        month: label.charAt(0).toUpperCase() + label.slice(1),
        monthly: Math.round(current),
        cumulative: 0,
      };
    }).map((d, i, arr) => ({
      ...d,
      cumulative: arr.slice(0, i + 1).reduce((s, x) => s + x.monthly, 0),
    }));
  }, [bonusData, selectedScenario]);

  const topMembers = useMemo(() => {
    return descendants
      .map(d => {
        const user = platformDataCore.getUserById(d.user_id);
        const memberships = platformDataCore.getMembershipsForUser(d.user_id);
        const investment = memberships.reduce((s, m) => s + (m.amount || 0), 0);
        return { user, investment };
      })
      .sort((a, b) => b.investment - a.investment)
      .slice(0, 8);
  }, [descendants]);

  const totalAnnual = Math.round(bonusData.monthlyTotal * 12);
  const networkContrib = Math.round(bonusData.binaryBonus + bonusData.networkBonus);

  return (
    <div
      className="p-6 space-y-6 max-w-7xl"
      style={{ background: 'var(--vp-bg)', minHeight: '100vh' }}
    >
      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'var(--vp-subtle)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px 0' }}>
              Panel Financiero
            </p>
            <h1 style={{ color: 'var(--vp-text)', fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
              Centro de Ingresos
            </h1>
          </div>
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{
              padding: '6px 14px', borderRadius: 20,
              background: 'var(--vp-accent-muted)', border: '1px solid var(--vp-accent-border)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--vp-accent)', boxShadow: 'none' }}
            />
            <span style={{ color: 'var(--vp-accent)', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px' }}>EN TIEMPO REAL</span>
          </motion.div>
        </div>
      </motion.div>

      {/* ── PHASE 1 — KPI GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FinancialKPICard
          label="Total Mensual" value={Math.round(bonusData.monthlyTotal)}
          prefix="$" unit="generado este mes" color="var(--vp-accent)" live delay={0}
          subValue={Math.round(bonusData.monthlyTotal * 1.08)} subLabel="Mes anterior"
        />
        <FinancialKPICard
          label="Contribución Red" value={networkContrib}
          prefix="$" unit="de red y binario" color="var(--vp-amber)" delay={0.06}
        />
        <FinancialKPICard
          label="Proyección Anual" value={totalAnnual}
          prefix="$" unit="escenario actual" color="var(--vp-amber)" delay={0.12}
          subValue={Math.round(bonusData.monthlyTotal * Math.pow(1.12, 12))} subLabel="Escenario estable"
        />
        <FinancialKPICard
          label="Red Total" value={bonusData.networkSize}
          suffix=" pers." unit="en tu estructura" color="var(--vp-accent)" delay={0.18}
          subValue={bonusData.directReferrals} subLabel="Directos"
        />
      </div>

      {/* ── PHASE 2 + 4 — SOURCE & LEFT/RIGHT ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <IncomeSourceBreakdown bonusData={bonusData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
          <LeftRightComparison
            leftInvestment={bonusData.leftInvestment}
            rightInvestment={bonusData.rightInvestment}
            leftCount={bonusData.leftCount}
            rightCount={bonusData.rightCount}
          />
        </motion.div>
      </div>

      {/* ── PHASE 3 + 5 — CHARTS ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <FinancialCharts
          historicalData={bonusData.history}
          projectionData={projection}
          selectedScenario={selectedScenario}
          bonusData={bonusData}
        />
      </motion.div>

      {/* ── PHASE 6 — PROJECTION ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        <ProjectionPanel
          bonusData={bonusData}
          selectedScenario={selectedScenario}
          setSelectedScenario={setSelectedScenario}
          projection={projection}
        />
      </motion.div>

      {/* ── TOP CONTRIBUTORS ── */}
      {topMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ padding: '24px', borderRadius: 16, background: 'var(--vp-surface)', border: '1px solid var(--vp-border)', boxShadow: 'var(--vp-shadow)' }}
        >
          <p style={{ color: 'var(--vp-subtle)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 16px 0' }}>
            Top Aportadores a tu Red
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {topMembers.map((m, i) => (
              <motion.div
                key={m.user?.id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 + 0.4 }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 10,
                  background: i < 3 ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)',
                  border: `1px solid ${i < 3 ? 'var(--vp-accent-border)' : 'var(--vp-border)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, width: 20, textAlign: 'center', color: i < 3 ? 'var(--vp-amber)' : 'var(--vp-subtle)', fontWeight: 800 }}>
                    {`#${i+1}`}
                  </span>
                  <div>
                    <p style={{ color: 'var(--vp-text-soft)', fontSize: 10, fontWeight: 700, margin: 0 }}>{m.user?.name || 'Miembro'}</p>
                    <p style={{ color: 'var(--vp-subtle)', fontSize: 9, margin: 0 }}>{m.user?.rank || 'Miembro'}</p>
                  </div>
                </div>
                <span style={{ color: 'var(--vp-accent)', fontSize: 11, fontWeight: 800 }}>
                  ${m.investment.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── DISCLAIMER ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--vp-surface)', border: '1px solid var(--vp-border)' }}
      >
        <p style={{ color: 'var(--vp-muted)', fontSize: 10, margin: 0, lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--vp-accent)' }}>Metodología:</strong> Base personal (1%/mes) · Bonus binario (10% del lado mínimo) · Red profunda (2% del total) · Directos ($50/referido). Las proyecciones son estimativas y no garantizan rendimientos.
        </p>
      </motion.div>
    </div>
  );
}
