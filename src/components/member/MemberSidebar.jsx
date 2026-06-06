import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Network, Users, TrendingUp, Mail, DollarSign, Activity, HelpCircle, User, Lock, Zap, Power, Cpu, ShoppingBag, Share2, Wallet, ArrowUpRight, FileText } from 'lucide-react';
import { getUserType, getModuleVisibility, USER_TYPES } from '@/lib/userTypeEngine';
import { motion, AnimatePresence } from 'framer-motion';

const ALL_SECTIONS = [
  {
    section: 'OPERACIONES',
    items: [
      { icon: Home, label: 'Home', to: '/dashboard/home', module: 'home' },
      { icon: Cpu, label: 'War Room', to: '/dashboard/war-room', module: 'war_room' },
      { icon: Network, label: 'Red Binaria', to: '/dashboard/network', module: 'network' },
      { icon: Users, label: 'Equipo Pro', to: '/dashboard/team', module: 'team' },
    ]
  },
  {
    section: 'RED & CRECIMIENTO',
    items: [
      { icon: Share2, label: 'Referidos', to: '/dashboard/referrals', module: 'referrals' },
    ]
  },
  {
    section: 'INTELIGENCIA',
    items: [
      { icon: Zap, label: 'IA Asesor', to: '/dashboard/ai', module: 'ai' },
      { icon: Power, label: 'Auto Mode', to: '/dashboard/auto', module: 'auto' },
      { icon: DollarSign, label: 'Bonuses', to: '/dashboard/bonificaciones', module: 'bonificaciones' },
      { icon: TrendingUp, label: 'Rango Pro', to: '/dashboard/rank', module: 'rank' },
      { icon: Activity, label: 'Actividad', to: '/dashboard/activity', module: 'activity' },
    ]
  },
  {
    section: 'FINANZAS',
    items: [
      { icon: Wallet, label: 'Retiros', to: '/dashboard/withdrawals', module: 'withdrawals' },
    ]
  },
  {
    section: 'COMUNICACIÓN',
    items: [
      { icon: Mail, label: 'Mensajes', to: '/dashboard/communications', module: 'communications' },
    ]
  },
  {
    section: 'ACCESO',
    items: [
      { icon: ShoppingBag, label: 'Productos', to: '/dashboard/products', module: 'products' },
      { icon: User, label: 'Perfil', to: '/dashboard/profile', module: 'profile' },
      { icon: HelpCircle, label: 'Soporte', to: '/dashboard/support', module: 'support' },
      { icon: FileText, label: 'Centro Legal', to: '/dashboard/legal', module: 'legal' },
    ]
  },
];

function LockedItem({ item, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      title="Activa tu red para desbloquear"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8,
        opacity: 0.3, cursor: 'not-allowed',
      }}
    >
      <item.icon size={14} style={{ color: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.18)', flex: 1 }}>{item.label}</span>
      <Lock size={9} style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
    </motion.div>
  );
}

export default function MemberSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const userType = getUserType();
  const { locked } = getModuleVisibility(userType);
  const isLocked = (module) => locked.includes(module);

  const typeColors = {
    [USER_TYPES.DIRECT]: '#3b82f6',
    [USER_TYPES.TRANSITION]: '#7C3AED',
    [USER_TYPES.NETWORK]: '#3b82f6',
  };
  const typeLabel = {
    [USER_TYPES.DIRECT]: 'Acceso Directo',
    [USER_TYPES.TRANSITION]: 'En Transición',
    [USER_TYPES.NETWORK]: 'Acceso Red',
  };

  const accentColor = typeColors[userType];
  let itemCounter = 0;

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-56 h-full border-r flex flex-col"
      style={{ borderColor: 'rgba(59,130,246,0.08)', background: '#080e1a' }}
    >
      {/* BRAND */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-5 py-5 border-b"
        style={{ borderColor: 'rgba(59,130,246,0.08)' }}
      >
        <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 14, letterSpacing: '1px', marginBottom: 6 }}>
          VICION
        </div>
        <motion.div
          animate={{ boxShadow: [`0 0 0px ${accentColor}40`, `0 0 8px ${accentColor}30`, `0 0 0px ${accentColor}40`] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            display: 'inline-block',
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}40`,
            borderRadius: 20, padding: '2px 8px',
          }}
        >
          <span style={{ color: accentColor, fontSize: 8, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {typeLabel[userType]}
          </span>
        </motion.div>
      </motion.div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {ALL_SECTIONS.map((section, sectionIdx) => {
          const hasVisible = section.items.some(i => !isLocked(i.module));
          if (!hasVisible && userType === USER_TYPES.DIRECT) return null;

          return (
            <motion.div
              key={sectionIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + sectionIdx * 0.05 }}
              className="mb-5"
            >
              <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.15)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4, paddingLeft: '12px' }}>
                {section.section}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const delay = 0.15 + (itemCounter++ * 0.04);
                  const locked_item = isLocked(item.module);
                  if (locked_item) return <LockedItem key={item.to} item={item} delay={delay} />;

                  const isActive = location.pathname.startsWith(item.to);
                  return (
                    <Link key={item.to} to={item.to} style={{ textDecoration: 'none', display: 'block' }}>
                      <motion.div
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay, duration: 0.3 }}
                        whileHover={!isActive ? { x: 2, background: 'rgba(59,130,246,0.06)' } : {}}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg"
                        style={{
                          background: isActive ? `${accentColor}15` : 'transparent',
                          color: isActive ? accentColor : 'rgba(255,255,255,0.45)',
                          borderLeft: `2px solid ${isActive ? accentColor : 'transparent'}`,
                          paddingLeft: '11px',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-active"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: `${accentColor}10`,
                              borderRadius: 8,
                              zIndex: 0,
                            }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                          />
                        )}
                        <item.icon size={14} style={{ flexShrink: 0, position: 'relative', zIndex: 1 }} />
                        <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, position: 'relative', zIndex: 1 }}>
                          {item.label}
                        </span>
                        {isActive && (
                          <motion.div
                            layoutId="sidebar-dot"
                            style={{ width: 4, height: 4, borderRadius: '50%', background: accentColor, marginLeft: 'auto', position: 'relative', zIndex: 1, flexShrink: 0 }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {/* UPGRADE CTA */}
        {userType !== USER_TYPES.NETWORK && (
          <motion.button
            onClick={() => navigate('/onboarding/start')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', marginTop: 8,
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.25)',
              color: '#93C5FD', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}
          >
            <ArrowUpRight size={11} /> Activar acceso completo
          </motion.button>
        )}
      </nav>

      {/* FOOTER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="px-4 py-4 border-t"
        style={{ borderColor: 'rgba(59,130,246,0.08)' }}
      >
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', textAlign: 'center', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 2px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>VICION POWER</p>
          <p style={{ margin: 0, fontWeight: 500 }}>Member Platform v2.0</p>
        </div>
      </motion.div>
    </motion.aside>
  );
}