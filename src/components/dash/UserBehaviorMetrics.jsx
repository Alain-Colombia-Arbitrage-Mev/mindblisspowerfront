import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Eye, MousePointer, AlertTriangle, Activity } from 'lucide-react';

// Mock behavior data
const TIME_ON_PAGE = [
  { página: 'Home', minutos: 2.5, usuarios: 1240 },
  { página: 'Care Plan', minutos: 4.2, usuarios: 980 },
  { página: 'Planes', minutos: 3.8, usuarios: 850 },
  { página: 'FAQ', minutos: 1.5, usuarios: 620 },
  { página: 'Dashboard', minutos: 8.3, usuarios: 450 },
  { página: 'Simulador', minutos: 6.1, usuarios: 280 },
];

const CLICK_DATA = [
  { elemento: 'CTA Principal', clicks: 2840, tasa: 45 },
  { elemento: 'Ver más', clicks: 1520, tasa: 28 },
  { elemento: 'Comparar planes', clicks: 1280, tasa: 22 },
  { elemento: 'Contactar', clicks: 680, tasa: 12 },
  { elemento: 'Footer links', clicks: 420, tasa: 8 },
];

const FUNNEL_ABANDONMENT = [
  { step: '1. Landing', usuarios: 5000, abandono: 0 },
  { step: '2. Care Plan', usuarios: 3500, abandono: 30 },
  { step: '3. Seleccionar Plan', usuarios: 2100, abandono: 40 },
  { step: '4. Formulario', usuarios: 980, abandono: 53 },
  { step: '5. Confirmación', usuarios: 450, abandono: 54 },
];

const DASHBOARD_USAGE = [
  { módulo: 'Overview', uso: 92, usuarios: 415 },
  { módulo: 'Red', uso: 78, usuarios: 350 },
  { módulo: 'Incentivos', uso: 65, usuarios: 290 },
  { módulo: 'Wallet', uso: 48, usuarios: 210 },
  { módulo: 'Documentos', uso: 35, usuarios: 155 },
];

const BEHAVIOR_HEATMAP = [
  { zona: 'Hero', clicks: 850, tiempo_promedio: 3.2 },
  { zona: 'Value Props', clicks: 420, tiempo_promedio: 2.1 },
  { zona: 'Plans Section', clicks: 2100, tiempo_promedio: 4.8 },
  { zona: 'Social Proof', clicks: 180, tiempo_promedio: 1.2 },
  { zona: 'CTA Final', clicks: 2840, tiempo_promedio: 3.5 },
];

