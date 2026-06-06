import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

export default function AdminViral() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('admin_session') !== 'true') {
      navigate('/admin-access');
    }
  }, [navigate]);

  const campaigns = [
    { name: 'Campaign A', type: 'Video', status: 'Running', reach: '2.4M' },
    { name: 'Campaign B', type: 'Social', status: 'Running', reach: '1.8M' },
    { name: 'Campaign C', type: 'Content', status: 'Paused', reach: '890K' },
    { name: 'Campaign D', type: 'Influencer', status: 'Planning', reach: '—' },
  ];

  return (
    <div className="min-h-screen bg-vicion-deep">
      <header className="border-b border-white/8 p-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Flame size={24} style={{ color: '#f59e0b' }} />
          <div>
            <h1 className="text-white font-montserrat font-black text-xl">Viral Campaigns</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Content distribution & engagement control</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>Campaign</th>
                <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>Type</th>
                <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>Status</th>
                <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>Reach</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 12, color: 'white' }}>{camp.name}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.7)' }}>{camp.type}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{
                      background: camp.status === 'Running' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                      color: camp.status === 'Running' ? '#10b981' : '#9ca3af',
                      padding: '4px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {camp.status}
                    </span>
                  </td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.7)' }}>{camp.reach}</td>
                </tr>
              ))}
            </tbody>
          </table>
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