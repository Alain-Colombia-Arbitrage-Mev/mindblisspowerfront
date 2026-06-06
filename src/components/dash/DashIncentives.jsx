import { AlertCircle, Gift, ChevronDown } from 'lucide-react';
import { useState } from 'react';

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

const summaryCards = [
  { label: 'Available Amount', value: '$1,240', color: '#34d399', sub: 'Eligible for payout' },
  { label: 'Pending Validation', value: '$480', color: '#f59e0b', sub: 'Under compliance review' },
  { label: 'Total Historical', value: '$4,820', color: '#3b82f6', sub: 'Since activation' },
  { label: 'Current Cycle Match', value: '$720', color: '#a78bfa', sub: 'Cycle C-46' },
  { label: 'Rank Incentive', value: '$320', color: '#60a5fa', sub: 'Gold tier benefit' },
  { label: 'Leadership Dev.', value: '$60', color: '#f472b6', sub: 'Leadership tier bonus' },
];

const cycles = [
  { id: 'C-41', range: 'Oct 1-15', left: 2800, right: 2800, matched: 2800, rate: '10%', inc: 280, cfL: 0, cfR: 0, status: 'Paid' },
  { id: 'C-42', range: 'Oct 16-31', left: 3600, right: 3200, matched: 3200, rate: '10%', inc: 320, cfL: 400, cfR: 0, status: 'Paid' },
  { id: 'C-43', range: 'Nov 1-15', left: 2900, right: 3100, matched: 2900, rate: '10%', inc: 290, cfL: 0, cfR: 200, status: 'Paid' },
  { id: 'C-44', range: 'Nov 16-30', left: 4200, right: 3800, matched: 3800, rate: '10%', inc: 380, cfL: 400, cfR: 0, status: 'Approved' },
  { id: 'C-45', range: 'Dec 1-15', left: 3100, right: 3100, matched: 3100, rate: '10%', inc: 310, cfL: 0, cfR: 0, status: 'Approved' },
  { id: 'C-46', range: 'Dec 16-31', left: 3200, right: 2800, matched: 2800, rate: '10%', inc: 280, cfL: 400, cfR: 0, status: 'Pending' },
];

const ledger = [
  { date: '2025-12-20', type: 'Binary Structure', source: 'Cycle C-46', amount: '$280', status: 'Pending', note: 'Cycle match', ref: 'INC-4820' },
  { date: '2025-12-10', type: 'Rank Incentive', source: 'Gold Tier', amount: '$320', status: 'Approved', note: 'Monthly rank benefit', ref: 'INC-4719' },
  { date: '2025-11-30', type: 'Binary Structure', source: 'Cycle C-45', amount: '$310', status: 'Paid', note: 'Cycle match', ref: 'INC-4612' },
  { date: '2025-11-15', type: 'Direct Activation', source: 'María S.', amount: '$120', status: 'Paid', note: 'Direct referral activation', ref: 'INC-4531' },
  { date: '2025-11-01', type: 'Leadership Dev.', source: 'Leadership Pool', amount: '$60', status: 'Paid', note: 'Leadership contribution', ref: 'INC-4428' },
];

const statusColor = { Paid: '#34d399', Approved: '#3b82f6', Pending: '#f59e0b', Reversed: '#ef4444' };

export default function DashIncentives() {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 4 }}>Incentives</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Activity-derived incentive tracking and cycle history</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['summary', 'Summary'], ['cycles', 'Cycles'], ['ledger', 'Ledger']].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: activeTab === id ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)',
                border: activeTab === id ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)',
                color: activeTab === id ? 'white' : 'rgba(255,255,255,0.4)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Compliance banner */}
      <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8 }}>
        <AlertCircle size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 1 }} />
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 1.5 }}>
          This section reflects system-calculated incentive activity based on participation and structure data. Displayed values are subject to validation rules, eligibility criteria, and platform policies. Nothing displayed constitutes a guarantee of future outcomes.
        </p>
      </div>

      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {summaryCards.map(card => (
            <div key={card.label} style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14, padding: 18 }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 8 }}>{card.label}</div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: card.color, fontSize: 26, marginBottom: 4 }}>{card.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'cycles' && (
        <C>
          <Label>Cycle History Table</Label>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Cycle', 'Period', 'Left Pts', 'Right Pts', 'Matched', 'Rate', 'Incentive', 'CF Left', 'CF Right', 'Status'].map(h => (
                    <th key={h} style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, padding: '8px 12px', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 10, letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cycles.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', color: '#3b82f6', fontWeight: 700 }}>{c.id}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{c.range}</td>
                    <td style={{ padding: '10px 12px', color: 'white' }}>{c.left.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: 'white' }}>{c.right.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: '#34d399', fontWeight: 600 }}>{c.matched.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.5)' }}>{c.rate}</td>
                    <td style={{ padding: '10px 12px', color: 'white', fontWeight: 700 }}>${c.inc}</td>
                    <td style={{ padding: '10px 12px', color: c.cfL > 0 ? '#f59e0b' : 'rgba(255,255,255,0.25)' }}>{c.cfL}</td>
                    <td style={{ padding: '10px 12px', color: c.cfR > 0 ? '#f59e0b' : 'rgba(255,255,255,0.25)' }}>{c.cfR}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[c.status], background: `${statusColor[c.status]}18`, padding: '3px 10px', borderRadius: 20 }}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </C>
      )}

      {activeTab === 'ledger' && (
        <C>
          <Label>Incentive Ledger</Label>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Date', 'Type', 'Source', 'Amount', 'Status', 'Note', 'Ref ID'].map(h => (
                    <th key={h} style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 10, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledger.map((row, i) => (
                  <tr key={row.ref} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{row.date}</td>
                    <td style={{ padding: '10px 12px', color: 'white', whiteSpace: 'nowrap' }}>{row.type}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.5)' }}>{row.source}</td>
                    <td style={{ padding: '10px 12px', color: '#34d399', fontWeight: 700 }}>{row.amount}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[row.status], background: `${statusColor[row.status]}18`, padding: '3px 10px', borderRadius: 20 }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{row.note}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(59,130,246,0.7)', fontFamily: 'monospace', fontSize: 11 }}>{row.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </C>
      )}
    </div>
  );
}