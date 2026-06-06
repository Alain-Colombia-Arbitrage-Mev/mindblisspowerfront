import { useState } from 'react';
import { Clock, Filter, Download, Star, UserPlus, Award, DollarSign, ArrowUp } from 'lucide-react';
import { DCard, PageHeader, SectionLabel, Badge, FilterBar, DisclaimerBox, PrimaryBtn } from './DashShared';

const eventTypes = { activation: { icon: Star, color: '#f59e0b' }, referral: { icon: UserPlus, color: '#22c55e' }, rank: { icon: Award, color: '#a78bfa' }, cycle: { icon: DollarSign, color: '#3b82f6' }, milestone: { icon: ArrowUp, color: '#60a5fa' } };

const milestones = [
  { date: 'Jan 15, 2025', type: 'activation', label: 'Account Activated', detail: 'Initial activation confirmed — welcome to Vicion Power.' },
  { date: 'Jan 28, 2025', type: 'referral', label: 'First Direct Referral', detail: 'M. Rodríguez joined via your referral link — Left side placement.' },
  { date: 'Feb 10, 2025', type: 'cycle', label: 'First Cycle Match', detail: 'Cycle C-001 completed — first incentive calculation processed.' },
  { date: 'Feb 22, 2025', type: 'rank', label: 'Bronze → Silver Rank', detail: 'Achieved Silver rank after reaching 3 direct active members.' },
  { date: 'Mar 08, 2025', type: 'referral', label: 'Referral: A. García', detail: 'Right side placement — status: Active.' },
  { date: 'Mar 21, 2025', type: 'cycle', label: 'Cycle C-009 Closed', detail: '$120 incentive approved — 1,500 matched points.' },
  { date: 'Apr 05, 2025', type: 'rank', label: 'Silver → Gold Rank', detail: 'Achieved Gold after 10 structure members + qualification criteria met.' },
  { date: 'Apr 12, 2025', type: 'milestone', label: 'Cycle C-013 Calculated', detail: '$240 incentive — fully balanced 2,400 matched points.' },
];

const allLogs = [
  { date: '2026-04-12', type: 'cycle', label: 'Cycle C-013 completed', amount: '+$240', status: 'paid' },
  { date: '2026-04-10', type: 'referral', label: 'K. Mora joined (Right)', amount: '—', status: 'active' },
  { date: '2026-04-07', type: 'activation', label: 'B. Herrera activated', amount: '+$50', status: 'paid' },
  { date: '2026-04-05', type: 'rank', label: 'Rank confirmed: Gold', amount: '+$200', status: 'approved' },
  { date: '2026-04-01', type: 'cycle', label: 'Cycle C-012 closed', amount: '+$290', status: 'paid' },
  { date: '2026-03-28', type: 'referral', label: 'R. Vega joined (Right)', amount: '—', status: 'active' },
];

export default function DashActivity() {
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState('timeline');

  return (
    <div>
      <PageHeader
        title="Activity History"
        subtitle="Complete audit trail of your participation and structural events"
        action={<PrimaryBtn small><Download size={14} /> Export CSV</PrimaryBtn>}
      />

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-5">
        {['timeline', 'log'].map(v => (
          <button key={v} onClick={() => setView(v)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              background: view === v ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
              color: view === v ? '#60a5fa' : 'rgba(255,255,255,0.4)',
              border: `1px solid ${view === v ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            {v === 'timeline' ? '⏱ Timeline' : '📋 Full Log'}
          </button>
        ))}
      </div>

      {view === 'timeline' ? (
        <DCard className="p-6" neon>
          <SectionLabel>Key Milestones</SectionLabel>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: 'rgba(59,130,246,0.2)' }} />
            <div className="space-y-0">
              {milestones.map((m, i) => {
                const Ev = eventTypes[m.type];
                return (
                  <div key={i} className="relative flex gap-4 pb-6 pl-1 group">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 transition-all duration-200"
                      style={{ background: `${Ev.color}15`, border: `2px solid ${Ev.color}40` }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = Ev.color}
                      onMouseLeave={e => e.currentTarget.style.borderColor = `${Ev.color}40`}
                    >
                      <Ev.icon size={16} style={{ color: Ev.color }} />
                    </div>
                    <div className="flex-1 pt-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-white">{m.label}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.detail}</div>
                        </div>
                        <div className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.date}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DCard>
      ) : (
        <DCard className="overflow-hidden" neon>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Date', 'Event Type', 'Description', 'Amount', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Montserrat, sans-serif' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allLogs.map((row, i) => {
                  const Ev = eventTypes[row.type];
                  return (
                    <tr key={i}
                      style={{ background: i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent'}
                    >
                      <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{row.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Ev.icon size={13} style={{ color: Ev.color }} />
                          <span style={{ color: Ev.color, textTransform: 'capitalize' }}>{row.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.7)' }}>{row.label}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: row.amount.startsWith('+') ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>{row.amount}</td>
                      <td className="px-4 py-3"><Badge color={row.status === 'paid' ? 'green' : row.status === 'approved' ? 'blue' : row.status === 'active' ? 'green' : 'amber'}>{row.status}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DCard>
      )}

      <DisclaimerBox text="Activity data is recorded based on system events. Historical records are maintained for audit and transparency purposes. Results depend on participation and network activity." />
    </div>
  );
}