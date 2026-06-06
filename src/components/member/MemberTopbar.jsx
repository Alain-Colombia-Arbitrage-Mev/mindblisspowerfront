import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, Settings, Crown, Search, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import platformDataCore from '@/lib/platformDataCore';
import { generateNotifications } from '@/lib/notificationEngine';
import NotificationPanel from './NotificationPanel';

// onMobileMenuToggle: optional — called when hamburger is tapped on mobile.
// Desktop layout/logic/animations are completely unchanged.
export default function MemberTopbar({ user, onLogout, onMobileMenuToggle }) {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');
  const userData = user || JSON.parse(localStorage.getItem('user_data') || '{}');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [simCount, setSimCount] = useState(0);

  const notifications = useMemo(() => generateNotifications(userId), [userId]);
  const unreadCount = notifications.length + simCount;

  // Simulate an occasional incoming notification
  useEffect(() => {
    const t = setTimeout(() => setSimCount(c => Math.min(c + 1, 2)), 12000);
    return () => clearTimeout(t);
  }, []);

  const descendants = platformDataCore.getDescendantsForLeader(userId);
  const networkSize = descendants.length;
  const activeMembers = descendants.filter(d => platformDataCore.getUserById(d.user_id)?.status === 'activo').length;

  const handleLogout = () => {
    localStorage.removeItem('user_auth');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_data');
    onLogout?.();
    navigate('/login', { replace: true });
  };

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex-shrink-0 border-b flex items-center justify-between px-6 py-3"
      style={{
        borderColor: 'rgba(59,130,246,0.12)',
        background: 'linear-gradient(90deg, rgba(4,10,22,0.98) 0%, rgba(8,18,40,0.85) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* LEFT — desktop: unchanged. Mobile: hamburger prepended, stats hidden. */}
      <div className="flex items-center gap-6">

        {/* Hamburger — mobile only, invisible on desktop (md:hidden) */}
        {onMobileMenuToggle && (
          <motion.button
            onClick={onMobileMenuToggle}
            className="md:hidden p-1 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            whileTap={{ scale: 0.88 }}
          >
            <Menu size={20} />
          </motion.button>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <motion.div whileHover={{ rotate: 15, scale: 1.2 }} transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}>
              <Crown size={15} style={{ color: '#3b82f6' }} />
            </motion.div>
            <h1 style={{ color: 'white', fontSize: 13, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
              Javier Demo MVP
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {userData.rank || 'Participante'}
            </span>
            {/* dot + plan — hidden on mobile to save space */}
            <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>•</span>
            <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>
              Plan: {userData.plan || 'Basic'}
            </span>
          </div>
        </div>

        {/* NETWORK STATS — desktop only (hidden on mobile) */}
        <div
          className="hidden md:flex"
          style={{ gap: 16, paddingLeft: 16, borderLeft: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[
            { label: 'RED ACTIVA', value: networkSize, color: '#3b82f6' },
            { label: 'ACTIVOS', value: activeMembers, color: '#3b82f6' },
          ].map((stat, i) => (
            <motion.div key={i} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, margin: '0 0 3px 0', letterSpacing: '0.5px', fontWeight: 700 }}>{stat.label}</p>
              <p style={{ color: stat.color, fontSize: 14, fontWeight: 800, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* RIGHT — desktop: unchanged. Mobile: search hidden, logout text hidden. */}
      <div className="flex items-center gap-3">

        {/* SEARCH — desktop only */}
        <motion.div
          className="hidden md:block"
          animate={{ width: searchFocused ? 240 : 180 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          <input
            type="text"
            placeholder="Buscar en tu red..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 32px',
              borderRadius: 8,
              background: searchFocused ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${searchFocused ? 'rgba(59,130,246,0.45)' : 'rgba(255,255,255,0.08)'}`,
              color: 'white',
              fontSize: '11px',
              outline: 'none',
              transition: 'all 250ms ease',
              boxShadow: searchFocused ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
            }}
          />
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: searchFocused ? '#3b82f6' : 'rgba(255,255,255,0.3)', transition: 'color 200ms ease' }} />
        </motion.div>

        {/* NOTIFICATIONS — always visible */}
        <div style={{ position: 'relative' }}>
          <motion.button
            onClick={() => setShowPanel(v => !v)}
            className="p-2 rounded-lg relative"
            style={{ color: showPanel ? 'white' : 'rgba(255,255,255,0.6)', background: showPanel ? 'rgba(59,130,246,0.12)' : 'none', border: 'none', cursor: 'pointer' }}
            whileHover={{ scale: 1.12, background: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={unreadCount > 0 ? { rotate: [0, -8, 8, -6, 6, 0] } : {}}
              transition={{ duration: 0.6, delay: 1.5, repeat: Infinity, repeatDelay: 6 }}
            >
              <Bell size={17} />
            </motion.div>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
                style={{
                  position: 'absolute', top: -3, right: -3,
                  background: '#3b82f6', color: 'white', fontSize: 9, fontWeight: 800,
                  width: 17, height: 17, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1.5px solid #0B0F14',
                  boxShadow: '0 0 8px rgba(59,130,246,0.5)',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {showPanel && (
              <NotificationPanel
                notifications={notifications}
                onClose={() => setShowPanel(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* SETTINGS — always visible */}
        <motion.button
          onClick={() => navigate('/dashboard/profile')}
          className="p-2 rounded-lg"
          style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
          whileHover={{ scale: 1.12, color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.08)', rotate: 45 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Settings size={17} />
        </motion.button>

        {/* LOGOUT — icon always visible; label hidden on mobile */}
        <motion.button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
          whileHover={{ background: 'rgba(255,255,255,0.09)', scale: 1.03, color: 'rgba(255,255,255,0.7)' }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          <LogOut size={13} />
          <span className="hidden md:inline" style={{ fontSize: 11, fontWeight: 600 }}>Salir</span>
        </motion.button>
      </div>
    </motion.div>
  );
}