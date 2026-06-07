import { AlertCircle, ExternalLink, Wallet, Clock, CheckCircle, ArrowRight, Shield } from 'lucide-react';

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

const payoutHistory = [
  { date: '2025-11-20', amount: '$600', method: 'External Transfer', status: 'Processed', ref: 'PYT-2241' },
  { date: '2025-09-05', amount: '$310', method: 'External Transfer', status: 'Processed', ref: 'PYT-1982' },
  { date: '2025-07-18', amount: '$280', method: 'External Transfer', status: 'Processed', ref: 'PYT-1744' },
  { date: '2025-12-28', amount: '$480', method: 'External Transfer', status: 'Pending', ref: 'PYT-2580' },
];

const statusColor = { Processed: '#34d399', Pending: '#f59e0b', Rejected: '#ef4444' };

export default function DashWallet() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 4 }}>Wallet & External Payout Access</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Managed through authorized external payout platforms</p>
      </div>

      {/* Compliance */}
      <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10 }}>
        <Shield size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 1 }} />
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 1.5 }}>
          Payout processing may be subject to account verification, compliance review, regional limitations, and external platform availability. Mindbliss Power does not hold financial custody of participant balances.
        </p>
      </div>

      {/* Balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { label: 'Activity-Derived Balance', value: '$1,240', color: '#34d399', sub: 'Available for payout request', icon: Wallet },
          { label: 'Pending Validation', value: '$480', color: '#f59e0b', sub: 'Under compliance review', icon: Clock },
          { label: 'Total Accumulated', value: '$4,820', color: '#3b82f6', sub: 'Since activation', icon: CheckCircle },
        ].map(card => (
          <div key={card.label} style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14, padding: 18 }}>
            <card.icon size={20} style={{ color: card.color, marginBottom: 10 }} />
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: card.color, fontSize: 28, marginBottom: 4 }}>{card.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{card.label}</div>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Payout history */}
        <C>
          <Label>Payout History</Label>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Date', 'Amount', 'Payout Route', 'Status', 'Reference'].map(h => (
                    <th key={h} style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 10, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payoutHistory.map((row, i) => (
                  <tr key={row.ref} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{row.date}</td>
                    <td style={{ padding: '10px 12px', color: 'white', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>{row.amount}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.5)' }}>{row.method}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 10, color: statusColor[row.status], background: `${statusColor[row.status]}18`, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#3b82f6', fontFamily: 'monospace', fontSize: 11 }}>{row.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </C>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <C>
            <Label>External Payout Method</Label>
            <div style={{ padding: '14px 16px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                <span style={{ color: '#34d399', fontSize: 11, fontWeight: 600 }}>Method Verified</span>
              </div>
              <div style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Vicion External Transfer</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Linked account: ***4892</div>
            </div>
            <button style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Montserrat, sans-serif' }}>
              <ExternalLink size={14} /> Request Payout
            </button>
          </C>

          <C>
            <Label>Verification Status</Label>
            {[['Identity Verification', 'Completed'], ['Payout Method', 'Verified'], ['Compliance Review', 'Cleared'], ['Regional Eligibility', 'Active']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{k}</span>
                <span style={{ color: '#34d399', fontSize: 11, fontWeight: 600 }}>✓ {v}</span>
              </div>
            ))}
          </C>
        </div>
      </div>
    </div>
  );
}