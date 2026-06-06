import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { validateAdminAccess } from '@/lib/AdminRouteGuard';
import { TrendingUp, Zap, BarChart3, Users, Beaker, Share2, Settings, Layers } from 'lucide-react';

const labModules = [
  {
    id: 'campaigns',
    name: 'Campaign Lab',
    description: 'Manage and monitor internal growth campaigns',
    icon: Zap,
    route: '/admin-growth-lab/campaigns',
    color: '#3b82f6'
  },
  {
    id: 'content',
    name: 'Content Lab',
    description: 'Manage content assets and messaging variations',
    icon: Layers,
    route: '/admin-growth-lab/content',
    color: '#a855f7'
  },
  {
    id: 'experiments',
    name: 'Experiment Lab',
    description: 'Run structured A/B and multivariate experiments',
    icon: Beaker,
    route: '/admin-growth-lab/experiments',
    color: '#10b981'
  },
  {
    id: 'audiences',
    name: 'Audience Lab',
    description: 'Segment and organize user groups and targeting',
    icon: Users,
    route: '/admin-growth-lab/audiences',
    color: '#fb923c'
  },
  {
    id: 'automation',
    name: 'Automation Lab',
    description: 'Build trigger-condition-action workflows',
    icon: Zap,
    route: '/admin-growth-lab/automation',
    color: '#06b6d4'
  },
  {
    id: 'social',
    name: 'Social Lab',
    description: 'Internal social operations and content planning',
    icon: Share2,
    route: '/admin-growth-lab/social',
    color: '#f43f5e'
  },
  {
    id: 'analytics',
    name: 'Analytics Lab',
    description: 'Centralize growth measurement and insights',
    icon: BarChart3,
    route: '/admin-growth-lab/analytics',
    color: '#06b6d4'
  },
  {
    id: 'control-center',
    name: 'Control Center',
    description: 'Command layer and operations overview',
    icon: Settings,
    route: '/admin-growth-lab/control-center',
    color: '#8b5cf6'
  },
];

export default function AdminGrowthLab() {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!validateAdminAccess()) {
      navigate('/admin-access');
      return;
    }
    setHasAccess(true);
  }, [navigate]);

  if (!hasAccess) return null;

  return (
    <div className="min-h-screen bg-vicion-deep">
      {/* Header */}
      <header className="border-b border-white/8 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={24} style={{ color: '#3b82f6' }} />
            <h1 className="text-white font-montserrat font-black text-2xl">Growth Lab</h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
            Internal growth experimentation and campaign management system
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {labModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.id}
                to={module.route}
                className="p-6 rounded-xl transition-all hover:scale-105 active:scale-98"
                style={{
                  background: 'rgba(13,31,60,0.6)',
                  border: `1px solid rgba(${module.color.match(/\d+/g).slice(0, 3).join(',')},0.2)`,
                  textDecoration: 'none',
                  display: 'block'
                }}
              >
                <Icon size={28} style={{ color: module.color, marginBottom: 12 }} />
                <h3 className="text-white font-semibold text-sm mb-2">{module.name}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                  {module.description}
                </p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}