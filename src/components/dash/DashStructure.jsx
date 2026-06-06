import { useState } from 'react';
import { Users, Filter, Maximize2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const statColor = 'rgba(255,255,255,0.5)';
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

const mockMembers = [
  { id: 'L1', name: 'Carlos M.', side: 'L', level: 1, status: 'Active', rank: 'Silver', country: 'CO', pts: 820, children: ['L1-L', 'L1-R'] },
  { id: 'R1', name: 'Ana G.', side: 'R', level: 1, status: 'Active', rank: 'Bronze', country: 'MX', pts: 640, children: ['R1-L'] },
  { id: 'L1-L', name: 'James T.', side: 'L', level: 2, status: 'Inactive', rank: 'Bronze', country: 'US', pts: 120, children: [] },
  { id: 'L1-R', name: 'María S.', side: 'L', level: 2, status: 'Active', rank: 'Bronze', country: 'AR', pts: 380, children: [] },
  { id: 'R1-L', name: 'Pedro L.', side: 'R', level: 2, status: 'Active', rank: 'Bronze', country: 'PE', pts: 290, children: [] },
];

function NodeCard({ member, onToggle, expanded }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => member.children?.length && onToggle(member.id)}
        style={{
          width: 90, padding: '10px 8px', borderRadius: 12, textAlign: 'center', cursor: member.children?.length ? 'pointer' : 'default',
          background: hover ? 'rgba(59,130,246,0.2)' : 'rgba(29,110,245,0.12)',
          border: `1px solid ${member.status === 'Active' ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.15)'}`,
          boxShadow: member.status === 'Active' ? '0 0 12px rgba(59,130,246,0.2)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 13, fontWeight: 700, color: 'white' }}>
          {member.name[0]}
        </div>
        <div style={{ color: 'white', fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{member.name.split(' ')[0]}</div>
        <div style={{ fontSize: 9, color: member.status === 'Active' ? '#34d399' : 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{member.status}</div>
        <div style={{ fontSize: 9, color: '#3b82f6' }}>{member.rank}</div>
        {member.children?.length > 0 && (
          <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.3)' }}>{expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}</div>
        )}
      </div>
      {/* Tooltip */}
      {hover && (
        <div style={{
          position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
          background: '#07101f', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 10, padding: '10px 14px',
          minWidth: 160, zIndex: 100, pointerEvents: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ color: 'white', fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{member.name}</div>
          {[['Country', member.country], ['Status', member.status], ['Rank', member.rank], ['Structure Pts', member.pts]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>
              <span>{k}</span><span style={{ color: 'white' }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashStructure() {
  const [expanded, setExpanded] = useState({ L1: true, R1: true });
  const [filter, setFilter] = useState('all');

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const metrics = [
    ['Total Left', '12'], ['Total Right', '12'], ['Active Left', '9'], ['Active Right', '9'],
    ['Left Points', '3,200'], ['Right Points', '2,800'], ['Matched Pts', '2,800'], ['Carry-Fwd L', '400'],
    ['Carry-Fwd R', '0'], ['Cycle Flush', '0'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 4 }}>My Structure</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Binary network visualization — current cycle view</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'active', 'month', 'country'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: filter === f ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)',
                border: filter === f ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)',
                color: filter === f ? 'white' : 'rgba(255,255,255,0.4)' }}>
              {f === 'all' ? 'All' : f === 'active' ? 'Active Only' : f === 'month' ? 'This Month' : 'By Country'}
            </button>
          ))}
        </div>
      </div>

      {/* Binary Tree */}
      <C>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Label>Binary Tree — Cycle C-46</Label>
          <button style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <Maximize2 size={13} /> Fullscreen
          </button>
        </div>

        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ minWidth: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Root node */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 0 }}>
              <div style={{ width: 100, padding: '12px 8px', borderRadius: 14, textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(29,110,245,0.4), rgba(59,130,246,0.25))',
                border: '2px solid rgba(59,130,246,0.7)', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 14, fontWeight: 900, color: 'white' }}>
                  {('' + (null || 'M'))[0]}
                </div>
                <div style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>YOU</div>
                <div style={{ fontSize: 10, color: '#3b82f6' }}>Gold · Active</div>
              </div>
              {/* Connector */}
              <div style={{ display: 'flex', width: '60%', position: 'relative', height: 40, justifyContent: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: '50%', borderLeft: '1px solid rgba(59,130,246,0.3)', borderBottom: '1px solid rgba(59,130,246,0.3)', borderBottomLeftRadius: 8 }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '50%', borderRight: '1px solid rgba(59,130,246,0.3)', borderBottom: '1px solid rgba(59,130,246,0.3)', borderBottomRightRadius: 8 }} />
              </div>
            </div>

            {/* Level 1 */}
            <div style={{ display: 'flex', gap: 80, marginBottom: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <div style={{ fontSize: 9, color: 'rgba(59,130,246,0.6)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>LEFT LEG</div>
                <NodeCard member={mockMembers[0]} onToggle={toggle} expanded={expanded['L1']} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 9, color: 'rgba(96,165,250,0.6)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>RIGHT LEG</div>
                <NodeCard member={mockMembers[1]} onToggle={toggle} expanded={expanded['R1']} />
              </div>
            </div>

            {/* Level 2 */}
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              {expanded['L1'] && (
                <>
                  <NodeCard member={mockMembers[2]} onToggle={toggle} expanded={false} />
                  <NodeCard member={mockMembers[3]} onToggle={toggle} expanded={false} />
                </>
              )}
              <div style={{ width: 40 }} />
              {expanded['R1'] && <NodeCard member={mockMembers[4]} onToggle={toggle} expanded={false} />}
              <div style={{ width: 90, height: 90, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>OPEN</span>
              </div>
            </div>
          </div>
        </div>
      </C>

      {/* Structural metrics */}
      <C>
        <Label>Structural Metrics — Current Cycle</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {metrics.map(([label, value]) => (
            <div key={label} style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, color: 'white', fontSize: 18 }}>{value}</div>
            </div>
          ))}
        </div>
      </C>

      <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8 }}>
        <AlertCircle size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, lineHeight: 1.5 }}>
          Structure visibility is limited to your qualifying downline per platform permissions. Figures reflect system calculations and current cycle data.
        </p>
      </div>
    </div>
  );
}