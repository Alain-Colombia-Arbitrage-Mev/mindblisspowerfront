import { useState, useMemo, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Zap, ToggleLeft, ToggleRight, Settings, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import platformDataCore from '@/lib/platformDataCore';
import { getAllDescendants } from '@/lib/warRoomDataAdapter';

export default function MemberAuto() {
  const userId = localStorage.getItem('user_id');
  const [autoModeEnabled, setAutoModeEnabled] = useState(false);
  const [actionLog, setActionLog] = useState([]);
  const [executedActionsCount, setExecutedActionsCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [rules, setRules] = useState({
    inactiveReactivation: { enabled: true, threshold: 3, executed: 0 },
    balanceOptimization: { enabled: true, threshold: 2, executed: 0 },
    welcomeNewMembers: { enabled: true, threshold: 1, executed: 0 },
    highValueFollowUp: { enabled: true, threshold: 1000, executed: 0 },
  });

  const networkAnalysis = useMemo(() => {
    const descendants = getAllDescendants(userId, platformDataCore.network_nodes, platformDataCore.users);
    
    const nodes = platformDataCore.network_nodes.filter(n => {
      const isInNetwork = descendants.some(d => d.id === n.member_id);
      return isInNetwork;
    });

    const leftNodes = nodes.filter(n => n.binary_side === 'left');
    const rightNodes = nodes.filter(n => n.binary_side === 'right');

    const leftMembers = leftNodes.map(n => platformDataCore.users.find(u => u.id === n.member_id)).filter(Boolean);
    const rightMembers = rightNodes.map(n => platformDataCore.users.find(u => u.id === n.member_id)).filter(Boolean);

    const inactiveMembers = descendants.filter(m => m.status === 'inactivo' || !m.last_activity);
    const highValueMembers = descendants.filter(m => (m.investment || 0) >= 5000);
    const balanceIssue = Math.abs(leftMembers.length - rightMembers.length);

    return {
      inactiveCount: inactiveMembers.length,
      inactiveMembers,
      highValueMembers,
      highValueCount: highValueMembers.length,
      balanceIssue,
      leftSize: leftMembers.length,
      rightSize: rightMembers.length,
      totalMembers: descendants.length,
    };
  }, [userId]);

  const executeAutomation = (ruleName, condition) => {
    if (!autoModeEnabled) return;

    const actions = [];
    const timestamp = new Date();

    if (ruleName === 'inactiveReactivation' && rules.inactiveReactivation.enabled) {
      if (networkAnalysis.inactiveCount >= rules.inactiveReactivation.threshold) {
        networkAnalysis.inactiveMembers.slice(0, rules.inactiveReactivation.threshold).forEach(member => {
          actions.push({
            id: `action-${Date.now()}-${Math.random()}`,
            rule: 'Reactivación de Miembros Inactivos',
            action: `Enviando campaña de reactivación a ${member.name}`,
            member: member.name,
            status: 'ejecutada',
            timestamp,
            impact: 'Aumentar tasa de actividad',
          });
        });
        setRules(prev => ({
          ...prev,
          inactiveReactivation: {
            ...prev.inactiveReactivation,
            executed: prev.inactiveReactivation.executed + 1,
          },
        }));
      }
    }

    if (ruleName === 'balanceOptimization' && rules.balanceOptimization.enabled) {
      if (networkAnalysis.balanceIssue >= rules.balanceOptimization.threshold) {
        const weakSide = networkAnalysis.leftSize < networkAnalysis.rightSize ? 'izquierda' : 'derecha';
        actions.push({
          id: `action-${Date.now()}-${Math.random()}`,
          rule: 'Optimización de Balance',
          action: `Priorizando contactos en rama ${weakSide}`,
          member: `Rama ${weakSide}`,
          status: 'ejecutada',
          timestamp,
          impact: 'Mejorar balance binario',
        });
        setRules(prev => ({
          ...prev,
          balanceOptimization: {
            ...prev.balanceOptimization,
            executed: prev.balanceOptimization.executed + 1,
          },
        }));
      }
    }

    if (ruleName === 'welcomeNewMembers' && rules.welcomeNewMembers.enabled) {
      if (networkAnalysis.totalMembers >= rules.welcomeNewMembers.threshold) {
        actions.push({
          id: `action-${Date.now()}-${Math.random()}`,
          rule: 'Bienvenida a Nuevos Miembros',
          action: `Enviando paquete de onboarding a nuevos miembros`,
          member: 'Nuevos miembros',
          status: 'ejecutada',
          timestamp,
          impact: 'Mejorar experiencia de onboarding',
        });
        setRules(prev => ({
          ...prev,
          welcomeNewMembers: {
            ...prev.welcomeNewMembers,
            executed: prev.welcomeNewMembers.executed + 1,
          },
        }));
      }
    }

    if (ruleName === 'highValueFollowUp' && rules.highValueFollowUp.enabled) {
      if (networkAnalysis.highValueCount > 0) {
        networkAnalysis.highValueMembers.slice(0, 2).forEach(member => {
          actions.push({
            id: `action-${Date.now()}-${Math.random()}`,
            rule: 'Seguimiento de Miembros de Alto Valor',
            action: `Enviando plan de retención a ${member.name}`,
            member: member.name,
            status: 'ejecutada',
            timestamp,
            impact: 'Retener ingresos clave',
          });
        });
        setRules(prev => ({
          ...prev,
          highValueFollowUp: {
            ...prev.highValueFollowUp,
            executed: prev.highValueFollowUp.executed + 1,
          },
        }));
      }
    }

    if (actions.length > 0) {
      setActionLog(prev => [...actions, ...prev].slice(0, 50));
      setExecutedActionsCount(prev => prev + actions.length);
      setFeedback(`✓ ${actions.length} acción(es) ejecutada(s)`);
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  useEffect(() => {
    if (!autoModeEnabled) return;

    const interval = setInterval(() => {
      const availableRules = Object.keys(rules).filter(rule => rules[rule].enabled);
      if (availableRules.length > 0) {
        const randomRule = availableRules[Math.floor(Math.random() * availableRules.length)];
        executeAutomation(randomRule);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [autoModeEnabled, rules]);

  const ruleDefinitions = {
    inactiveReactivation: {
      name: 'Reactivación de Miembros Inactivos',
      description: 'Envía campañas cuando detecta miembros inactivos',
      icon: AlertCircle,
    },
    balanceOptimization: {
      name: 'Optimización de Balance',
      description: 'Ajusta contactos cuando hay desequilibrio binario',
      icon: Zap,
    },
    welcomeNewMembers: {
      name: 'Bienvenida a Nuevos Miembros',
      description: 'Envía paquetes de onboarding automáticamente',
      icon: CheckCircle,
    },
    highValueFollowUp: {
      name: 'Seguimiento de Miembros VIP',
      description: 'Prioriza contacto con miembros de alto valor',
      icon: Zap,
    },
  };

  return (
    <div className="p-8 min-h-screen" style={{ background: '#05070D' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <p style={{ color: 'rgba(59,130,246,0.55)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', margin: '0 0 10px 0' }}>
              Sistema · Automatización
            </p>
            <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>
              Auto Mode
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
              Automatización inteligente para tu red
            </p>
          </div>

          {/* Precision toggle — no casual aesthetics */}
          <motion.button
            onClick={() => setAutoModeEnabled(!autoModeEnabled)}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 20px', borderRadius: 12, cursor: 'pointer',
              background: autoModeEnabled ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
              border: autoModeEnabled ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.1)',
              transition: 'all 200ms ease', flexShrink: 0,
            }}
          >
            {/* Precision LED */}
            <div style={{ position: 'relative', width: 36, height: 20, borderRadius: 10, background: autoModeEnabled ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)', border: `1px solid ${autoModeEnabled ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.12)'}`, transition: 'all 200ms ease' }}>
              <motion.div
                animate={{ x: autoModeEnabled ? 18 : 2 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%', background: autoModeEnabled ? '#3b82f6' : 'rgba(255,255,255,0.3)', boxShadow: autoModeEnabled ? '0 0 8px rgba(59,130,246,0.6)' : 'none', transition: 'background 200ms ease' }}
              />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, margin: 0, letterSpacing: '0.5px', color: autoModeEnabled ? '#93C5FD' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                {autoModeEnabled ? 'Activo' : 'Inactivo'}
              </p>
              <p style={{ fontSize: 9, margin: '2px 0 0 0', color: 'rgba(255,255,255,0.25)' }}>
                {autoModeEnabled ? `${executedActionsCount} acciones ejecutadas` : 'Sistema en espera'}
              </p>
            </div>
          </motion.button>
        </motion.div>

        {/* FEEDBACK */}
        {feedback && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div animate={{ opacity: [1,0.3,1] }} transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
            <p style={{ color: '#93C5FD', fontSize: 11, fontWeight: 600, margin: 0 }}>{feedback}</p>
          </motion.div>
        )}

        {/* STATUS OVERVIEW */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-3">
          {[
            { label: 'Estado del Sistema', value: autoModeEnabled ? 'Activo' : 'En espera', color: autoModeEnabled ? '#93C5FD' : 'rgba(255,255,255,0.35)' },
            { label: 'Acciones',           value: executedActionsCount,                         color: '#60A5FA' },
            { label: 'Reglas Activas',     value: Object.values(rules).filter(r => r.enabled).length, color: '#A78BFA' },
            { label: 'Condiciones',        value: networkAnalysis.inactiveCount + networkAnalysis.balanceIssue, color: 'rgba(255,255,255,0.5)' },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRadius: 12, background: '#0B0F1A', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>{stat.label}</p>
              <p style={{ color: stat.color, fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* RULES PANEL */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ padding: '20px 24px', borderRadius: 14, background: '#0B0F1A', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>Reglas de Automatización</p>
            <button onClick={() => setShowRuleEditor(!showRuleEditor)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 10, fontWeight: 600 }}>
              <Settings size={11} /> Configurar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(rules).map(([ruleKey, ruleData]) => {
              const def = ruleDefinitions[ruleKey];
              const Icon = def.icon;

              return (
                <div key={ruleKey}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 11, background: ruleData.enabled ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${ruleData.enabled ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)'}`, transition: 'all 200ms ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <Icon size={13} style={{ color: ruleData.enabled ? '#93C5FD' : 'rgba(255,255,255,0.2)' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ color: ruleData.enabled ? 'white' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, margin: '0 0 2px 0', transition: 'color 200ms ease' }}>{def.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, margin: 0 }}>{def.description}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ejecuciones</p>
                        <p style={{ color: ruleData.enabled ? '#60A5FA' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 800, margin: 0 }}>{ruleData.executed}</p>
                      </div>
                      <button onClick={() => setRules(prev => ({ ...prev, [ruleKey]: { ...prev[ruleKey], enabled: !prev[ruleKey].enabled } }))}
                        style={{ width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ruleData.enabled ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', color: ruleData.enabled ? '#93C5FD' : 'rgba(255,255,255,0.25)', border: `1px solid ${ruleData.enabled ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`, fontSize: 14, fontWeight: 800, transition: 'all 200ms ease' }}>
                        {ruleData.enabled ? '✓' : '○'}
                      </button>
                    </div>
                  </div>

                  {showRuleEditor && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 mt-2 rounded-lg space-y-2"
                      style={{ background: '#0F1419' }}
                    >
                      <div className="flex items-center gap-3">
                        <label style={{ color: '#6B7280', fontSize: 10, fontWeight: 600, flex: 1 }}>
                          Umbral: {ruleData.threshold}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={ruleData.threshold}
                          onChange={(e) => setRules(prev => ({
                            ...prev,
                            [ruleKey]: { ...prev[ruleKey], threshold: parseInt(e.target.value) }
                          }))}
                          style={{ flex: 2 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {showRuleEditor && (
            <button onClick={() => setShowRuleEditor(false)}
              style={{ width: '100%', marginTop: 12, padding: '9px', borderRadius: 9, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 11, fontWeight: 600 }}>
              Cerrar configuración
            </button>
          )}
        </motion.div>

        {/* ACTION LOG */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ borderRadius: 14, background: '#0B0F1A', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>Registro de Ejecuciones</p>
            <button onClick={() => { setActionLog([]); setExecutedActionsCount(0); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', background: 'rgba(239,68,68,0.07)', color: 'rgba(239,68,68,0.6)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 9, fontWeight: 700 }}>
              <Trash2 size={10} /> Limpiar
            </button>
          </div>

          {actionLog.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <Clock size={20} style={{ color: 'rgba(255,255,255,0.12)', margin: '0 auto 10px' }} />
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, margin: 0 }}>
                {autoModeEnabled ? 'Esperando condiciones de activación...' : 'Sistema en espera · Activa Auto Mode'}
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
              {actionLog.map((action, idx) => (
                <motion.div key={action.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 20px', borderBottom: idx < actionLog.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                    style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600, margin: '0 0 3px 0' }}>{action.action}</p>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>{action.rule}</span>
                      <span style={{ color: '#93C5FD', fontSize: 9, fontWeight: 600 }}>{action.member}</span>
                      <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}>{action.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* SAFETY NOTE */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertCircle size={14} style={{ color: '#60A5FA', marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{ color: '#93C5FD', fontSize: 11, fontWeight: 700, margin: '0 0 2px 0' }}>Perímetro Seguro</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0, lineHeight: 1.6 }}>
              Auto Mode opera exclusivamente dentro de tu red personal. Ninguna acción afecta la plataforma global.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}