export default function UserBehaviorMetrics() {
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'abandonment', 'dashboard'

  const avgTimeOnPage = (TIME_ON_PAGE.reduce((sum, p) => sum + p.minutos, 0) / TIME_ON_PAGE.length).toFixed(1);
  const totalClicks = CLICK_DATA.reduce((sum, c) => sum + c.clicks, 0);
  const abandonmentRate = ((FUNNEL_ABANDONMENT[4].abandono)).toFixed(0);
  const dashboardUsers = DASHBOARD_USAGE.reduce((sum, m) => sum + m.usuarios, 0);

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
          COMPORTAMIENTO DE USUARIOS
        </p>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, margin: '0 0 12px 0' }}>
          User Behavior Analytics
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Entender cómo se comportan los usuarios para optimizar la experiencia.
        </p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Eye size={18} style={{ color: '#3b82f6' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>TIEMPO PROMEDIO</p>
          </div>
          <p style={{ color: '#3b82f6', fontSize: 32, fontWeight: 900, margin: 0 }}>{avgTimeOnPage}m</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <MousePointer size={18} style={{ color: '#10b981' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>TOTAL CLICKS</p>
          </div>
          <p style={{ color: '#10b981', fontSize: 32, fontWeight: 900, margin: 0 }}>{(totalClicks / 1000).toFixed(1)}K</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>ABANDONO TOTAL</p>
          </div>
          <p style={{ color: '#ef4444', fontSize: 32, fontWeight: 900, margin: 0 }}>{abandonmentRate}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} style={{ color: '#a855f7' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>USUARIOS DASHBOARD</p>
          </div>
          <p style={{ color: '#a855f7', fontSize: 32, fontWeight: 900, margin: 0 }}>{dashboardUsers}</p>
        </motion.div>
      </div>

      {/* Tiempo en Página */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>TIEMPO EN PÁGINA</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={TIME_ON_PAGE}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="página" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Bar dataKey="minutos" fill="#3b82f6" name="Minutos" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Heatmap Básico */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>HEATMAP DE INTERACCIÓN</p>

        <div className="space-y-4">
          {BEHAVIOR_HEATMAP.map((zona, i) => {
            const intensity = (zona.clicks / 2840) * 100;
            const bgColor = intensity > 70 ? '#ef4444' : intensity > 40 ? '#fb923c' : '#3b82f6';
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="p-4 rounded-xl"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{zona.zona}</p>
                  <div className="flex items-center gap-3">
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                      {zona.clicks.toLocaleString()} clicks
                    </p>
                    <p style={{ color: bgColor, fontSize: 11, fontWeight: 700 }}>
                      {intensity.toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${intensity}%` }}
                    transition={{ duration: 0.8, delay: 0.25 + i * 0.05 + 0.2 }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${bgColor}, ${bgColor}80)`,
                    }}
                  />
                </div>

                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 6, margin: '6px 0 0 0' }}>
                  Tiempo promedio: {zona.tiempo_promedio}s
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Abandono por Paso */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>ABANDONO EN EL FUNNEL</p>

        <div className="space-y-4">
          {FUNNEL_ABANDONMENT.map((step, i) => {
            const dropRate = i > 0 ? FUNNEL_ABANDONMENT[i - 1].usuarios - step.usuarios : 0;
            const dropPercent = i > 0 ? ((dropRate / FUNNEL_ABANDONMENT[i - 1].usuarios) * 100).toFixed(0) : 0;
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{step.step}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '2px 0 0 0' }}>
                      {step.usuarios.toLocaleString()} usuarios
                    </p>
                  </div>
                  {i > 0 && (
                    <div className="text-right">
                      <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, margin: 0 }}>-{dropPercent}%</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0 0' }}>
                        {dropRate.toLocaleString()} abandonos
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <motion.div
                    animate={{ width: `${(step.usuarios / FUNNEL_ABANDONMENT[0].usuarios) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.08 + 0.2 }}
                    style={{
                      height: '100%',
                      background: step.abandono > 50 ? '#ef4444' : step.abandono > 30 ? '#fb923c' : '#10b981',
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            ⚠️ <strong>Mayor pérdida</strong> en paso 3 (Seleccionar Plan): 40% de abandono. Revisar claridad de opciones.
          </p>
        </div>
      </motion.div>

      {/* Dashboard Usage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>USO DEL DASHBOARD</p>

        <div className="space-y-3">
          {DASHBOARD_USAGE.map((modulo, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="flex items-center justify-between mb-2">
                <p style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{modulo.módulo}</p>
                <p style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700 }}>{modulo.usuarios} usuarios</p>
              </div>

              <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${modulo.uso}%` }}
                  transition={{ duration: 0.8, delay: 0.35 + i * 0.06 }}
                  style={{
                    height: '100%',
                    background: modulo.uso > 80 ? '#10b981' : modulo.uso > 50 ? '#3b82f6' : '#fb923c',
                  }}
                />
              </div>

              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 4 }}>
                {modulo.uso}% uso
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Click Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>DISTRIBUCIÓN DE CLICKS</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={CLICK_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="elemento" stroke="rgba(255,255,255,0.3)" angle={-15} textAnchor="end" height={80} />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Bar dataKey="clicks" fill="#3b82f6" name="Clicks" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="p-8 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(34,197,94,0.08))', border: '1px solid rgba(16,185,129,0.25)' }}
      >
        <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12, fontFamily: 'Montserrat, sans-serif' }}>RECOMENDACIONES</p>
        <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>Optimizaciones prioritarias</h3>

        <div className="space-y-3">
          {[
            { label: 'Sección de planes', desc: 'Genera 38% del tráfico. Mejorar claridad de opciones reduciría abandono.' },
            { label: 'CTA principal', desc: '45% de tasa de conversión. Es tu mejor elemento. Duplicar visibilidad en sitio.' },
            { label: 'Dashboard Overview', desc: '92% uso. Mantenlo como punto de entrada principal para usuarios nuevos.' },
          ].map((insight, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#10b981' }} />
              <div>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 2px 0' }}>{insight.label}</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>{insight.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}