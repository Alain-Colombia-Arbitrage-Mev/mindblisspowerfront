import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function AdminAutomation() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('admin_session') !== 'true') {
      navigate('/admin-access');
    }
  }, [navigate]);

  const automations = [
    { name: 'Scheduled Jobs', desc: 'Background task automation', status: 'Active' },
    { name: 'Event Triggers', desc: 'Real-time event handling', status: 'Active' },
    { name: 'Webhook Listeners', desc: 'External integrations', status: 'Configured' },
    { name: 'Batch Processing', desc: 'Bulk operations', status: 'Ready' },
  ];

  return (
    <div className="min-h-screen bg-vicion-deep">
      <header className="border-b border-white/8 p-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Zap size={24} style={{ color: '#10b981' }} />
          <div>
            <h1 className="text-white font-montserrat font-black text-xl">Automation System</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Workflow and trigger management</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-4">
          {automations.map((auto, i) => (
            <div key={i} className="p-6 rounded-xl flex items-center justify-between"
              style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div>
                <h3 className="text-white font-semibold">{auto.name}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{auto.desc}</p>
              </div>
              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                {auto.status}
              </span>
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