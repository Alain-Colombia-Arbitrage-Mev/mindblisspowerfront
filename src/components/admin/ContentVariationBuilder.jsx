import { useState } from 'react';
import { Zap } from 'lucide-react';

export default function ContentVariationBuilder({ onAdd, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'headline',
    content: '',
    location: 'hero'
  });

  const contentTypes = [
    { id: 'headline', name: 'Headline', icon: '📝' },
    { id: 'cta', name: 'CTA Button', icon: '🔘' },
    { id: 'description', name: 'Description', icon: '📄' },
    { id: 'social_proof', name: 'Social Proof', icon: '👥' },
  ];

  const locations = [
    { id: 'hero', name: 'Hero Section' },
    { id: 'cta_section', name: 'CTA Section' },
    { id: 'footer', name: 'Footer' },
    { id: 'modal', name: 'Modal' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.content) {
      onAdd({ ...formData, version: 1, status: 'active', performance: { impressions: 0, clicks: 0, ctr: 0 } });
      setFormData({ name: '', type: 'headline', content: '', location: 'hero' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} style={{ color: '#a855f7' }} />
        <h3 className="text-white font-semibold">Create New Variation</h3>
      </div>

      {/* Name */}
      <div>
        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Variation Name
        </label>
        <input
          type="text"
          placeholder="e.g., Hero Headline - Test B"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
        />
      </div>

      {/* Type */}
      <div>
        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Content Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {contentTypes.map(ct => (
            <button
              key={ct.id}
              type="button"
              onClick={() => setFormData({ ...formData, type: ct.id })}
              className="p-3 rounded-lg text-left transition-all text-sm"
              style={{
                background: formData.type === ct.id ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                border: formData.type === ct.id ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,255,255,0.1)',
                color: formData.type === ct.id ? '#a855f7' : 'rgba(255,255,255,0.6)'
              }}
            >
              {ct.icon} {ct.name}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Display Location
        </label>
        <select
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
        >
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div>
        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Content / Text
        </label>
        <textarea
          placeholder={formData.type === 'cta' ? 'Button text (e.g., Get Started Now)' : 'Enter the content text...'}
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={formData.type === 'cta' ? 2 : 4}
          className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
        />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 4 }}>
          {formData.content.length} characters
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: 'rgba(16,185,129,0.2)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: '#10b981',
            cursor: 'pointer'
          }}
        >
          Create Variation
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}