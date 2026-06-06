import { useState } from 'react';
import { Plus, Users } from 'lucide-react';

export default function GrowthAudiences() {
  const [audiences, setAudiences] = useState([
    { id: 1, name: 'Early Adopters', size: 1240, criteria: 'First 100 signups', status: 'active' },
    { id: 2, name: 'High Intent', size: 3840, criteria: 'Visited +5 pages', status: 'active' },
    { id: 3, name: 'Cart Abandoners', size: 620, criteria: 'Started activation not completed', status: 'inactive' },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Audience Segments</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-vicion-blue text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition-all">
          <Plus size={14} /> New Segment
        </button>
      </div>

      <div className="space-y-2">
        {audiences.map(aud => (
          <div key={aud.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white text-sm font-medium flex items-center gap-2">
                  <Users size={14} /> {aud.name}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>{aud.criteria}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold text-sm">{aud.size.toLocaleString()}</p>
                <p style={{ color: aud.status === 'active' ? '#10b981' : '#9ca3af', fontSize: 11, marginTop: 2 }}>
                  {aud.status}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}