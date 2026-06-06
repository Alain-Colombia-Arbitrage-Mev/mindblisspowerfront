import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Clock, AlertCircle, Zap, Loader2 } from 'lucide-react';
import useButtonAction from '@/hooks/useButtonAction';
import WarRoomActionPanel from './WarRoomActionPanel';
import { getWarRoomFinancialSummary } from '@/lib/warRoomDataAdapter';

/**
 * ZONE 5: BOTTOM FINANCIAL STRIP
 * Confirmed income, pending payments, overdue, urgent cases, AI actions, manual queue
 */

const PaymentCard = ({ icon: Icon, label, value, subtext, state = 'neutral' }) => {
  const stateStyles = {
    neutral: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.7)' },
    warning: { bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)', text: '#fb923c' },
    critical: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#ef4444' },
    success: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', text: '#10b981' },
  };

  const style = stateStyles[state];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg flex items-start gap-2.5"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      <Icon size={14} style={{ color: style.text, flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1 min-w-0">
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </p>
        <p style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '2px 0 0 0' }}>
          {value}
        </p>
        {subtext && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '1px 0 0 0' }}>{subtext}</p>}
      </div>
    </motion.div>
  );
};

export default function WarRoomBottomBar({ sim }) {
  const [actionPanel, setActionPanel] = useState(null);
  const [insightsPanel, setInsightsPanel] = useState(false);

  // Get payment summary from unified data adapter (SINGLE SOURCE OF TRUTH)
  const paymentMetrics = useMemo(() => {
    const summary = getWarRoomFinancialSummary();
    return {
      confirmed: Math.floor(summary.ingresos_confirmados_amount / 1000),
      pendingCount: summary.pendientes_count,
      pendingAmount: summary.pendientes_amount,
      overdueCount: summary.vencidos_count,
      overdueAmount: summary.vencidos_amount,
      reviewCount: summary.revision_count,
      monthlyIncome: summary.monthly_income,
    };
  }, []);

  const aiActionsAction = useButtonAction(async () => {
    setActionPanel({ title: 'Acciones Sugeridas por IA', message: 'Analizando cartera...', state: 'executing' });
    await new Promise(r => setTimeout(r, 1800));
    return { success: true, suggestions: 4 };
  });

  const manualQueueAction = useButtonAction(async () => {
    setActionPanel({ title: 'Cola Manual', message: 'Cargando intervenciones pendientes...', state: 'executing' });
    await new Promise(r => setTimeout(r, 1200));
    return { success: true, items: 6 };
  });

  const INSIGHTS = [
    { type: 'risk', title: 'Riesgo Detectado: Desbalance de Línea', detail: 'Red BR-001 · 67% desbalance', action: 'Intervenir', color: '#ef4444' },
    { type: 'opportunity', title: 'Oportunidad: Activación Potencial', detail: '15 miembros inactivos · $3,750 potencial', action: 'Contactar', color: '#10b981' },
    { type: 'action', title: 'Acción Sugerida: Capacitación Urgente', detail: 'Líder CO-015 · Protocolo de comunicación', action: 'Agendar', color: '#fb923c' },
  ];

  const handleAction = (action) => {
    action.execute();
    setTimeout(() => {
      setActionPanel(prev => prev ? { ...prev, state: 'success' } : null);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ y: 60 }}
      animate={{ y: 0 }}
      className="flex-shrink-0 px-6 py-4 border-t"
      style={{
        background: 'rgba(4,10,22,0.95)',
        borderColor: 'rgba(59,130,246,0.15)',
      }}
    >
      <div className="flex items-center justify-between gap-6">
        {/* LEFT: FINANCIAL SUMMARY */}
        <div className="flex items-center gap-3">
          <PaymentCard icon={TrendingUp} label="Ingresos Confirmados" value={`$${paymentMetrics.confirmed}K`} state="success" />
          <PaymentCard icon={DollarSign} label="Pendientes" value={`$${Math.floor(paymentMetrics.pendingAmount / 1000)}`} subtext={`${paymentMetrics.pendingCount} pagos`} state="warning" />
          <PaymentCard icon={Clock} label="Vencidos" value={`$${Math.floor(paymentMetrics.overdueAmount / 1000)}`} subtext={`${paymentMetrics.overdueCount} casos`} state="critical" />
          <PaymentCard icon={AlertCircle} label="En Revisión" value={paymentMetrics.reviewCount} subtext="Usuarios" state="warning" />
        </div>

        {/* RIGHT: QUICK ACTIONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction(aiActionsAction)}
            disabled={aiActionsAction.isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: 'rgba(139,92,246,0.15)',
              color: '#8b5cf6',
              border: '1px solid rgba(139,92,246,0.3)',
              opacity: aiActionsAction.isLoading ? 0.7 : 1,
            }}
          >
            {aiActionsAction.isLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            Acciones IA
          </button>
          <button
            onClick={() => setInsightsPanel(!insightsPanel)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: 'rgba(139,92,246,0.15)',
              color: '#8b5cf6',
              border: '1px solid rgba(139,92,246,0.3)',
            }}
          >
            🧠 AI Insights
          </button>
          <button
            onClick={() => handleAction(manualQueueAction)}
            disabled={manualQueueAction.isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: 'rgba(59,130,246,0.15)',
              color: '#3b82f6',
              border: '1px solid rgba(59,130,246,0.3)',
              opacity: manualQueueAction.isLoading ? 0.7 : 1,
            }}
          >
            {manualQueueAction.isLoading ? <Loader2 size={12} className="animate-spin" /> : null}
            Cola Manual
          </button>
        </div>
      </div>

      {/* ACTION PANEL MODAL */}
      {actionPanel && (
        <WarRoomActionPanel
          isOpen={true}
          title={actionPanel.title}
          message={actionPanel.message}
          state={actionPanel.state}
          onClose={() => {
            setActionPanel(null);
            aiActionsAction.reset();
            manualQueueAction.reset();
          }}
        />
      )}

      {/* AI INSIGHTS PANEL */}
      {insightsPanel && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute left-6 bottom-20 w-96 rounded-xl overflow-hidden z-40"
          style={{ background: 'rgba(8,16,36,0.95)', border: '1px solid rgba(139,92,246,0.25)', backdropFilter: 'blur(10px)' }}
        >
          <div className="p-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
            <p style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 700, margin: 0 }}>AI INSIGHTS DINÁMICOS</p>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto p-3">
            {INSIGHTS.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-2 rounded-lg border-l-3 flex items-start justify-between"
                style={{ background: `${insight.color}0a`, borderColor: insight.color }}
              >
                <div className="flex-1">
                  <p style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: 0 }}>{insight.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, margin: '2px 0 0' }}>{insight.detail}</p>
                </div>
                <button
                  className="px-2 py-1 rounded text-xs font-bold flex-shrink-0 ml-2"
                  style={{ background: `${insight.color}20`, color: insight.color }}
                >
                  {insight.action}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}