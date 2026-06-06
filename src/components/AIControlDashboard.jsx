import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, CheckCircle2, TrendingUp, Zap, Copy, MousePointer, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIControlDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [dashRes, recRes] = await Promise.all([
          base44.functions.invoke('aiControlEngine', { action: 'get_dashboard' }),
          base44.functions.invoke('aiControlEngine', { action: 'get_recommendations' })
        ]);

        if (dashRes.data.success) setDashboard(dashRes.data);
        if (recRes.data.success) setRecommendations(recRes.data);
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    const interval = setInterval(loadDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div style={{ color: '#3b82f6', fontSize: 14 }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat' }}>
          CONTROL TOTAL
        </p>
        <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
          Dashboard de IA
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
          Problemas detectados, cambios aplicados y resultados en tiempo real
        </p>
      </motion.div>

      {/* Summary Cards */}
      {dashboard?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
              EVENTOS ACTIVOS
            </p>
            <p style={{ color: '#3b82f6', fontSize: 28, fontWeight: 900, margin: 0 }}>
              {dashboard.summary.total_events}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
              PROBLEMAS DETECTADOS
            </p>
            <p style={{ color: '#ef4444', fontSize: 28, fontWeight: 900, margin: 0 }}>
              {dashboard.summary.problems_detected}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
              PROBLEMAS RESUELTOS
            </p>
            <p style={{ color: '#10b981', fontSize: 28, fontWeight: 900, margin: 0 }}>
              {dashboard.summary.problems_solved}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
              MEJORA PROMEDIO
            </p>
            <p style={{ color: '#fb923c', fontSize: 28, fontWeight: 900, margin: 0 }}>
              +{dashboard.summary.avg_improvement}%
            </p>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'rgba(59,130,246,0.15)' }}>
        {['overview', 'problems', 'changes', 'recommendations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-3 border-b-2 transition-all"
            style={{
              borderColor: activeTab === tab ? '#3b82f6' : 'transparent',
              color: activeTab === tab ? '#3b82f6' : 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: activeTab === tab ? 600 : 400,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}
          >
            {tab === 'overview' && 'Resumen'}
            {tab === 'problems' && 'Problemas'}
            {tab === 'changes' && 'Cambios'}
            {tab === 'recommendations' && 'Recomendaciones IA'}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* PROBLEMS */}
        {activeTab === 'problems' && dashboard?.events?.problems && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {dashboard.events.problems.length === 0 ? (
              <div className="text-center p-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
                No hay problemas detectados
              </div>
            ) : (
              dashboard.events.problems.map((prob, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg flex items-start gap-4"
                  style={{
                    background: `rgba(${prob.severity === 'critical' ? '239,68,68' : prob.severity === 'high' ? '251,146,60' : '59,130,246'}, 0.08)`,
                    border: `1px solid rgba(${prob.severity === 'critical' ? '239,68,68' : prob.severity === 'high' ? '251,146,60' : '59,130,246'}, 0.2)`
                  }}
                >
                  <AlertTriangle
                    size={18}
                    style={{
                      color: prob.severity === 'critical' ? '#ef4444' : prob.severity === 'high' ? '#fb923c' : '#3b82f6',
                      flexShrink: 0,
                      marginTop: 2
                    }}
                  />
                  <div className="flex-1">
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 4px 0' }}>
                      {prob.element.toUpperCase()}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>
                      {prob.description}
                    </p>
                    {prob.metric_before && (
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0 0' }}>
                        Métrica anterior: {prob.metric_before.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <span
                    style={{
                      background:
                        prob.severity === 'critical'
                          ? 'rgba(239,68,68,0.2)'
                          : prob.severity === 'high'
                          ? 'rgba(251,146,60,0.2)'
                          : 'rgba(59,130,246,0.2)',
                      color:
                        prob.severity === 'critical'
                          ? '#ef4444'
                          : prob.severity === 'high'
                          ? '#fb923c'
                          : '#3b82f6',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {prob.severity}
                  </span>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* CHANGES */}
        {activeTab === 'changes' && dashboard?.events?.changes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {dashboard.events.changes.length === 0 ? (
              <div className="text-center p-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
                No hay cambios registrados
              </div>
            ) : (
              dashboard.events.changes.map((change, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg flex items-start gap-4"
                  style={{
                    background:
                      change.improvement > 0
                        ? 'rgba(16,185,129,0.08)'
                        : 'rgba(239,68,68,0.08)',
                    border:
                      change.improvement > 0
                        ? '1px solid rgba(16,185,129,0.2)'
                        : '1px solid rgba(239,68,68,0.2)'
                  }}
                >
                  <TrendingUp
                    size={18}
                    style={{
                      color: change.improvement > 0 ? '#10b981' : '#ef4444',
                      flexShrink: 0,
                      marginTop: 2,
                      transform: change.improvement > 0 ? 'none' : 'rotate(180deg)'
                    }}
                  />
                  <div className="flex-1">
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 4px 0' }}>
                      {change.element.toUpperCase()} cambio aplicado
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>
                      {change.action}
                    </p>
                  </div>
                  <span
                    style={{
                      background:
                        change.improvement > 0
                          ? 'rgba(16,185,129,0.2)'
                          : 'rgba(239,68,68,0.2)',
                      color: change.improvement > 0 ? '#10b981' : '#ef4444',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {change.improvement > 0 ? '+' : ''}{change.improvement.toFixed(1)}%
                  </span>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* RECOMMENDATIONS */}
        {activeTab === 'recommendations' && recommendations?.recommendations && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {recommendations.recommendations.length === 0 ? (
              <div className="text-center p-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
                No hay recomendaciones
              </div>
            ) : (
              recommendations.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg"
                  style={{
                    background:
                      rec.priority === 'high'
                        ? 'rgba(251,146,60,0.08)'
                        : 'rgba(59,130,246,0.08)',
                    border:
                      rec.priority === 'high'
                        ? '1px solid rgba(251,146,60,0.2)'
                        : '1px solid rgba(59,130,246,0.2)'
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          rec.type === 'copy_adjustment'
                            ? 'rgba(168,85,247,0.2)'
                            : rec.type === 'cta_change'
                            ? 'rgba(59,130,246,0.2)'
                            : rec.type === 'flow_optimization'
                            ? 'rgba(16,185,129,0.2)'
                            : 'rgba(251,146,60,0.2)'
                      }}
                    >
                      {rec.type === 'copy_adjustment' && <Copy size={16} style={{ color: '#a855f7' }} />}
                      {rec.type === 'cta_change' && <MousePointer size={16} style={{ color: '#3b82f6' }} />}
                      {rec.type === 'flow_optimization' && <RefreshCw size={16} style={{ color: '#10b981' }} />}
                      {rec.type === 'variant_test' && <Zap size={16} style={{ color: '#fb923c' }} />}
                    </div>
                    <div className="flex-1">
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 4px 0' }}>
                        {rec.type === 'copy_adjustment'
                          ? 'Ajustar copy'
                          : rec.type === 'cta_change'
                          ? 'Cambiar CTA'
                          : rec.type === 'flow_optimization'
                          ? 'Optimizar flujo'
                          : 'Probar variante'}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>
                        {rec.recommendation}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0 0' }}>
                        {rec.reasoning}
                      </p>
                    </div>
                    <span
                      style={{
                        background:
                          rec.confidence > 80
                            ? 'rgba(16,185,129,0.2)'
                            : 'rgba(251,146,60,0.2)',
                        color: rec.confidence > 80 ? '#10b981' : '#fb923c',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {rec.confidence}%
                    </span>
                  </div>
                  <button
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      color: '#3b82f6',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = 'rgba(59,130,246,0.15)';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    Implementar →
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}