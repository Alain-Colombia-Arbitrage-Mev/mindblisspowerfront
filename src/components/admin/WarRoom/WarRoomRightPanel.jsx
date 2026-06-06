import { useState, useEffect } from 'react';
  import { motion, AnimatePresence } from 'framer-motion';
  import { X, TrendingUp, Users, DollarSign, AlertCircle, Loader2, ChevronUp, Home, ChevronLeft } from 'lucide-react';
  import { useNavigate } from 'react-router-dom';
  import useButtonAction from '@/hooks/useButtonAction';
  import WarRoomActionPanel from './WarRoomActionPanel';
  import InterventionPanel from './InterventionPanel';
  import HistoryTimeline from './HistoryTimeline';
  import NetworkAuditScan from './NetworkAuditScan';
  import AIReasoningPanel from './AIReasoningPanel';
  import UserActionMenu from './UserActionMenu';
  import InterventionForm from './InterventionForm';
  import NetworkContextPanel from './NetworkContextPanel';
  import { getWarRoomLeaderDNA } from '@/lib/warRoomDataAdapter';
  import DataConsistencyHelper from '@/lib/DataConsistencyHelper';

/**
 * ZONE 4: RIGHT RESPONSE COLUMN
 * DNA panel with full leader/node detail, upline, investment, payment urgency
 */

