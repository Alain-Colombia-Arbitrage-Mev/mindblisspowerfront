import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Power, PauseCircle, PlayCircle, Zap } from 'lucide-react';
import AutoModeEngine from '@/lib/AutoModeEngine';
import AutoModePanel from '@/components/admin/AutoModePanel';
import ApprovalQueue from '@/components/admin/ApprovalQueue';
import EscalationQueue from '@/components/admin/EscalationQueue';

export default function AutoModeDashboard() {
  const [config, setConfig] = useState(AutoModeEngine.getConfig());
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingActions, setPendingActions] = useState([]);

  useEffect(() => {
    generateActions();
    const interval = setInterval(generateActions, 15000);
    return () => clearInterval(interval);
  }, []);

  const generateActions = () => {
    const actions = AutoModeEngine.analyzeAndGenerateActions();
    actions.forEach(action => {
      AutoModeEngine.processAction(action);
    });
    setPendingActions(actions);
  };

  const toggleAutoMode = () => {
    const newConfig = { ...config, enabled: !config.enabled };
    AutoModeEngine.saveConfig(newConfig);
    setConfig(newConfig);
  };

  const pauseAutoMode = () => {
    const newConfig = { ...config, paused: !config.paused };
    AutoModeEngine.saveConfig(newConfig);
    setConfig(newConfig);
  };

  const changeOperatingMode = (mode) => {
    const newConfig = { ...config, operating_mode: mode };
    AutoModeEngine.saveConfig(newConfig);
    setConfig(newConfig);
  };

  const changeSafetyMode = (mode) => {
    const newConfig = { ...config, safety_mode: mode };
    AutoModeEngine.saveConfig(newConfig);
    setConfig(newConfig);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <p style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 700, letterSpacing: 3, margin: '0 0 6px 0' }}>
            SISTEMA AUTÓNOMO
          </p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>
            Modo Automático
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
            Sistema de automatización inteligente con 3 niveles de riesgo y control total
          </p>
        </div>
      </motion.div>

      {/* Status & Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="rounded-xl p-6" style={{
          background: config.enabled ? 'rgba(139,92,246,0.1)' : 'rgba(107,114,128,0.1)',
          border: config.enabled ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(107,114,128,0.3)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ color: config.enabled ? '#8b5cf6' : '#6b7280', fontSize: 10, fontWeight: 700, margin: 0 }}>
                ESTADO DEL SISTEMA
              </p>
              <p style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: '6px 0 0 0' }}>
                {config.enabled ? (config.paused ? 'PAUSADO' : 'ACTIVO') : 'DESACTIVADO'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
              background: config.enabled ? 'rgba(139,92,246,0.2)' : 'rgba(107,114,128,0.2)',
            }}>
              <Zap size={24} style={{ color: config.enabled ? '#8b5cf6' : '#6b7280' }} />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleAutoMode}
              className="flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                background: config.enabled ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.2)',
                color: config.enabled ? '#ef4444' : '#8b5cf6',
              }}>
              {config.enabled ? '⊘ Desactivar' : '✓ Activar'}
            </button>
            {config.enabled && (
              <button
                onClick={pauseAutoMode}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: config.paused ? 'rgba(16,185,129,0.2)' : 'rgba(251,146,60,0.2)',
                  color: config.paused ? '#10b981' : '#fb923c',
                }}>
                {config.paused ? '▶ Reanudar' : '⏸ Pausar'}
              </button>
            )}
          </div>
        </div>

        {/* Operating Modes */}
        <div className="rounded-xl p-6" style={{
          background: 'rgba(3,102,214,0.08)',
          border: '1px solid rgba(59,130,246,0.25)',
        }}>
          <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, margin: '0 0 12px 0' }}>
            MODO DE OPERACIÓN
          </p>
          <div className="space-y-2 mb-4">
            {['conservative', 'balanced', 'aggressive'].map(mode => (
              <button
                key={mode}
                onClick={() => changeOperatingMode(mode)}
                className="w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left"
                style={{
                  background: config.operating_mode === mode ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                  color: config.operating_mode === mode ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${config.operating_mode === mode ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                {mode === 'conservative' ? '🛡️ Conservador' : mode === 'balanced' ? '⚖️ Balanceado' : '🚀 Agresivo'}
              </button>
            ))}
          </div>

          <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, margin: '0 0 12px 0' }}>
            SEGURIDAD
          </p>
          <div className="space-y-2">
            {['strict', 'flexible'].map(mode => (
              <button
                key={mode}
                onClick={() => changeSafetyMode(mode)}
                className="w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left"
                style={{
                  background: config.safety_mode === mode ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                  color: config.safety_mode === mode ? '#10b981' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${config.safety_mode === mode ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                {mode === 'strict' ? '🔒 Estricto' : '🔓 Flexible'}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 border-b border-white/8">
        {[
          { id: 'overview', label: '📊 Resumen' },
          { id: 'approval', label: '⏳ En Aprobación' },
          { id: 'escalation', label: '⚠️ Escalaciones' },
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
        {activeTab === 'overview' && <AutoModePanel />}
        {activeTab === 'approval' && <ApprovalQueue onApprove={() => setActiveTab('overview')} />}
        {activeTab === 'escalation' && <EscalationQueue />}
      </motion.div>
    </div>
  );
}