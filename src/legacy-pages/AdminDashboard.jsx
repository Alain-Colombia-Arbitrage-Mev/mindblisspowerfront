import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import GlobalControlDashboard from '@/components/GlobalControlDashboard';
import AIControlDashboard from '@/components/AIControlDashboard';
import AdminMetrics from '@/components/dash/AdminMetrics';
import GrowthLabDashboard from '@/components/admin/GrowthLabDashboard';
import ViralLoopsEngine from '@/components/admin/ViralLoopsEngine';
import SocialMediaControl from '@/components/admin/SocialMediaControl';
import AutomationEngine from '@/components/admin/AutomationEngine';
import GrowthAnalytics from '@/components/admin/GrowthAnalytics';
import ContentVariations from '@/components/admin/ContentVariations';
import AdminSessionManager from '@/lib/AdminSessionManager';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState('metrics');

  useEffect(() => {
    // Session check on mount
    const session = AdminSessionManager.getCurrentSession();
    if (!session) {
      navigate('/admin-access');
    }
  }, [navigate]);

  const handleLogout = () => {
    AdminSessionManager.clearSession(AdminSessionManager.currentAdmin?.adminId);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-vicion-deep">
      {/* Header with Growth Lab Link */}
      <header className="border-b border-white/8 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={24} style={{ color: '#3b82f6' }} />
            <h1 className="text-white font-montserrat font-black text-xl">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin-growth-lab"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6', textDecoration: 'none' }}
            >
              🧪 Growth Lab
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Panel Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'metrics', label: 'Metrics' },
            { id: 'global', label: 'Global Control' },
            { id: 'ai', label: 'AI Control' },
            { id: 'growth', label: 'Growth Lab' },
            { id: 'viral', label: 'Viral Loops' },
            { id: 'social', label: 'Social Control' },
            { id: 'automation', label: 'Automation' },
            { id: 'analytics', label: 'Growth Analytics' },
            { id: 'content', label: 'Content Variations' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: activePanel === tab.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: activePanel === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                border: activePanel === tab.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Dynamic Panel Rendering */}
        {activePanel === 'metrics' && <AdminMetrics />}
        {activePanel === 'global' && <GlobalControlDashboard />}
        {activePanel === 'ai' && <AIControlDashboard />}
        {activePanel === 'growth' && <GrowthLabDashboard />}
        {activePanel === 'viral' && <ViralLoopsEngine />}
        {activePanel === 'social' && <SocialMediaControl />}
        {activePanel === 'automation' && <AutomationEngine />}
        {activePanel === 'analytics' && <GrowthAnalytics />}
        {activePanel === 'content' && <ContentVariations />}
      </main>
    </div>
  );
}