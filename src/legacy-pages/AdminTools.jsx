import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wrench, ChevronRight } from 'lucide-react';

export default function AdminTools() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('admin_session') !== 'true') {
      navigate('/admin-access');
    }
  }, [navigate]);

  const tools = [
    { name: 'System Configuration', desc: 'Core system settings', icon: '⚙️' },
    { name: 'Database Tools', desc: 'Data management', icon: '🗄️' },
    { name: 'Performance Metrics', desc: 'System health', icon: '📈' },
    { name: 'Cache Management', desc: 'System optimization', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen bg-vicion-deep">
      <header className="border-b border-white/8 p-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Wrench size={24} style={{ color: '#3b82f6' }} />
          <div>
            <h1 className="text-white font-montserrat font-black text-xl">Admin Tools</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>System management utilities</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool, i) => (
            <div key={i} className="p-6 rounded-xl cursor-pointer transition-all hover:border-vicion-electric/50"
              style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{tool.icon}</div>
              <h3 className="text-white font-semibold text-base mb-2">{tool.name}</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>{tool.desc}</p>
              <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
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