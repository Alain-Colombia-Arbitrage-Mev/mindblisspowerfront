import { useState, useRef, useEffect } from 'react';
import useAdminSession from '@/hooks/useAdminSession';
import ActiveAdminsPanel from '@/components/admin/ActiveAdminsPanel';
import { Link, useLocation, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { validateAdminAccess } from '@/lib/AdminRouteGuard';
import { useSimulation } from '@/lib/SimulationEngine';
import {
  LogOut, Menu, X, BarChart3, Users, Briefcase, CreditCard, Shield,
  Headphones, Zap, Settings, ClipboardList, Activity, Bell, Search,
  ChevronRight, Plus, CheckSquare, MessageSquare, FileText, UserCheck,
  AlertTriangle, Globe, Lock, TrendingUp, Brain, Radar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_GROUPS = [
  {
    label: 'OPERACIONES',
    items: [
      { icon: Radar, label: 'War Room', to: '/admin-dashboard/war-room' },
      { icon: BarChart3, label: 'Overview', to: '/admin-dashboard/overview' },
      { icon: Activity, label: 'Control Center', to: '/admin-dashboard/control-center' },
      { icon: ClipboardList, label: 'Audit', to: '/admin-dashboard/audit' },
      { icon: ClipboardList, label: 'Forensic Audit', to: '/admin-dashboard/forensic-audit' },
    ]
  },
  {
    label: 'PERSONAS',
    items: [
      { icon: Users, label: 'CRM', to: '/admin-dashboard/crm' },
      { icon: UserCheck, label: 'Participants', to: '/admin-dashboard/participants' },
      { icon: Shield, label: 'Leaders', to: '/admin-dashboard/leaders' },
      { icon: Lock, label: 'Permissions', to: '/admin-dashboard/permissions' },
      { icon: Radar, label: 'Network Intervention', to: '/admin-dashboard/network-intervention' },
    ]
  },
  {
    label: 'FINANZAS',
    items: [
      { icon: Briefcase, label: 'Investments', to: '/admin-dashboard/investments' },
      { icon: CreditCard, label: 'Payments', to: '/admin-dashboard/payments' },
      { icon: Headphones, label: 'Support', to: '/admin-dashboard/support' },
    ]
  },
  {
    label: 'INTELIGENCIA',
    items: [
      { icon: Zap, label: 'Marketing', to: '/admin-dashboard/marketing' },
      { icon: TrendingUp, label: 'Analytics', to: '/admin-dashboard/analytics' },
      { icon: Brain, label: 'AI Brain', to: '/admin-dashboard/ai-brain' },
      { icon: Zap, label: 'AI Copilot', to: '/admin-dashboard/copilot' },
      { icon: Activity, label: 'Auto Mode', to: '/admin-dashboard/auto-mode' },
    ]
  },
  {
    label: 'CONFIGURACIÓN',
    items: [
      { icon: Settings, label: 'Settings', to: '/admin-dashboard/settings' },
      { icon: Shield, label: 'Device Management', to: '/admin-dashboard/device-management' },
    ]
  },
];

const QUICK_ACTIONS = [
  { icon: FileText, label: 'New Participant Note', color: '#3b82f6' },
  { icon: Headphones, label: 'New Support Case', color: '#fb923c' },
  { icon: CheckSquare, label: 'Verify Payment', color: '#10b981' },
  { icon: UserCheck, label: 'Assign Advisor', color: '#8b5cf6' },
  { icon: MessageSquare, label: 'New Internal Task', color: '#06b6d4' },
];

const NOTIFICATIONS = [
  { text: '8 payments awaiting review', severity: 'critical', time: '5m ago' },
  { text: '3 leader compliance violations', severity: 'critical', time: '18m ago' },
  { text: '15 identity verifications pending', severity: 'warning', time: '1h ago' },
  { text: '5 support cases aging >3 days', severity: 'warning', time: '2h ago' },
  { text: '14 leader applications pending', severity: 'info', time: '3h ago' },
];

const SEV_COLOR = { critical: '#ef4444', warning: '#fb923c', info: '#3b82f6' };

// War Room route validation
const isWarRoomRoute = (pathname) => pathname.includes('war-room');

function getBreadcrumbs(pathname) {
  const segments = pathname.replace('/admin-dashboard', '').split('/').filter(Boolean);
  const crumbs = [{ label: 'Admin', to: '/admin-dashboard/overview' }];
  const labelMap = {
    'war-room': 'War Room', overview: 'Overview', crm: 'CRM', participants: 'Participants',
    investments: 'Investments', payments: 'Payments', leaders: 'Leaders',
    permissions: 'Permissions', roles: 'Permissions', support: 'Support',
    marketing: 'Marketing', campaigns: 'Campaigns', content: 'Content',
    experiments: 'Experiments', audiences: 'Audiences', automation: 'Automation',
    analytics: 'Analytics', 'command-center': 'Command Center',
    'control-center': 'Control Center', audit: 'Audit', settings: 'Settings',
    'ip-management': 'IP Management', 'device-management': 'Device Management', 'forensic-audit': 'Forensic Audit',
  };
  let path = '/admin-dashboard';
  segments.forEach(seg => {
    path += '/' + seg;
    crumbs.push({ label: labelMap[seg] || seg, to: path });
  });
  return crumbs;
}

// Guard wrapper — checks ONLY admin session
function AdminLayoutGuard({ onLogout }) {
  // PHASE 6: Do not read member session keys
  const isAdmin = localStorage.getItem('admin_auth') === 'true';
  const adminRole = localStorage.getItem('admin_role');
  
  // PHASE 3: Allow only admin auth
  if (!isAdmin || adminRole !== 'admin') {
    return <Navigate to="/admin-access" replace />;
  }

  return <AdminLayoutContent onLogout={onLogout} />;
}

// Main layout content with all hooks
function AdminLayoutContent({ onLogout }) {
  const { activeSessions, currentSession } = useAdminSession('admin-001', { name: 'Current Admin', email: 'admin@mindblisspower.com', role: 'admin' });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const qaRef = useRef(null);

  useEffect(() => {
    // PHASE 3: Validate admin auth only once on mount, do NOT re-check on route change
    const isAdmin = localStorage.getItem('admin_auth') === 'true';
    const adminRole = localStorage.getItem('admin_role');
    
    if (!isAdmin || adminRole !== 'admin') {
      navigate('/admin-access', { replace: true });
      return;
    }
    setCanGoBack(window.history.length > 1);
  }, [navigate]);

  const isActive = (to) => {
    if (to.includes('war-room')) return isWarRoomRoute(location.pathname);
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  const criticalCount = NOTIFICATIONS.filter(n => n.severity === 'critical').length;
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const sim = useSimulation();

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (qaRef.current && !qaRef.current.contains(e.target)) setQaOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Ensure War Room always has a valid route
  if (isWarRoomRoute(location.pathname) && !location.pathname.includes('war-room/multi')) {
    // Redirect to proper war-room route
    if (location.pathname === '/admin-dashboard/war-room') {
      window.history.replaceState(null, '', '/admin-dashboard/war-room/multi');
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#060e1c' }}>
      <ActiveAdminsPanel activeSessions={activeSessions} />

      {/* ── SIDEBAR ─────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 0, opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-shrink-0 overflow-hidden border-r border-white/8 flex flex-col"
        style={{ background: 'rgba(4,10,22,0.95)', minHeight: 0 }}
      >
        <div style={{ width: 240 }} className="flex flex-col h-full">
          {/* Brand */}
          <div className="px-6 py-5 border-b border-white/8 flex-shrink-0">
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 15, letterSpacing: 2 }}>VICION</div>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', color: '#3b82f6', marginTop: 2 }}>OPERATIONS CONTROL</div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {NAV_GROUPS.map((group, gi) => (
              <div key={gi} className="mb-5">
                <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', padding: '0 12px 6px', textTransform: 'uppercase' }}>
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item, i) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);
                    return (
                      <Link key={i} to={item.to} style={{ textDecoration: 'none' }}>
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer"
                          style={{ background: active ? 'rgba(59,130,246,0.15)' : 'transparent', color: active ? '#3b82f6' : 'rgba(255,255,255,0.5)' }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                          <Icon size={13} />
                          <span style={{ fontSize: 12, fontWeight: active ? 700 : 400 }}>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* System status dot */}
          <div className="px-5 py-3 border-t border-white/8 flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600 }}>ALL SYSTEMS OPERATIONAL</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sim.running ? '#3b82f6' : '#374151', boxShadow: sim.running ? '0 0 4px #3b82f6' : 'none', transition: 'all 0.4s ease' }} />
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em' }}>
                {sim.running ? 'SIM ENGINE ACTIVE' : 'SIM ENGINE IDLE'}
              </span>
            </div>

            {/* PHASE 11: Admin session validation badge */}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>
              <div>ADMIN AUTH: {localStorage.getItem('admin_auth') === 'true' ? '✓' : '✗'}</div>
              <div>ROLE: {localStorage.getItem('admin_role') || 'none'}</div>
            </div>
          </div>

          {/* Logout */}
          <div className="px-3 pb-4 flex-shrink-0">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all font-semibold"
              style={{ color: '#ef4444', fontSize: 11, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
              title="Salir del panel administrativo"
            >
              <LogOut size={13} />
              <span>Salir del Panel</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ── MAIN ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOP BAR ─────────────────────────── */}
        <header className="flex-shrink-0 flex items-center gap-4 px-6 py-3 border-b border-white/8"
          style={{ background: 'rgba(4,10,22,0.95)', height: 56, zIndex: 50 }}>

          {/* Back Button */}
          <button
            onClick={() => {
              if (canGoBack) window.history.back();
              else navigate('/admin-dashboard/overview');
            }}
            className="p-1.5 rounded-lg transition-all flex-shrink-0 hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            title="Go back or return to overview"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Toggle Sidebar */}
          <button onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded-lg transition-all flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)' }}>
            <Menu size={15} />
          </button>

          {/* Breadcrumb — all clickable */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {breadcrumbs.map((crumb, i) => {
              const isActive = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={10} style={{ color: 'rgba(255,255,255,0.2)' }} />}
                  <Link
                    to={crumb.to}
                    className="transition-colors hover:text-white"
                    style={{
                      color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                      fontSize: 11,
                      fontWeight: isActive ? 700 : 400,
                      textDecoration: 'none',
                    }}
                    title={`Navigate to ${crumb.label}`}
                  >
                    {crumb.label}
                  </Link>
                </span>
              );
            })}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs relative mx-4">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Search participants, payments, cases…"
              className="w-full pl-8 pr-4 py-1.5 rounded-lg text-white placeholder-white/25 focus:outline-none text-xs"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">

            {/* Quick Actions */}
            <div className="relative" ref={qaRef}>
              <button onClick={() => setQaOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'rgba(59,130,246,0.18)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', fontSize: 11 }}>
                <Plus size={12} /> Quick Action
              </button>
              <AnimatePresence>
                {qaOpen && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden z-50"
                    style={{ background: 'rgba(8,16,36,0.98)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', padding: '12px 14px 6px' }}>QUICK ACTIONS</p>
                    {QUICK_ACTIONS.map((qa, i) => {
                      const Icon = qa.icon;
                      return (
                        <button key={i} onClick={() => setQaOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left hover:bg-white/5"
                          style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${qa.color}20` }}>
                            <Icon size={11} style={{ color: qa.color }} />
                          </div>
                          {qa.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(v => !v)}
                className="relative p-2 rounded-lg transition-all"
                style={{ background: notifOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                <Bell size={14} />
                {criticalCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
                    style={{ background: '#ef4444', fontSize: 8, fontWeight: 900 }}>{criticalCount}</span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden z-50"
                    style={{ background: 'rgba(8,16,36,0.98)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', padding: '12px 14px 6px' }}>ACTIVE ALERTS</p>
                    {NOTIFICATIONS.map((n, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: SEV_COLOR[n.severity] }} />
                        <div className="flex-1 min-w-0">
                          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, margin: 0 }}>{n.text}</p>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '2px 0 0' }}>{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Admin identity */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(59,130,246,0.3)', color: '#3b82f6' }}>A</div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, margin: 0 }}>Super Admin</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>GLOBAL ACCESS</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── CONTENT ─────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-8" style={{ background: 'rgba(6,14,28,0.8)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout(props) {
  return <AdminLayoutGuard {...props} />;
}