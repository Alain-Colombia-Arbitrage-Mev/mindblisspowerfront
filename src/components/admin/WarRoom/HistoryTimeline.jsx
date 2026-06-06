import { motion } from 'framer-motion';
import { X, CreditCard, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

const EVENTS = [
  { type: 'payment', title: 'Pago Aprobado', detail: '$450 · Carlos López', time: '2m ago', color: '#10b981' },
  { type: 'action', title: 'Asesor Asignado', detail: 'María García → Mentorship', time: '18m ago', color: '#3b82f6' },
  { type: 'status', title: 'Estado Actualizado', detail: 'Pendiente Verificación → En Revisión', time: '45m ago', color: '#fb923c' },
  { type: 'alert', title: 'Alerta Detectada', detail: 'Violación protocolo comunicación', time: '1h ago', color: '#ef4444' },
  { type: 'payment', title: 'Pago Recibido', detail: '$750 · Transferencia bancaria', time: '3h ago', color: '#10b981' },
];

const ICON_MAP = {
  payment: CreditCard,
  action: Activity,
  status: CheckCircle,
  alert: AlertTriangle,
};

export default function HistoryTimeline({ node, onClose }) {
  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-80 flex-shrink-0 rounded-xl overflow-hidden flex flex-col"
      style={{ background: 'rgba(8,18,40,0.8)', border: '1px solid rgba(59,130,246,0.25)', backdropFilter: 'blur(10px)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(59,130,246,0.2)' }}>
        <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 900, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
          Timeline de Eventos
        </p>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded transition-all">
          <X size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {EVENTS.map((event, i) => {
            const Icon = ICON_MAP[event.type];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${event.color}20` }}>
                    <Icon size={14} style={{ color: event.color }} />
                  </div>
                  {i < EVENTS.length - 1 && (
                    <div className="w-0.5 h-8 mt-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: 0 }}>{event.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '2px 0 0' }}>{event.detail}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '3px 0 0' }}>{event.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t" style={{ borderColor: 'rgba(59,130,246,0.2)' }}>
        <button
          onClick={onClose}
          className="w-full px-3 py-2 rounded-lg text-xs font-bold transition-all"
          style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}
        >
          Cerrar
        </button>
      </div>
    </motion.div>
  );
}