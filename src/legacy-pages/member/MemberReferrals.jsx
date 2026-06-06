import { motion } from 'framer-motion';
import { GitBranch, Link2, Radar } from 'lucide-react';
import ReferralModule from '@/components/member/ReferralModule';

const trustItems = [
  { label: 'Enlace único', sub: 'Trazable y permanente', icon: Link2 },
  { label: 'Red binaria', sub: 'Izquierda o derecha', icon: GitBranch },
  { label: 'Seguimiento en tiempo real', sub: 'Estado de cada invitado', icon: Radar },
];

export default function MemberReferrals() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ background: 'var(--vp-bg)', minHeight: '100vh' }}
    >
      <section
        style={{
          background: 'var(--vp-shell)',
          borderBottom: '1px solid var(--vp-border)',
          padding: '44px clamp(20px, 4vw, 42px) 40px',
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ maxWidth: 700 }}>
            <p
              style={{
                color: 'var(--vp-accent)',
                fontSize: 10,
                fontWeight: 850,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                margin: '0 0 14px',
              }}
            >
              Motor de Crecimiento · Red Binaria
            </p>
            <h1
              style={{
                color: 'var(--vp-text)',
                fontSize: 'clamp(30px, 4vw, 44px)',
                fontWeight: 900,
                margin: '0 0 16px',
                lineHeight: 1.08,
              }}
            >
              Cada persona que invitas{' '}
              <span style={{ color: 'var(--vp-accent)' }}>construye tu red.</span>
            </h1>
            <p
              style={{
                color: 'var(--vp-muted)',
                fontSize: 14,
                lineHeight: 1.7,
                margin: '0 0 28px',
                maxWidth: 620,
              }}
            >
              Tu código de referido es la puerta de entrada al sistema. Compártelo con intención, hazle seguimiento, y convierte cada invitación en un activo permanente de tu estructura binaria.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, maxWidth: 620 }}>
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'var(--vp-surface)',
                      border: '1px solid var(--vp-border)',
                      boxShadow: 'var(--vp-shadow)',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'var(--vp-accent-muted)',
                        border: '1px solid var(--vp-accent-border)',
                        color: 'var(--vp-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={14} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p style={{ color: 'var(--vp-text)', fontSize: 12, fontWeight: 800, margin: '0 0 4px' }}>{item.label}</p>
                      <p style={{ color: 'var(--vp-muted)', fontSize: 11, margin: 0 }}>{item.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <main style={{ padding: '28px clamp(20px, 4vw, 42px) 48px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <ReferralModule />
        </div>
      </main>
    </motion.div>
  );
}
