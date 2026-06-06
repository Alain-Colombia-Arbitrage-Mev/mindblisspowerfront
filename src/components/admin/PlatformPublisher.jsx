import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function PlatformPublisher() {
  const [publishQueue, setPublishQueue] = useState([
    { id: 1, platform: 'Instagram', content: 'Community Growth Announcement', status: 'pending', scheduled: '2026-04-15 10:00' },
    { id: 2, platform: 'TikTok', content: 'Member Testimonial - Ali M.', status: 'published', published: '2026-04-12 14:30' },
    { id: 3, platform: 'YouTube', content: 'Educational Series Episode 3', status: 'published', published: '2026-04-10 09:00' },
    { id: 4, platform: 'X (Twitter)', content: 'Market Analysis Thread', status: 'pending', scheduled: '2026-04-18 08:00' },
  ]);

  const platformConfig = {
    'Instagram': { color: '#ec4899', icon: '📸' },
    'TikTok': { color: '#000000', icon: '🎵' },
    'YouTube': { color: '#ef4444', icon: '📹' },
    'X (Twitter)': { color: '#000000', icon: '𝕏' },
  };

  const publishContent = (id) => {
    setPublishQueue(publishQueue.map(p => 
      p.id === id ? { ...p, status: 'published', published: new Date().toLocaleString() } : p
    ));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {['Instagram', 'TikTok', 'YouTube', 'X (Twitter)'].map(platform => (
          <div key={platform} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{platform}</p>
            <p className="text-white font-bold text-lg mt-2" style={{ color: platformConfig[platform].color }}>
              {platformConfig[platform].icon}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8 }}>
              {publishQueue.filter(p => p.platform === platform && p.status === 'published').length} published
            </p>
          </div>
        ))}
      </div>

      <h3 className="text-white font-semibold">Publishing Queue</h3>

      <div className="space-y-3">
        {publishQueue.map(item => (
          <div key={item.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{item.platform}</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 }}>
                  {item.content}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {item.status === 'published' ? `Published: ${item.published}` : `Scheduled: ${item.scheduled}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.status === 'published' ? (
                  <div className="flex items-center gap-1" style={{ color: '#10b981' }}>
                    <CheckCircle size={16} />
                    <span className="text-xs font-medium">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1" style={{ color: '#f59e0b' }}>
                    <Clock size={16} />
                    <span className="text-xs font-medium">Pending</span>
                  </div>
                )}
                {item.status === 'pending' && (
                  <button
                    onClick={() => publishContent(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-vicion-electric text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition-all"
                  >
                    <Send size={12} /> Publish Now
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}