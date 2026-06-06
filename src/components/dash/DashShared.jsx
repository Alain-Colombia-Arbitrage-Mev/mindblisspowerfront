// Shared design tokens and components for the dashboard

export const colors = {
  bg: '#060d1a',
  bgCard: '#0a1628',
  bgCardHover: '#0d1f3c',
  border: 'rgba(59,130,246,0.12)',
  borderHover: 'rgba(59,130,246,0.35)',
  blue: '#1d6ef5',
  electric: '#3b82f6',
  glow: '#60a5fa',
  text: 'rgba(255,255,255,0.85)',
  textMuted: 'rgba(255,255,255,0.4)',
  textDim: 'rgba(255,255,255,0.2)',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
};

export function DCard({ children, className = '', style = {}, neon = false }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, #0a1628, #07101f)',
        border: `1px solid ${neon ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.1)'}`,
        boxShadow: neon ? '0 0 20px rgba(59,130,246,0.06)' : 'none',
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-white font-black text-xl sm:text-2xl mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>{title}</h1>
        {subtitle && <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <div className="text-xs font-bold tracking-[0.15em] mb-3 uppercase" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'Montserrat, sans-serif' }}>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'blue' }) {
  const colors = {
    blue: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    green: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e', border: 'rgba(34,197,94,0.3)' },
    amber: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    red: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    gray: { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' },
  };
  const c = colors[color] || colors.blue;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {children}
    </span>
  );
}

export function DisclaimerBox({ text }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl mt-4"
      style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
        style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>i</div>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{text}</p>
    </div>
  );
}

export function KpiCard({ label, value, sub, icon: Icon, color = '#3b82f6', change }) {
  return (
    <DCard className="p-5" neon>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20` }}>
          <Icon size={17} style={{ color }} />
        </div>
        {change && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
            {change}
          </span>
        )}
      </div>
      <div className="font-black text-2xl text-white mb-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>{value}</div>
      <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{sub}</div>}
    </DCard>
  );
}

export function TableHeader({ cols }) {
  return (
    <div className="grid text-xs font-bold uppercase tracking-wider px-4 py-3"
      style={{ gridTemplateColumns: cols.map(c => c.w || '1fr').join(' '), color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: 'Montserrat, sans-serif' }}>
      {cols.map(c => <div key={c.label}>{c.label}</div>)}
    </div>
  );
}

export function TableRow({ cols, data, even }) {
  return (
    <div className="grid items-center px-4 py-3 transition-colors"
      style={{
        gridTemplateColumns: cols.map(c => c.w || '1fr').join(' '),
        background: even ? 'rgba(255,255,255,0.015)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
      onMouseLeave={e => e.currentTarget.style.background = even ? 'rgba(255,255,255,0.015)' : 'transparent'}
    >
      {data.map((d, i) => <div key={i} className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{d}</div>)}
    </div>
  );
}

export function PrimaryBtn({ children, onClick, small }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 font-semibold rounded-lg transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
        color: 'white',
        padding: small ? '0.4rem 1rem' : '0.625rem 1.5rem',
        fontSize: small ? '0.8rem' : '0.875rem',
        fontFamily: 'Montserrat, sans-serif',
        boxShadow: '0 4px 20px rgba(29,110,245,0.3)',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 30px rgba(29,110,245,0.5)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,110,245,0.3)'}
    >
      {children}
    </button>
  );
}

export function FilterBar({ filters, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {filters.map(f => (
        <button key={f} onClick={() => onChange(f)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: active === f ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
            color: active === f ? '#60a5fa' : 'rgba(255,255,255,0.4)',
            border: `1px solid ${active === f ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.08)'}`,
          }}>
          {f}
        </button>
      ))}
    </div>
  );
}