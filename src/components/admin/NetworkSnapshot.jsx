import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function NetworkSnapshot({ network }) {
  if (!network) return null;

  const sections = [
    {
      label: 'RESUMEN',
      items: [
        { name: 'Total Usuarios', value: network.totalMembers || 0 },
        { name: 'Inversión Total', value: `$${network.totalInvestment || 0}` },
        { name: 'Estado General', value: 'OPERATIVO' },
      ],
      color: '#3b82f6',
    },
    {
      label: 'RIESGOS',
      items: [
        { name: 'Críticos Activos', value: network.criticalCount || 0, warning: true },
        { name: 'Usuarios Inactivos', value: '5' },
        { name: 'Pagos Vencidos', value: '3', warning: true },
      ],
      color: '#ef4444',
    },
    {
      label: 'OPORTUNIDADES',
      items: [
        { name: 'Nuevos Usuarios Este Mes', value: '12' },
        { name: 'Crecimiento Mensual', value: '+23%' },
        { name: 'Activación Potencial', value: '8 usuarios' },
      ],
      color: '#10b981',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="space-y-3">
        {sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-lg"
            style={{ background: `${section.color}0d`, border: `1px solid ${section.color}22` }}>
            <p style={{ color: section.color, fontSize: 9, fontWeight: 800, letterSpacing: 1, margin: '0 0 10px 0', textTransform: 'uppercase' }}>
              {section.label}
            </p>
            <div className="space-y-2">
              {section.items.map((item, j) => (
                <div key={j} className="flex items-center justify-between">
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
                    {item.name}
                  </p>
                  <p style={{ color: item.warning ? '#ef4444' : section.color, fontWeight: 700, fontSize: 12, margin: 0 }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}