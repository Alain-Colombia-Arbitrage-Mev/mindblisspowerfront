/**
 * WithdrawalHero — Trust Cinema
 * One hero. Communicates: safe · BMP channel · simple process
 */
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';

export default function WithdrawalHero() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #05070D 0%, #0A1020 50%, #06091A 100%)',
        borderBottom: '1px solid rgba(59,130,246,0.1)',
      }}
    >
      {/* Atmospheric layers */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 1000px 600px at 25% 70%, rgba(59,130,246,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 600px 400px at 80% 30%, rgba(124,58,237,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid', gridTemplateColumns: '1fr auto',
        gap: 40, alignItems: 'center',
        padding: '48px 40px 44px',
      }}>
        {/* LEFT: COPY */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.04 }}
        >
          <p style={{ color: 'rgba(59,130,246,0.55)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', margin: '0 0 14px 0' }}>
            Gestión Financiera · Retiros
          </p>
          <h1 style={{ color: 'white', fontSize: 34, fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-0.8px', lineHeight: 1.12 }}>
            Tus ganancias,<br />
            <span style={{ color: '#93C5FD' }}>transferidas con seguridad.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.7, margin: '0 0 28px 0', maxWidth: 460 }}>
            Los retiros se procesan exclusivamente a través de <strong style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 700 }}>BMP</strong>, tu plataforma financiera de confianza. Vincula tu cuenta una vez y gestiona tus solicitudes en minutos.
          </p>

          {/* Trust strip */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Canal verificado', sub: 'Solo a través de BMP' },
              { label: 'Sin comisiones ocultas', sub: 'Monto neto garantizado' },
              { label: 'Proceso guiado', sub: '4 pasos simples' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 9,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <Shield size={10} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, margin: '0 0 1px 0' }}>{item.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, margin: 0 }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT: ABSTRACT FINANCIAL VISUAL — premium, no phone */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
          style={{ display: 'none' }}
          className="hidden md:block"
        >
        </motion.div>

        {/* RIGHT: Structured visual panel */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          style={{
            width: 220, flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}
          className="hidden md:flex"
        >
          {/* BMP identity card */}
          <div style={{
            padding: '16px 18px', borderRadius: 14,
            background: 'linear-gradient(135deg, #0A1428, #0E1A35)',
            border: '1px solid rgba(59,130,246,0.2)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <p style={{ color: 'rgba(59,130,246,0.55)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 10px 0' }}>BMP Account</p>
            <div style={{ height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginBottom: 12, overflow: 'hidden' }}>
              <motion.div animate={{ width: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #1d6ef5, #7C3AED)', borderRadius: 3 }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 4px 0' }}>Saldo disponible</p>
            <p style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>$5,000<span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 400 }}> USD</span></p>
          </div>

          {/* Step flow mini preview */}
          {[
            { num: '01', label: 'Cuenta BMP', done: true },
            { num: '02', label: 'Vincular email', active: true },
            { num: '03', label: 'Definir monto', locked: true },
            { num: '04', label: 'Confirmar', locked: true },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 14px', borderRadius: 10,
              background: s.active ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${s.active ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)'}`,
              opacity: s.locked ? 0.4 : 1,
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                background: s.done ? 'rgba(59,130,246,0.2)' : s.active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${s.done ? 'rgba(59,130,246,0.4)' : s.active ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.done ? '#60A5FA' : s.active ? '#93C5FD' : 'rgba(255,255,255,0.2)',
                fontSize: 8, fontWeight: 800,
              }}>
                {s.done ? '✓' : s.num}
              </span>
              <p style={{ color: s.active ? '#93C5FD' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: s.active ? 700 : 500, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}