import { useState } from 'react';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';

export default function ContentScheduler() {
  const [contents, setContents] = useState([
    { id: 1, title: 'Growth Milestone Post', type: 'image', status: 'scheduled', date: '2026-04-15', platform: 'instagram' },
    { id: 2, title: 'Community Highlight Reel', type: 'video', status: 'scheduled', date: '2026-04-16', platform: 'tiktok' },
    { id: 3, title: 'Educational Series Ep.3', type: 'video', status: 'published', date: '2026-04-10', platform: 'youtube' },
    { id: 4, title: 'Market Update Thread', type: 'text', status: 'draft', date: '2026-04-20', platform: 'x' },
  ]);

  const [showForm, setShowForm] = useState(false);

  const platformColors = {
    instagram: '#ec4899',
    tiktok: '#000000',
    youtube: '#ef4444',
    x: '#000000',
  };

  const deleteContent = (id) => {
    setContents(contents.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Content Queue</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-vicion-electric text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-all"
        >
          <Plus size={16} /> New Content
        </button>
      </div>

      {showForm && (
        <div className="p-6 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm mb-2 block">Title</label>
                <input type="text" placeholder="Content title" className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm" />
              </div>
              <div>
                <label className="text-white text-sm mb-2 block">Platform</label>
                <select className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm">
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>YouTube</option>
                  <option>X (Twitter)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white text-sm mb-2 block">Type</label>
                <select className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm">
                  <option>Image</option>
                  <option>Video</option>
                  <option>Carousel</option>
                  <option>Text</option>
                </select>
              </div>
              <div>
                <label className="text-white text-sm mb-2 block">Schedule Date</label>
                <input type="date" className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-white text-sm mb-2 block">Content Description</label>
              <textarea placeholder="Add content description..." rows={3} className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm resize-none" />
            </div>
            <button type="submit" className="w-full py-2 bg-vicion-electric text-white rounded-lg font-semibold text-sm hover:bg-blue-500 transition-all">
              Schedule Content
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {contents.map(content => (
          <div key={content.id} className="p-4 rounded-lg flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div style={{ width: 12, height: 12, borderRadius: 4, background: platformColors[content.platform] }} />
                <div>
                  <p className="text-white text-sm font-medium">{content.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                    {content.type} • {content.platform}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <Clock size={12} /> {content.date}
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded" style={{
                background: content.status === 'published' ? 'rgba(16,185,129,0.2)' : content.status === 'scheduled' ? 'rgba(59,130,246,0.2)' : 'rgba(107,114,128,0.2)',
                color: content.status === 'published' ? '#10b981' : content.status === 'scheduled' ? '#3b82f6' : '#9ca3af',
              }}>
                {content.status}
              </span>
              <button onClick={() => deleteContent(content.id)} className="text-white/30 hover:text-red-400 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}