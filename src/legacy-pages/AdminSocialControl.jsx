import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Radio } from 'lucide-react';

export default function AdminSocialControl() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('admin_session') !== 'true') {
      navigate('/admin-access');
    }
  }, [navigate]);

  const channels = [
    { name: 'Discord Community', members: '45.2K', status: 'Active', moderation: 'Automated' },
    { name: 'Telegram Channel', members: '38.9K', status: 'Active', moderation: 'Semi-Auto' },
    { name: 'Reddit Community', members: '12.4K', status: 'Active', moderation: 'Manual' },
    { name: 'Twitter/X Feed', members: '89.1K', status: 'Active', moderation: 'Automated' },
  ];

  return (
    <div className="min-h-screen bg-vicion-deep">
      <header className="border-b border-white/8 p-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Radio size={24} style={{ color: '#8b5cf6' }} />
          <div>
            <h1 className="text-white font-montserrat font-black text-xl">Social Control Panel</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Community management and moderation</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-4">
          {channels.map((ch, i) => (
            <div key={i} className="p-6 rounded-xl"
              style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold">{ch.name}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{ch.members} members</p>
                </div>
                <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                  {ch.status}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Moderation:</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{ch.moderation}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Reach', value: '185.6K', icon: '👥' },
            { label: 'Active Discussions', value: '2,340', icon: '💬' },
            { label: 'Moderation Queue', value: '12', icon: '⚠️' },
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-xl text-center"
              style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 6 }}>{stat.label}</p>
              <p style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <Link to="/admin-dashboard" style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none' }}>
            ← Back to Admin Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}