import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import AIBrainEngine from '@/lib/AIBrainEngine';
import AIBrainAlerts from '@/components/admin/AIBrainAlerts';
import AIBrainInsights from '@/components/admin/AIBrainInsights';
import AIBrainActions from '@/components/admin/AIBrainActions';

export default function AIBrainDashboard() {
  const [activeTab, setActiveTab] = useState('alerts');
  const [alerts, setAlerts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString('en-GB'));

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      const newAlerts = AIBrainEngine.analyzeUsers();
      const newInsights = AIBrainEngine.generateInsights();
      setAlerts(newAlerts);
      setInsights(newInsights);
      setLastRefresh(new Date().toLocaleTimeString('en-GB'));
      setLoading(false);
    }, 500);
  };

  const handleActionExecute = (result) => {
    setAlerts(prev => prev.filter(a => a.id !== result.log.alert_id));
  };

  const criticalCount = alerts.filter(a => a.priority === 'critical').length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <p style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 700, letterSpacing: 3, margin: '0 0 6px 0' }}>
            INTELIGENCIA ARTIFICIAL
          </p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>
            Cerebro de IA
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
            Sistema inteligente de análisis, alertas y recomendaciones en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white transition-all"
            style={{
              background: loading ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)',
              opacity: loading ? 0.6 : 1,
            }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analizando...' : 'Actualizar'}
          </button>
          <div className="text-right">
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '0 0 2px 0' }}>
              ÚLTIMO ANÁLISIS
            </p>
            <p style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700, margin: 0 }}>
              {lastRefresh}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Status Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Alertas Críticas',
            value: criticalCount,
            color: '#ef4444',
            icon: AlertTriangle,
          },
          {
            label: 'Alertas Activas',
            value: alerts.length,
            color: '#f59e0b',
            icon: AlertTriangle,
          },
          {
            label: 'Redes Analizadas',
            value: insights?.platform_stats.total_leaders || 0,
            color: '#8b5cf6',
            icon: TrendingUp,
          },
          {
            label: 'Inteligencia',
            value: 'Activa',
            color: '#3b82f6',
            icon: Brain,
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl"
              style={{ background: `${stat.color}0d`, border: `1px solid ${stat.color}22` }}>
              <div className="flex items-center justify-between mb-2">
                <Icon size={14} style={{ color: stat.color }} />
                {stat.color === '#ef4444' && criticalCount > 0 && (
                  <div className="w-2 h-2 rounded-full" style={{ background: stat.color, boxShadow: `0 0 8px ${stat.color}` }} />
                )}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 4px 0' }}>
                {stat.label}
              </p>
              <p style={{ color: stat.color, fontSize: 24, fontWeight: 900, margin: 0 }}>
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 border-b border-white/8">
        {[
          { id: 'alerts', label: '⚠️ Alertas en Vivo', icon: AlertTriangle },
          { id: 'insights', label: '📊 Insights de Inteligencia', icon: TrendingUp },
          { id: 'actions', label: '✓ Acciones Ejecutadas', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-3 text-sm font-semibold border-b-2 transition-all"
            style={{
              borderColor: activeTab === tab.id ? '#8b5cf6' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)',
            }}>
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}>
        {activeTab === 'alerts' && (
          <AIBrainAlerts alerts={alerts} onActionExecute={handleActionExecute} />
        )}
        {activeTab === 'insights' && (
          <AIBrainInsights insights={insights} />
        )}
        {activeTab === 'actions' && (
          <AIBrainActions />
        )}
      </motion.div>
    </div>
  );
}