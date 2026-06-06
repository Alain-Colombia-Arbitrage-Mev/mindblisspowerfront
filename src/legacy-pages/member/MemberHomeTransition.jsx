import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, ShoppingBag, Activity, Network, Lock } from 'lucide-react';
import { sessionManager } from '@/lib/sessionManager';
import GamificationMiniBar from '@/components/gamification/GamificationMiniBar';

const STEPS = [
  { num: 1, label: 'Elegiste participación con red', done: true },
  { num: 2, label: 'Completa tu activación de red', done: false, cta: true },
  { num: 3, label: 'Accede a todos los módulos', done: false },
];

export default function MemberHomeTransition() {
  const navigate = useNavigate();
  const userData = sessionManager.getUserData() || {};

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-8" style={{ background: '#05070D', minHeight: '100vh' }}>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl px-6 py-5"
        style={{
          background: 'linear-gradient(135deg, rgba(8,18,40,0.8) 0%, rgba(5,7,13,0.9) 100%)',
          border: '1px solid rgba(59,130,246,0.1)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 500px 180px at 15% 50%, rgba(124,58,237,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="flex items-center gap-5" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(145deg, #120a2e 0%, #1e1040 100%)',
            border: '1px solid rgba(124,58,237,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: 'white',
            boxShadow: '0 0 20px rgba(124,58,237,0.1), inset 0 1px 1px rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            {userData.name?.[0] || 'J'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
              Javier Demo MVP
            </h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: '1px solid rgba(124,58,237,0.25)', letterSpacing: '0.3px' }}>
                En Transición
              </span>
              <span style={{ background: 'rgba(59,130,246,0.08)', color: '#94A3B8', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: '1px solid rgba(59,130,246,0.15)', letterSpacing: '0.3px' }}>
                Activa tu red
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* GAMIFICATION */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <GamificationMiniBar />
      </motion.div>

      {/* PROGRESS BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          padding: '24px 28px', borderRadius: 16,
          background: 'rgba(8,18,40,0.8)',
          border: '1px solid rgba(124,58,237,0.18)',
        }}
      >
        <h3 style={{ color: 'white', fontWeight: 800, fontSize: 16, margin: '0 0 16px 0' }}>
          Tu proceso de activación de red
        </h3>
        <div className="space-y-3">
          {STEPS.map((step) => (
            <div key={step.num} className="flex items-center gap-3">
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: step.done ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${step.done ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                color: step.done ? '#93C5FD' : 'rgba(255,255,255,0.3)',
              }}>
                {step.num}
              </div>
              <span style={{ color: step.done ? '#93C5FD' : 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: step.cta ? 700 : 500, flex: 1 }}>
                {step.label}
              </span>
              {step.cta && (
                <motion.button
                  onClick={() => navigate('/onboarding/start')}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
                    color: 'white', border: 'none', borderRadius: 8,
                    padding: '6px 14px', fontWeight: 800, fontSize: 11,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  Activar <ArrowRight size={11} />
                </motion.button>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* AVAILABLE NOW */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
          Disponible Ahora
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: ShoppingBag, label: 'Productos', route: '/dashboard/products', color: '#3b82f6' },
            { icon: Activity, label: 'Actividad', route: '/dashboard/activity', color: '#7C3AED' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.route}
                onClick={() => navigate(item.route)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: 'rgba(8,18,40,0.8)', border: '1px solid rgba(59,130,246,0.1)',
                  borderRadius: 12, padding: '20px 16px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}
              >
                <Icon size={18} style={{ color: '#3b82f6' }} />
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600 }}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* NETWORK PREVIEW — BLURRED */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
          Vista Previa — Red
        </p>
        <div style={{
          padding: '24px', borderRadius: 16,
          background: 'rgba(8,18,40,0.6)',
          border: '1px solid rgba(255,255,255,0.06)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* fake network nodes for visual */}
          <div style={{ opacity: 0.25, pointerEvents: 'none' }}>
            <div className="flex justify-center gap-6 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(59,130,246,0.3)',
                  border: '1px solid rgba(59,130,246,0.4)',
                }} />
              ))}
            </div>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                }} />
              ))}
            </div>
          </div>
          {/* overlay */}
          <div style={{
            position: 'absolute', inset: 0, backdropFilter: 'blur(4px)',
            background: 'rgba(11,15,20,0.7)', borderRadius: 16,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={20} style={{ color: '#A78BFA' }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, margin: 0 }}>
              Red Binaria — Acceso bloqueado
            </p>
            <motion.button
              onClick={() => navigate('/onboarding/start')}
              whileHover={{ scale: 1.05 }}
              style={{
                background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
                color: 'white', border: 'none', borderRadius: 8,
                padding: '8px 18px', fontWeight: 800, fontSize: 12,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Zap size={13} /> Activar acceso de red
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}