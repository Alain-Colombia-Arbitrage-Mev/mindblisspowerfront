import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, DownloadCloud, Clock, DollarSign, FileText, LogIn, Users, AlertTriangle, Award, Zap, ChevronRight } from 'lucide-react';

const actions = [
  { icon: Eye, label: 'Ver perfil completo', type: 'profile', color: '#3b82f6' },
  { icon: Users, label: 'Ver ADN', type: 'dna', color: '#8b5cf6' },
  { icon: Clock, label: 'Ver historial', type: 'history', color: '#06b6d4' },
  { icon: DollarSign, label: 'Ver pagos', type: 'payments', color: '#10b981' },
  { icon: FileText, label: 'Ver documentación', type: 'documents', color: '#f59e0b' },
  { icon: LogIn, label: 'Ver onboarding', type: 'onboarding', color: '#ec4899' },
  { icon: Award, label: 'Ver membresía', type: 'membership', color: '#6366f1' },
  { icon: Users, label: 'Ver red personal', type: 'network', color: '#14b8a6' },
  { icon: AlertTriangle, label: 'Intervención manual', type: 'intervention', color: '#ef4444' },
  { icon: Award, label: 'Asignar asesor', type: 'advisor', color: '#f97316' },
  { icon: Clock, label: 'Marcar seguimiento', type: 'followup', color: '#06b6d4' },
  { icon: AlertTriangle, label: 'Auditar red', type: 'audit', color: '#dc2626' },
  { icon: Zap, label: 'Ejecutar acción IA', type: 'ai_action', color: '#8b5cf6' },
];

export default function UserActionMenu({ node, onAction, onCRMLink }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-all"
        style={{
          background: 'rgba(59,130,246,0.15)',
          color: '#3b82f6',
          border: '1px solid rgba(59,130,246,0.3)',
        }}
      >
        {expanded ? 'Ocultar Acciones' : 'Mostrar Acciones'} ({actions.length})
        <ChevronRight size={12} style={{ transform: expanded ? 'rotate(90deg)' : '', transition: 'all 200ms' }} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.type}
                  onClick={() => {
                    onAction(action.type);
                    setExpanded(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all hover:bg-white/10"
                  style={{
                    background: `${action.color}15`,
                    color: action.color,
                    border: `1px solid ${action.color}30`,
                  }}
                >
                  <Icon size={11} />
                  {action.label}
                </button>
              );
            })}

            {/* CRM JUMP LINKS */}
            <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, margin: '4px 0 6px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Ir a CRM
              </p>
              {['Participantes', 'Líderes', 'Pagos', 'Soporte'].map((module) => (
                <button
                  key={module}
                  onClick={() => onCRMLink(module, node.id)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all hover:bg-white/10 text-left"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <ChevronRight size={10} />
                  {module}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}