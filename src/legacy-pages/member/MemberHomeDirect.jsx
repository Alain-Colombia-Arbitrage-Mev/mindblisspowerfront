import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Activity, User, HelpCircle, ArrowRight, Lock, Zap, Network, Users, DollarSign, TrendingUp } from 'lucide-react';
import { sessionManager } from '@/lib/sessionManager';
import GamificationMiniBar from '@/components/gamification/GamificationMiniBar';

const LOCKED_MODULES = [
  { label: 'Red Binaria', desc: 'Construye tu estructura de red' },
  { label: 'Equipo Pro', desc: 'Gestiona tu equipo de líderes' },
  { label: 'Bonificaciones', desc: 'Ciclos, binario y referidos' },
  { label: 'Ranking', desc: 'Escala posiciones en el sistema' },
];

export default function MemberHomeDirect() {
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
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 500px 180px at 15% 50%, rgba(59,130,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="flex items-center gap-5" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(145deg, #0d1f3c 0%, #1a2744 100%)',
            border: '1px solid rgba(59,130,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: 'white',
            boxShadow: '0 0 20px rgba(59,130,246,0.12), inset 0 1px 1px rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            {userData.name?.[0] || 'J'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
              Javier Demo MVP
            </h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: 'rgba(59,130,246,0.1)', color: '#93C5FD', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: '1px solid rgba(59,130,246,0.25)', letterSpacing: '0.3px' }}>
                Acceso Directo
              </span>
              <span style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: '1px solid rgba(124,58,237,0.25)', letterSpacing: '0.3px' }}>
                {userData.planLabel || 'Básico'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* GAMIFICATION */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <GamificationMiniBar />
      </motion.div>

      {/* QUICK ACCESS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>Tu Acceso</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: ShoppingBag, label: 'Productos', route: '/dashboard/products', color: '#3b82f6' },
            { icon: Activity, label: 'Actividad', route: '/dashboard/activity', color: '#3b82f6' },
            { icon: User, label: 'Perfil', route: '/dashboard/profile', color: '#7C3AED' },
            { icon: HelpCircle, label: 'Soporte', route: '/dashboard/support', color: '#3b82f6' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.route}
                onClick={() => navigate(item.route)}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: 'rgba(8,18,40,0.8)',
                  border: '1px solid rgba(59,130,246,0.1)',
                  borderRadius: 12, padding: '20px 16px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 8,
                }}
              >
                <Icon size={18} style={{ color: '#3b82f6' }} />
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600 }}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* UPGRADE BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          padding: '24px 28px',
          borderRadius: 16,
          background: 'rgba(8,18,40,0.8)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Zap size={20} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <h3 style={{ color: 'white', fontWeight: 800, fontSize: 16, margin: '0 0 6px 0' }}>
                Activa tu red y multiplica tus beneficios
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                Con acceso de red desbloqueas bonificaciones, equipo, red binaria, IA asesora y más herramientas de crecimiento.
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => navigate('/onboarding/start')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
              color: 'white', border: 'none', borderRadius: 10,
              padding: '10px 20px', fontWeight: 800, fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap', flexShrink: 0,
              boxShadow: '0 6px 20px rgba(59,130,246,0.3)',
            }}
          >
            Activar acceso <ArrowRight size={14} />
          </motion.button>
        </div>
      </motion.div>

      {/* LOCKED MODULES PREVIEW */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
          Módulos con Acceso de Red
        </p>
        <div className="grid grid-cols-2 gap-3">
          {LOCKED_MODULES.map((mod, i) => (
            <motion.div
              key={i}
              style={{
                padding: '16px 18px', borderRadius: 12,
                background: 'rgba(8,18,40,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                position: 'relative', overflow: 'hidden',
                filter: 'blur(0)',
              }}
            >
              {/* blur overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                backdropFilter: 'blur(2px)',
                background: 'rgba(11,15,20,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 12,
              }}>
                <Lock size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
              <div className="flex items-center gap-3">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i === 0 && <Network size={14} style={{ color: 'rgba(59,130,246,0.5)' }} />}
                  {i === 1 && <Users size={14} style={{ color: 'rgba(59,130,246,0.5)' }} />}
                  {i === 2 && <DollarSign size={14} style={{ color: 'rgba(59,130,246,0.5)' }} />}
                  {i === 3 && <TrendingUp size={14} style={{ color: 'rgba(59,130,246,0.5)' }} />}
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, margin: 0 }}>{mod.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>{mod.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}