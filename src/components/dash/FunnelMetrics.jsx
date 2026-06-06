import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, AlertCircle, Users } from 'lucide-react';

// Mock funnel data
const FUNNEL_STEPS = [
  { id: 1, label: 'Visitantes', users: 10000, color: '#3b82f6' },
  { id: 2, label: 'Click en CTA', users: 6500, color: '#3b82f6' },
  { id: 3, label: 'Registro iniciado', users: 4200, color: '#60a5fa' },
  { id: 4, label: 'Registro completado', users: 3100, color: '#60a5fa' },
  { id: 5, label: 'Onboarding paso 2', users: 2300, color: '#93c5fd' },
  { id: 6, label: 'Selección de plan', users: 1800, color: '#a78bfa' },
  { id: 7, label: 'Contrato aceptado', users: 1200, color: '#c084fc' },
  { id: 8, label: 'Pago iniciado', users: 900, color: '#ec4899' },
  { id: 9, label: 'Pago completado', users: 750, color: '#f472b6' },
  { id: 10, label: 'Activación', users: 650, color: '#10b981' },
];

export default function FunnelMetrics() {
  const [hoveredStep, setHoveredStep] = useState(null);

  // Calculate conversion rates
  const calculateMetrics = () => {
    return FUNNEL_STEPS.map((step, index) => {
      const prevUsers = index === 0 ? FUNNEL_STEPS[0].users : FUNNEL_STEPS[index - 1].users;
      const conversionRate = index === 0 ? 100 : (step.users / prevUsers) * 100;
      const overallConversion = (step.users / FUNNEL_STEPS[0].users) * 100;
      const dropoff = index === 0 ? 0 : prevUsers - step.users;

      return {
        ...step,
        conversionRate: conversionRate.toFixed(1),
        overallConversion: overallConversion.toFixed(1),
        dropoff,
        dropoffPercent: index === 0 ? 0 : ((dropoff / prevUsers) * 100).toFixed(1),
      };
    });
  };

  const metrics = calculateMetrics();
  const maxUsers = FUNNEL_STEPS[0].users;

  // Find biggest dropoff point
  const biggestDropoff = metrics.reduce((prev, curr) => 
    (parseFloat(curr.dropoffPercent) > parseFloat(prev.dropoffPercent) ? curr : prev)
  );

  // Overall stats
  const totalUsers = FUNNEL_STEPS[0].users;
  const activatedUsers = FUNNEL_STEPS[FUNNEL_STEPS.length - 1].users;
  const overallConversion = ((activatedUsers / totalUsers) * 100).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat, sans-serif' }}>
          MÉTRICAS DE CONVERSIÓN
        </p>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, margin: '0 0 12px 0' }}>
          Funnel de conversión
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Visualiza dónde se pierden usuarios y optimiza cada paso del camino hacia la activación.
        </p>
      </motion.div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>VISITANTES TOTALES</p>
          <p style={{ color: '#3b82f6', fontSize: 32, fontWeight: 900, margin: 0 }}>{totalUsers.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>ACTIVADOS</p>
          <p style={{ color: '#10b981', fontSize: 32, fontWeight: 900, margin: 0 }}>{activatedUsers.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}
        >
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>CONVERSIÓN TOTAL</p>
          <p style={{ color: '#a855f7', fontSize: 32, fontWeight: 900, margin: 0 }}>{overallConversion}%</p>
        </motion.div>
      </div>

      {/* Funnel Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>FLUJO DE USUARIOS</p>

        <div className="space-y-4">
          {metrics.map((step, index) => {
            const width = (step.users / maxUsers) * 100;
            const isLargeDropoff = step.dropoff > (maxUsers * 0.15);

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredStep(step.id)}
                onMouseLeave={() => setHoveredStep(null)}
                className="group"
              >
                {/* Step header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-white flex-shrink-0"
                      style={{ background: step.color }}>
                      {step.id}
                    </div>
                    <span style={{ color: 'white', fontSize: 13, fontWeight: 600, flex: 1 }}>
                      {step.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>USUARIOS</p>
                      <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '2px 0 0 0' }}>
                        {step.users.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>CONVERSION</p>
                      <p style={{ color: '#3b82f6', fontSize: 14, fontWeight: 700, margin: '2px 0 0 0' }}>
                        {step.conversionRate}%
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>TOTAL</p>
                      <p style={{ color: step.overallConversion < 10 ? '#ef4444' : '#10b981', fontSize: 14, fontWeight: 700, margin: '2px 0 0 0' }}>
                        {step.overallConversion}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Funnel bar */}
                <motion.div
                  animate={{
                    width: hoveredStep === step.id ? '100%' : `${width}%`,
                  }}
                  transition={{ duration: 0.2 }}
                  className="h-10 rounded-lg flex items-center px-3 cursor-pointer transition-all relative overflow-hidden"
                  style={{
                    background: `linear-gradient(90deg, ${step.color}40, ${step.color}20)`,
                    border: `1px solid ${step.color}`,
                    boxShadow: hoveredStep === step.id ? `0 0 16px ${step.color}60` : 'none',
                  }}
                >
                  <motion.div
                    animate={{
                      width: hoveredStep === step.id ? '100%' : `${(step.users / maxUsers) * 100}%`,
                    }}
                    transition={{ duration: 0.2 }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${step.color}, ${step.color}80)`,
                      borderRadius: 6,
                      position: 'absolute',
                      left: 0,
                      top: 0,
                    }}
                  />
                  <span style={{
                    position: 'relative',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    {width.toFixed(0)}%
                  </span>
                </motion.div>

                {/* Dropoff indicator */}
                {step.dropoff > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    className={`mt-1 flex items-center gap-2 text-xs ${isLargeDropoff ? 'opacity-100' : 'opacity-60'}`}
                  >
                    <TrendingDown size={12} style={{ color: '#ef4444' }} />
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>
                      -{step.dropoff.toLocaleString()} usuarios ({step.dropoffPercent}% dropoff)
                    </span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Biggest Dropoff Alert */}
      {biggestDropoff.dropoff > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl flex gap-4"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 700, margin: '0 0 4px 0' }}>
              Mayor punto de abandono
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: 'white' }}>"{biggestDropoff.label}"</strong> pierde el <strong style={{ color: '#ef4444' }}>{biggestDropoff.dropoffPercent}%</strong> de usuarios ({biggestDropoff.dropoff.toLocaleString()} personas). Optimiza este paso para mejorar la conversión.
            </p>
          </div>
        </motion.div>
      )}

      {/* Step-by-step Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>ANÁLISIS DETALLADO</p>

        <div className="space-y-3">
          {metrics.map((step) => {
            const isAlert = parseFloat(step.dropoffPercent) > 20;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-4 rounded-lg flex items-start gap-3"
                style={{
                  background: isAlert ? 'rgba(239,68,68,0.06)' : 'rgba(59,130,246,0.06)',
                  border: `1px solid ${isAlert ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.1)'}`,
                }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${isAlert ? 'bg-red-500' : 'bg-blue-500'}`}>
                  {step.id}
                </div>
                <div className="flex-1">
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 4px 0' }}>
                    {step.label}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                    {step.users.toLocaleString()} usuarios • {step.conversionRate}% conversion rate {step.dropoff > 0 && `• ${step.dropoffPercent}% dropoff`}
                  </p>
                </div>
                {isAlert && (
                  <div className="px-3 py-1 rounded-lg flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 700 }}>⚠ CRÍTICO</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Optimization Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-8 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(34,197,94,0.08))', border: '1px solid rgba(16,185,129,0.25)' }}
      >
        <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12, fontFamily: 'Montserrat, sans-serif' }}>PRÓXIMOS PASOS</p>
        <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>Optimiza tu funnel</h3>

        <div className="space-y-3">
          {[
            { label: 'Enfócate en el paso 2', desc: 'Es donde pierdes más usuarios (35% dropoff). Simplifica el CTA.' },
            { label: 'Mejora el onboarding', desc: 'Paso 5 pierde 23% de usuarios. Considera reducir pasos o mejorar UX.' },
            { label: 'Analiza el contrato', desc: 'Paso 7 tiene 33% dropoff. ¿Es muy complicado? ¿Necesita más claridad?' },
          ].map((tip, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#10b981' }} />
              <div>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 2px 0' }}>{tip.label}</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}