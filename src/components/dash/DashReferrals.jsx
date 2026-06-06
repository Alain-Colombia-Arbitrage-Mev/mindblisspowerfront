import { useState } from 'react';
import { Copy, Share2, CheckCircle, Users, TrendingUp, UserPlus, Mail, MessageSquare } from 'lucide-react';

const C = ({ children, style }) => (
  <div style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 20, ...style }}>
    {children}
  </div>
);
const Label = ({ children }) => (
  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: 14 }}>
    {children}
  </div>
);

const referrals = [
  { name: 'Carlos M.', joined: '2025-01-22', country: 'Colombia', status: 'Active', rank: 'Silver', side: 'Left', contribution: 820 },
  { name: 'Ana García', joined: '2025-02-08', country: 'Mexico', status: 'Active', rank: 'Bronze', side: 'Right', contribution: 640 },
  { name: 'James T.', joined: '2025-03-21', country: 'USA', status: 'Inactive', rank: 'Bronze', side: 'Left', contribution: 120 },
  { name: 'María S.', joined: '2025-04-14', country: 'Argentina', status: 'Active', rank: 'Bronze', side: 'Left', contribution: 380 },
  { name: 'Pedro L.', joined: '2025-06-05', country: 'Peru', status: 'Active', rank: 'Bronze', side: 'Right', contribution: 290 },
];

export default function DashReferrals() {
  const [copied, setCopied] = useState(false);
  const link = 'https://vicionpower.com/join?ref=VP10234';

  const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const checklist = [
    { step: 'Registered', done: true },
    { step: 'Profile Completed', done: true },
    { step: 'Activation Payment', done: true },
    { step: 'Placed in Structure', done: true },
    { step: 'Active Status', done: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 4 }}>Referrals</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Direct network growth and invitation management</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Invited', value: '18' },
          { label: 'Registered', value: '16' },
          { label: 'Activated', value: '14' },
          { label: 'Conversion Rate', value: '87.5%' },
        ].map(s => (
          <div key={s.label} style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 28, marginBottom: 4 }}>{s.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, flexWrap: 'wrap' }}>
        {/* Referrals table */}
        <C>
          <Label>Direct Referrals</Label>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Name', 'Country', 'Joined', 'Status', 'Rank', 'Side', 'Contribution'].map(h => (
                    <th key={h} style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 10, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={r.name} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>{r.name[0]}</div>
                        <span style={{ color: 'white', fontWeight: 500 }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 10px', color: 'rgba(255,255,255,0.5)' }}>{r.country}</td>
                    <td style={{ padding: '10px 10px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{r.joined}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{ fontSize: 10, color: r.status === 'Active' ? '#34d399' : 'rgba(255,255,255,0.3)', background: r.status === 'Active' ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '10px 10px', color: 'rgba(255,255,255,0.5)' }}>{r.rank}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{ fontSize: 10, color: r.side === 'Left' ? '#3b82f6' : '#60a5fa', fontWeight: 600 }}>{r.side}</span>
                    </td>
                    <td style={{ padding: '10px 10px', color: 'white', fontWeight: 600 }}>{r.contribution.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </C>

        {/* Right panel: invite tools + checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <C>
            <Label>Invitation Tools</Label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input readOnly value={link} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'monospace', minWidth: 0 }} />
              <button onClick={copy} style={{ padding: '8px 14px', borderRadius: 8, background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(59,130,246,0.25)', border: copied ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(59,130,246,0.4)', cursor: 'pointer', color: copied ? '#34d399' : 'white', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {copied ? <><CheckCircle size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['WhatsApp', '#25D366', MessageSquare], ['Email', '#3b82f6', Mail], ['SMS', '#f59e0b', MessageSquare], ['Share', '#a78bfa', Share2]].map(([label, color, Icon]) => (
                <button key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 10, background: `${color}12`, border: `1px solid ${color}30`, cursor: 'pointer', color: 'white', fontSize: 12, fontWeight: 500 }}>
                  <Icon size={14} style={{ color }} /> {label}
                </button>
              ))}
            </div>
          </C>

          <C>
            <Label>Referral Onboarding (Latest)</Label>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>Tracking: Pedro L.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {checklist.map(item => (
                <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: item.done ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)', border: item.done ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.done && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399' }} />}
                  </div>
                  <span style={{ color: item.done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', fontSize: 12 }}>{item.step}</span>
                </div>
              ))}
            </div>
          </C>
        </div>
      </div>
    </div>
  );
}