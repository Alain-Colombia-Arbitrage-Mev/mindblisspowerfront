import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import MemberTopbar from './MemberTopbar';
import MemberSidebar from './MemberSidebar';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { sessionManager } from '@/lib/sessionManager';
import { getUserType, isRouteAccessible } from '@/lib/userTypeEngine';
import { trackRouteVisit } from '@/lib/gamificationEngine';
import PageTransition from '@/components/ux/PageTransition';
import AchievementUnlockToast from '@/components/gamification/AchievementUnlockToast';

export default function MemberLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Mobile drawer state — only affects mobile, zero desktop impact
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth + session check on mount
  useEffect(() => {
    const valid = sessionManager.validate();
    if (!valid || !sessionManager.isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }
    const status = sessionManager.getStatus();
    if (status === 'onboarding') {
      navigate('/onboarding/resume', { replace: true });
      return;
    }
    const userData = sessionManager.getUserData();
    if (userData) setUser(userData);
    setLoading(false);
  }, [navigate]);

  // Route guard + route tracker for gamification
  useEffect(() => {
    if (loading) return;
    const userType = getUserType();
    if (!isRouteAccessible(location.pathname, userType)) {
      navigate('/dashboard/home', { replace: true });
      return;
    }
    trackRouteVisit(location.pathname);
    // Close mobile menu on navigation
    setMobileMenuOpen(false);
  }, [location.pathname, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#060e1c' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)' }}>Cargando...</div>
      </div>
    );
  }

  const handleLogout = () => {
    sessionManager.logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#060e1c' }}>
      <MemberTopbar
        user={user}
        onLogout={handleLogout}
        onMobileMenuToggle={() => setMobileMenuOpen(v => !v)}
      />

      <div className="flex flex-1 overflow-hidden" style={{ position: 'relative' }}>

        {/* ── DESKTOP SIDEBAR — unchanged, always visible ≥768px ── */}
        <div className="hidden md:flex h-full">
          <MemberSidebar />
        </div>

        {/* ── MOBILE DRAWER OVERLAY — only renders on <768px ──────
            Uses AnimatePresence so it unmounts fully when closed.
            Backdrop click closes it. Zero impact on desktop layout. */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="mobile-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden"
                style={{
                  position: 'fixed', inset: 0, zIndex: 40,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(2px)',
                }}
              />
              {/* Drawer */}
              <motion.div
                key="mobile-drawer"
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="md:hidden"
                style={{
                  position: 'fixed', top: 0, left: 0, bottom: 0,
                  width: 240, zIndex: 50,
                }}
              >
                <MemberSidebar />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT — unchanged */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>

        {/* PHASE 11: Member session validation badge */}
        <div style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          fontSize: 7,
          color: 'rgba(255,255,255,0.2)',
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          padding: '6px 8px',
          borderRadius: 6,
          zIndex: 1,
          pointerEvents: 'none',
        }}>
          <div>USER AUTH: {localStorage.getItem('user_auth') === 'true' ? '✓' : '✗'}</div>
          <div>ROLE: {localStorage.getItem('user_role') || 'none'}</div>
        </div>
      </div>

      <AchievementUnlockToast />
    </div>
  );
}