export default function WarRoomRightPanel({ selectedNode, onClose, navigation, onNavigate }) {
  const navigate = useNavigate();
  const [actionPanel, setActionPanel] = useState(null);
  const [panelType, setPanelType] = useState(null);
  const [nodeData, setNodeData] = useState(null);
  const [interventionPanel, setInterventionPanel] = useState(false);

  // Fetch leader DNA from canonical adapter
  useEffect(() => {
    if (!selectedNode?.id) return;
    const dna = getWarRoomLeaderDNA(selectedNode.id);
    if (dna) {
      setNodeData(dna);
    }
  }, [selectedNode]);

  // Action simulators — force real behavior or full simulation
  const interventionAction = useButtonAction(async () => {
    if (!nodeData?.id) {
      setActionPanel({ title: 'Error', message: 'No node selected', state: 'error' });
      return { success: false };
    }
    setInterventionPanel(true);
    setActionPanel({ title: 'Intervención Manual', message: `Abriendo para ${nodeData.name}...`, state: 'executing' });
    await new Promise(r => setTimeout(r, 1200));
    return { success: true, message: 'Panel de intervención abierto' };
  });

  const historyAction = useButtonAction(async () => {
    if (!nodeData?.id) return { success: false };
    setPanelType('history');
    setActionPanel({ title: 'Historial de Eventos', message: `Cargando para ${nodeData.name}...`, state: 'executing' });
    await new Promise(r => setTimeout(r, 1200));
    return { success: true, events: 8 };
  });

  const auditAction = useButtonAction(async () => {
    if (!nodeData?.id) return { success: false };
    setPanelType('audit');
    setActionPanel({ title: 'Auditoría de Red', message: `Escaneando red de ${nodeData.name}...`, state: 'executing' });
    await new Promise(r => setTimeout(r, 2000));
    return { success: true, riskLevel: 'medium', criticalNodes: 2 };
  });

  const aiAction = useButtonAction(async () => {
    if (!nodeData?.id) return { success: false };
    setPanelType('ai');
    setActionPanel({ title: 'IA Ejecutar', message: `Analizando perfil de ${nodeData.name}...`, state: 'executing' });
    await new Promise(r => setTimeout(r, 1800));
    return { success: true, recommendation: 'Capacitación urgente recomendada' };
  });

  const handleAction = (action) => {
    if (!nodeData?.id) {
      setActionPanel({ title: 'Error', message: 'Selecciona un líder primero', state: 'error' });
      return;
    }
    action.execute();
    setTimeout(() => {
      setActionPanel(prev => prev ? { ...prev, state: 'success' } : null);
    }, 2000);
  };

  const closeActionPanel = () => {
    setActionPanel(null);
    interventionAction.reset();
    historyAction.reset();
    auditAction.reset();
    aiAction.reset();
  };

  const handleInterventionApply = (data) => {
    setPanelType(null);
    setActionPanel({ title: 'Intervención Aplicada', message: `Asesor asignado: ${data.advisor} · Prioridad: ${data.priority}`, state: 'success' });
  };

  const handleAIExecute = () => {
    if (nodeData) {
      DataConsistencyHelper.applyIntervention(nodeData.id, 'IA-System', 'auto');
    }
    setPanelType(null);
    setActionPanel({ title: 'IA Ejecutada', message: 'Recomendación aplicada · Asesor asignado · Seguimiento agendado', state: 'success' });
  };

  const handleUserAction = (actionType) => {
    switch (actionType) {
      case 'intervention':
        setPanelType('intervention');
        break;
      case 'profile':
        setActionPanel({ title: `${nodeData?.name} · Perfil Completo`, message: `Rango ${nodeData?.rank} ${nodeData?.rank_icon} · ${nodeData?.country} · ${nodeData?.red_activa} miembros activos`, state: 'success' });
        setTimeout(() => setActionPanel(null), 3000);
        break;
      case 'dna':
        setActionPanel({ title: `ADN Detallado · ${nodeData?.name}`, message: `Izquierda: ${nodeData?.left_count} · Derecha: ${nodeData?.right_count} · Balance: ${nodeData?.balance || 50}%`, state: 'success' });
        setTimeout(() => setActionPanel(null), 3000);
        break;
      case 'history':
        setPanelType('history');
        break;
      case 'payments':
        setActionPanel({ title: 'Historial de Pagos', message: `${nodeData?.payment_summary?.confirmado_count || 0} confirmados · $${(nodeData?.payment_summary?.confirmado_amount || 0).toLocaleString()}`, state: 'success' });
        setTimeout(() => setActionPanel(null), 3000);
        break;
      case 'documents':
        setActionPanel({ title: 'Documentación', message: 'Todos los documentos verificados ✓', state: 'success' });
        setTimeout(() => setActionPanel(null), 2500);
        break;
      case 'onboarding':
        setActionPanel({ title: 'Estado de Onboarding', message: 'Completado · 100% · Verificado', state: 'success' });
        setTimeout(() => setActionPanel(null), 2500);
        break;
      case 'membership':
        setActionPanel({ title: 'Membresía', message: `Plan ${nodeData?.membership_plan || 'Standard'} · Inversión $${(nodeData?.inversion_personal || 0).toLocaleString()}`, state: 'success' });
        setTimeout(() => setActionPanel(null), 2500);
        break;
      case 'network':
        setActionPanel({ title: `Red de ${nodeData?.name}`, message: `${nodeData?.direct_referrals || 0} directos · ${nodeData?.deep_generation || 0} generación profunda`, state: 'success' });
        setTimeout(() => setActionPanel(null), 2500);
        break;
      case 'advisor':
        setActionPanel({ title: 'Asignar Asesor', message: `Seleccionando asesor para ${nodeData?.name}...`, state: 'executing' });
        setTimeout(() => {
          setActionPanel({ title: 'Asesor Asignado', message: `Asesor designado: Sistema Automático · Seguimiento programado`, state: 'success' });
          setTimeout(() => setActionPanel(null), 2000);
        }, 1200);
        break;
      case 'audit':
        setPanelType('audit');
        break;
      case 'followup':
        setActionPanel({ title: 'Seguimiento Agendado', message: 'Llamada de seguimiento agendada para el 15 de abril', state: 'success' });
        setTimeout(() => setActionPanel(null), 2500);
        break;
      case 'ai_action':
        setPanelType('ai');
        break;
    }
  };

  const handleCRMLink = (module, userId) => {
    setActionPanel({
      title: `Ir a ${module}`,
      message: `Abriendo en ${module} para ${nodeData?.name}...`,
      state: 'executing'
    });
    setTimeout(() => {
      setActionPanel(null);
      const moduleMap = {
        'Participantes': `/admin-dashboard/participants/${userId}`,
        'Líderes': `/admin-dashboard/leaders/${userId}`,
        'Pagos': `/admin-dashboard/payments/${userId}`,
        'Soporte': '/admin-dashboard/support',
      };
      const targetRoute = moduleMap[module];
      if (targetRoute) {
        navigate(targetRoute);
      }
    }, 1500);
  };

  const handleInterventionExecute = (data) => {
    // Apply intervention to data model
    if (nodeData?.id) {
      DataConsistencyHelper.applyIntervention(nodeData.id, data.advisor, data.type);
    }
    
    // Close intervention panel
    setInterventionPanel(false);
    
    // Show success confirmation
    setActionPanel({
      title: 'Intervención Registrada ✓',
      message: `${data.type.replace(/_/g, ' ')} asignado a ${data.advisor} · Prioridad: ${data.priority}`,
      state: 'success'
    });
    
    // Auto-close after 3 seconds
    setTimeout(() => setActionPanel(null), 3000);
  };

  return (
    <>
      <AnimatePresence>
        {(nodeData || selectedNode) && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-80 flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
            style={{
              background: 'rgba(4,10,22,0.7)',
              border: '1px solid rgba(59,130,246,0.15)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* HEADER WITH BREADCRUMB & NAVIGATION */}
            <div className="flex-shrink-0 flex flex-col gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between">
                <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 900, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
                  ADN del Líder
                </p>
                <div className="flex items-center gap-1">
                  {navigation?.canGoUp && (
                    <button
                      onClick={() => {
                        navigation.goUp();
                        onNavigate({...navigation});
                        onClose();
                      }}
                      className="p-1.5 hover:bg-white/10 rounded transition-all"
                      title="Subir un nivel"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      <ChevronUp size={14} />
                    </button>
                  )}
                  {!navigation?.isRoot && (
                    <button
                      onClick={() => {
                        navigation.returnToRoot();
                        onNavigate({...navigation});
                        onClose();
                      }}
                      className="p-1.5 hover:bg-white/10 rounded transition-all"
                      title="Volver a raíz"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      <Home size={14} />
                    </button>
                  )}
                  <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded transition-all">
                    <X size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  </button>
                </div>
              </div>
              
              {/* BREADCRUMB */}
              {navigation && typeof navigation.getBreadcrumb === 'function' && navigation.getBreadcrumb().length > 0 && (
                <div className="flex items-center gap-1.5 text-xs overflow-x-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {navigation.getBreadcrumb().map((node, idx, arr) => (
                    <div key={node.id} className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const targetIdx = arr.indexOf(node);
                          while (navigation.navigationStack.length > targetIdx + 1) {
                            navigation.goUp();
                          }
                          onNavigate({...navigation});
                        }}
                        className="hover:text-white transition-colors whitespace-nowrap"
                      >
                        {node.name}
                      </button>
                      {idx < arr.length - 1 && <span>/</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto space-y-3 p-4">
              {/* STATUS BADGE */}
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-1 rounded-lg text-xs font-bold"
                  style={{
                    background: nodeData?.criticality === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                    color: nodeData?.criticality === 'high' ? '#ef4444' : '#10b981',
                  }}
                >
                  {nodeData?.criticality === 'high' ? '⚠ Crítico' : '✓ Activo'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600 }}>
                  {nodeData?.country || 'N/A'}
                </span>
              </div>

              {/* NAME & TITLE */}
              <div>
                <h3 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 4px 0' }}>
                  {nodeData?.name || selectedNode?.name || 'Node'}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>
                  Líder de Red · Rango {nodeData?.rank || 'Principiante'} {nodeData?.rank_icon || ''}
                </p>
              </div>

              {/* DNA METRICS GRID — Only selected leader context, no root leakage */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {[
                    { icon: Users, label: 'Red Activa', value: nodeData?.red_activa !== undefined ? nodeData.red_activa : 0, color: '#10b981' },
                    { icon: TrendingUp, label: 'Inv. Personal', value: `$${(nodeData?.inversion_personal || 0).toLocaleString()}`, color: '#3b82f6' },
                    { icon: DollarSign, label: 'Ingresos Mes', value: `$${(nodeData?.ingresos_mes || 0).toLocaleString()}`, color: '#fb923c' },
                    { icon: AlertCircle, label: 'Urgencia', value: nodeData?.urgencia || 'Normal', color: nodeData?.urgencia === 'Alta' ? '#ef4444' : '#10b981' },
                ].map((metric, i) => {
                  const Icon = metric.icon;
                  return (
                    <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${metric.color}30` }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: metric.color }} />
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, margin: 0, fontWeight: 700 }}>
                          {metric.label}
                        </p>
                      </div>
                      <p style={{ color: 'white', fontSize: 14, fontWeight: 900, margin: 0 }}>
                        {metric.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* NETWORK DNA — Only selected leader's structure, no root context */}
              <div className="pt-2 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
                  Estructura de Red
                </p>
                {[
                  { label: 'Línea Izquierda', value: nodeData?.left_count !== undefined ? nodeData.left_count : 0 },
                  { label: 'Línea Derecha', value: nodeData?.right_count !== undefined ? nodeData.right_count : 0 },
                  { label: 'Referidos Directos', value: nodeData?.direct_referrals !== undefined ? nodeData.direct_referrals : 0 },
                  { label: 'Generación Profunda', value: nodeData?.deep_generation !== undefined ? nodeData.deep_generation : 0 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}>{item.label}</span>
                    <span style={{ color: '#3b82f6', fontSize: 11, fontWeight: 900 }}>{item.value}</span>
                  </div>
                ))}
              </div>



              {/* NETWORK CONTEXT */}
              {nodeData && <NetworkContextPanel node={nodeData} />}

              {/* UNIFIED ACTION MENU */}
              {nodeData && (
                <UserActionMenu
                  node={nodeData}
                  onAction={handleUserAction}
                  onCRMLink={handleCRMLink}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INTERVENTION FORM */}
      {interventionPanel && (
        <InterventionForm
          node={nodeData || selectedNode}
          onClose={() => setInterventionPanel(false)}
          onExecute={handleInterventionExecute}
        />
      )}

      {/* SIDE PANELS */}
      <AnimatePresence>
        {panelType === 'intervention' && (
          <InterventionPanel
            node={nodeData || selectedNode}
            onClose={() => setPanelType(null)}
            onApply={handleInterventionApply}
          />
        )}
        {panelType === 'history' && (
          <HistoryTimeline
            node={nodeData || selectedNode}
            onClose={() => setPanelType(null)}
          />
        )}
        {panelType === 'audit' && (
          <NetworkAuditScan
            node={nodeData || selectedNode}
            onClose={() => setPanelType(null)}
          />
        )}
        {panelType === 'ai' && (
          <AIReasoningPanel
            node={nodeData || selectedNode}
            onClose={() => setPanelType(null)}
            onExecute={handleAIExecute}
          />
        )}
      </AnimatePresence>

      {/* ACTION PANEL MODAL */}
      {actionPanel && (
        <WarRoomActionPanel
          isOpen={true}
          title={actionPanel.title}
          message={actionPanel.message}
          state={actionPanel.state}
          onClose={closeActionPanel}
        />
      )}
    </>
  );
}