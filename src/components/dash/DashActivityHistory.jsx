import { useState } from 'react';
import { Clock, Filter, Download, Activity, UserPlus, Award, Wallet, Bell } from 'lucide-react';

const C = ({ children, style }) => (
  <div style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 20, ...style }}>
    {children}
  </div>
);

const eventIcon = { activation: Activity, referral: UserPlus, rank: Award, payout: Wallet, notice: Bell };
const eventColor = { activation: '#3b82f6', referral: '#34d399', rank: '#f59e0b', payout: '#a78bfa', notice: '#60a5fa' };

const events = [
  { type: 'activation', label: 'Account Activated', detail: 'Initial activation confirmed — Care Plan enrolled', date: '2025-01-15', amount: null, status: 'Completed', milestone: true },
  { type: 'referral', label: 'First Direct Referral', detail: 'Carlos M. registered and placed on left leg', date: '2025-01-22', amount: null, status: 'Active', milestone: true },
  { type: 'referral', label: 'Direct Referral', detail: 'Ana García registered — right leg placement', date: '2025-02-08', amount: null, status: 'Active' },
  { type: 'rank', label: 'Rank Advancement: Bronze → Silver', detail: 'Qualification criteria met — Silver tier unlocked', date: '2025-03-01', amount: null, status: 'Achieved', milestone: true },
  { type: 'activation', label: 'First Cycle Match', detail: 'Cycle C-41 matched — 2,800 pts each side', date: '2025-03-15', amount: '$280', status: 'Paid', milestone: true },
  { type: 'referral', label: 'Direct Referral', detail: 'James T. registered — left leg placement', date: '2025-03-21', amount: null, status: 'Inactive' },
  { type: 'rank', label: 'Rank Advancement: Silver → Gold', detail: 'Gold tier qualification confirmed', date: '2025-06-12', amount: null, status: 'Achieved', milestone: true },
  { type: 'payout', label: 'Payout Request', detail: 'External payout request submitted — Cycle C-43', date: '2025-11-20', amount: '$600', status: 'Processed' },
  { type: 'activation', label: 'Cycle C-46 Opened', detail: 'Current active cycle — points accumulation ongoing', date: '2025-12-16', amount: null, status: 'Active' },
];

const typeFilters = ['all', 'activation', 'referral', 'rank', 'payout', 'notice'];

export default function DashActivityHistory() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [view, setView] = useState('timeline');

  const filtered = events.filter(e => typeFilter === 'all' || e.type === typeFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 4 }}>Activity History</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Full audit trail of your participation and milestones</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <Download size={13} /> Export
          </button>
          {['timeline', 'table'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: view === v ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)',
                border: view === v ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)',
                color: view === v ? 'white' : 'rgba(255,255,255,0.4)' }}>
              {v === 'timeline' ? 'Timeline' : 'Table'}
            </button>
          ))}
        </div>
      </div>

      {/* Type filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {typeFilters.map(f => (
          <button key={f} onClick={() => setTypeFilter(f)}
            style={{ padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              background: typeFilter === f ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.04)',
              border: typeFilter === f ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
              color: typeFilter === f ? 'white' : 'rgba(255,255,255,0.35)' }}>
            {f}
          </button>
        ))}
      </div>

      {view === 'timeline' ? (
        <C>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            {/* Timeline line */}
            <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 1, background: 'linear-gradient(to bottom, rgba(59,130,246,0.5), rgba(59,130,246,0.05))' }} />

            {filtered.map((event, i) => {
              const Icon = eventIcon[event.type] || Activity;
              const color = eventColor[event.type] || '#3b82f6';
              return (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20, position: 'relative' }}>
                  {/* Node */}
                  <div style={{ position: 'absolute', left: -24, width: 16, height: 16, borderRadius: '50%', background: `${color}22`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', top: 4 }}>
                    {event.milestone && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />}
                  </div>

                  <div style={{ flex: 1, background: event.milestone ? `${color}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${event.milestone ? `${color}25` : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon size={14} style={{ color }} />
                        <span style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>{event.label}</span>
                        {event.milestone && <span style={{ fontSize: 9, fontWeight: 700, color, background: `${color}20`, padding: '2px 8px', borderRadius: 20, letterSpacing: 0.5 }}>MILESTONE</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {event.amount && <span style={{ color: '#34d399', fontWeight: 700, fontSize: 13 }}>{event.amount}</span>}
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{event.date}</span>
                      </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 1.5 }}>{event.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </C>
      ) : (
        <C>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Date', 'Type', 'Event', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 10, letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => {
                  const color = eventColor[e.type] || '#3b82f6';
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{e.date}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 10, color, background: `${color}18`, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize', fontWeight: 600 }}>{e.type}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'white' }}>{e.label}</td>
                      <td style={{ padding: '10px 12px', color: '#34d399', fontWeight: 700 }}>{e.amount || '—'}</td>
                      <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.5)' }}>{e.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </C>
      )}
    </div>
  );
}