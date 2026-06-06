/**
 * Withdrawal History Table
 * Recent transactions
 */
import { motion } from 'framer-motion';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const SAMPLE_HISTORY = [
  { id: 1, date: '2024-04-12', amount: 2500, status: 'completed', email: 'user@email.com' },
  { id: 2, date: '2024-04-10', amount: 1500, status: 'processing', email: 'user@email.com' },
  { id: 3, date: '2024-04-08', amount: 3000, status: 'completed', email: 'user@email.com' },
  { id: 4, date: '2024-04-05', amount: 1200, status: 'completed', email: 'user@email.com' },
];

const STATUS_CONFIG = {
  completed: { label: 'Completado', color: '#10b981', icon: CheckCircle },
  processing: { label: 'Procesando', color: '#fb923c', icon: Clock },
  pending: { label: 'Pendiente', color: '#3b82f6', icon: Clock },
  failed: { label: 'Fallido', color: '#ef4444', icon: AlertCircle },
};

export default function WithdrawalHistory() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
      
      <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={16} style={{ color: '#10b981' }} />
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 700, margin: 0 }}>
            Historial de Retiros
          </p>
        </div>
      </div>

      {SAMPLE_HISTORY.length > 0 ? (
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Fecha', 'Monto', 'Estado', 'Email'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    color: 'rgba(255,255,255,0.4)', fontSize: 10,
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_HISTORY.map((item, idx) => {
                const config = STATUS_CONFIG[item.status];
                const Icon = config.icon;
                return (
                  <motion.tr key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                      {new Date(item.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#10b981', fontSize: 11, fontWeight: 700 }}>
                      ${item.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        color: config.color, fontSize: 10, fontWeight: 600,
                      }}>
                        <Icon size={12} /> {config.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                      {item.email}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
            No hay retiros aún. ¡Realiza tu primer retiro!
          </p>
        </div>
      )}
    </motion.div>
  );
}