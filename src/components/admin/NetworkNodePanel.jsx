import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Clock, DollarSign, Zap } from 'lucide-react';
import UserManagementEngine from '@/lib/UserManagementEngine';

export default function NetworkNodePanel({ node, onClose, onAction }) {
  if (!node) return null;

  const alerts = [
    { icon: Clock, label: 'Última actividad', value: '12 días atrás', color: '#fb923c' },
    { icon: DollarSign, label: 'Pago pendiente', value: '$250', color: '#ef4444' },
  ];

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 h-full w-96 z-50 shadow-2xl"
          style={{ background: 'rgba(8,18,40,0.98)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          
          <div className="h-full overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 style={{ color: 'white', fontWeight: 900, fontSize: 16, margin: 0 }}>
                {node.name}
              </h3>
              <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded transition-all">
                <X size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 800, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>Información</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Email', value: node.email },
                    { label: 'Rango', value: node.rank || 'N/A' },
                    { label: 'Estado', value: node.status.replace(/_/g, ' ') },
                    { label: 'Inversión', value: `$${node.investment || 0}` },
                  ].map((item, i) => (
                    <div key={i}>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>{item.label}</p>
                      <p style={{ color: 'white', fontWeight: 600, fontSize: 11, margin: '2px 0 0 0' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Position */}
              <div className="space-y-2 p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <p style={{ color: '#8b5cf6', fontSize: 9, fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Posición en Red</p>
                <div className="text-xs space-y-1">
                  <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Líder superior: <span style={{ color: 'white', fontWeight: 600 }}>Carlos López</span></p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Referido por: <span style={{ color: 'white', fontWeight: 600 }}>Ana García</span></p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Rama: <span style={{ color: '#3b82f6', fontWeight: 700 }}>IZQUIERDA</span></p>
                </div>
              </div>

              {/* Alerts */}
              <div className="space-y-2">
                <p style={{ color: '#ef4444', fontSize: 9, fontWeight: 800, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>Alertas</p>
                <div className="space-y-1.5">
                  {alerts.map((alert, i) => {
                    const Icon = alert.icon;
                    return (
                      <div key={i} className="flex items-start gap-2 p-2 rounded" style={{ background: `${alert.color}15`, border: `1px solid ${alert.color}30` }}>
                        <Icon size={12} style={{ color: alert.color, marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <p style={{ color: alert.color, fontSize: 10, fontWeight: 700, margin: 0 }}>{alert.label}</p>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '2px 0 0 0' }}>{alert.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <p style={{ color: '#10b981', fontSize: 9, fontWeight: 800, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>Intervención</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Asesor', color: '#3b82f6' },
                    { label: 'Prioridad', color: '#fb923c' },
                    { label: 'Seguimiento', color: '#8b5cf6' },
                    { label: 'Escalada', color: '#ef4444' },
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => onAction(node.id, action.label.toLowerCase())}
                      className="px-3 py-2 rounded text-xs font-semibold transition-all hover:bg-white/10"
                      style={{ background: `${action.color}15`, color: action.color, border: `1px solid ${action.color}30` }}>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}