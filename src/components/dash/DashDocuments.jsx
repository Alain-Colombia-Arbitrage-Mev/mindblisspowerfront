import { FileText, Download, Eye, Award, Shield, FileCheck, Receipt, Star } from 'lucide-react';

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

const docGroups = [
  {
    label: 'Legal & Membership',
    icon: Shield,
    docs: [
      { name: 'Membership Agreement', date: '2025-01-15', type: 'PDF', status: 'Signed' },
      { name: 'Privacy Policy', date: '2025-01-15', type: 'PDF', status: 'Accepted' },
      { name: 'Compensation Guide', date: '2025-01-15', type: 'PDF', status: 'Reviewed' },
      { name: 'Compliance Disclosures', date: '2025-01-15', type: 'PDF', status: 'Accepted' },
    ]
  },
  {
    label: 'Activity & Payouts',
    icon: Receipt,
    docs: [
      { name: 'Activation Confirmation', date: '2025-01-15', type: 'PDF', status: 'Issued' },
      { name: 'Payout Receipt — Nov 2025', date: '2025-11-20', type: 'PDF', status: 'Issued' },
      { name: 'Payout Receipt — Sep 2025', date: '2025-09-05', type: 'PDF', status: 'Issued' },
      { name: 'Incentive Statement Q3 2025', date: '2025-10-01', type: 'PDF', status: 'Issued' },
    ]
  },
  {
    label: 'Rank & Recognition',
    icon: Award,
    docs: [
      { name: 'Bronze Rank Certificate', date: '2025-01-15', type: 'PDF', status: 'Issued' },
      { name: 'Silver Rank Certificate', date: '2025-03-01', type: 'PDF', status: 'Issued' },
      { name: 'Gold Rank Certificate', date: '2025-06-12', type: 'PDF', status: 'Issued' },
    ]
  },
];

export default function DashDocuments() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 4 }}>Documents</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>All your personal and platform documents in one place</p>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={14} /> {docGroups.reduce((s, g) => s + g.docs.length, 0)} documents
        </div>
      </div>

      {docGroups.map(group => (
        <C key={group.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <group.icon size={14} style={{ color: '#3b82f6' }} />
            </div>
            <Label><span style={{ marginBottom: 0, display: 'block' }}>{group.label}</span></Label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {group.docs.map(doc => (
              <div key={doc.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                <FileCheck size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'white', fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{doc.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{doc.date} · {doc.type}</div>
                </div>
                <span style={{ fontSize: 10, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 10px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap' }}>{doc.status}</span>
                <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
                  <button style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer', color: '#3b82f6', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Eye size={12} /> View
                  </button>
                  <button style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Download size={12} /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </C>
      ))}
    </div>
  );
}