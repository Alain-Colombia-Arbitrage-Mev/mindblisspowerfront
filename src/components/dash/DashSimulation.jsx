import { useState } from 'react';
import { AlertCircle, Calculator, TrendingUp, Users, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
const Slider = ({ label, value, min, max, step, onChange, format }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{label}</span>
      <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>{format ? format(value) : value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)}
      style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 2 }}>
      <span>{min}</span><span>{max}</span>
    </div>
  </div>
);

const tt = { background: '#0d1f3c', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white', fontSize: 12 };

export default function DashSimulation() {
  const [activeTab, setActiveTab] = useState('binary');

  // Binary simulator state
  const [leftPts, setLeftPts] = useState(3200);
  const [rightPts, setRightPts] = useState(2800);
  const [matchRate, setMatchRate] = useState(10);
  const [cycleCap, setCycleCap] = useState(5000);

  const matched = Math.min(leftPts, rightPts, cycleCap);
  const incentive = matched * (matchRate / 100);
  const cfLeft = leftPts - matched;
  const cfRight = rightPts - matched;

  // Referral simulator
  const [activations, setActivations] = useState(3);
  const [actPts, setActPts] = useState(800);
  const [months, setMonths] = useState(6);

  const projectedNetwork = activations * months * 1.8;
  const projectedPts = actPts * months * activations * 0.6;

  // Rank simulator
  const [addDirect, setAddDirect] = useState(6);
  const [addPts, setAddPts] = useState(2000);

  const newDirect = 14 + addDirect;
  const newPts = 3200 + addPts;
  const projRank = newDirect >= 50 ? 'Diamond' : newDirect >= 20 ? 'Platinum' : newDirect >= 10 ? 'Gold' : 'Silver';

  const chartData = [
    { name: 'Current', direct: 14, pts: 3200 },
    { name: 'Simulated', direct: newDirect, pts: Math.min(newPts, 15000) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 4 }}>Simulation Center</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Educational scenario modeling — illustrative tool only</p>
      </div>

      {/* Disclaimer */}
      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10 }}>
        <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12, marginBottom: 3 }}>Simulation Disclaimer</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 1.5 }}>
            Simulation tools are illustrative only. They model system behavior based on hypothetical or current structure inputs and do not guarantee future outcomes. Results depend on participation and network activity.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[['binary', 'Binary Cycle', Calculator], ['referral', 'Referral Growth', Users], ['rank', 'Rank Path', Award]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: activeTab === id ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)',
              border: activeTab === id ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)',
              color: activeTab === id ? 'white' : 'rgba(255,255,255,0.4)' }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'binary' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <C>
            <Label>Inputs — Binary Cycle</Label>
            <Slider label="Left Structure Points" value={leftPts} min={0} max={10000} step={100} onChange={setLeftPts} format={v => v.toLocaleString()} />
            <Slider label="Right Structure Points" value={rightPts} min={0} max={10000} step={100} onChange={setRightPts} format={v => v.toLocaleString()} />
            <Slider label="Match Rate (%)" value={matchRate} min={1} max={20} step={0.5} onChange={setMatchRate} format={v => `${v}%`} />
            <Slider label="Cycle Cap" value={cycleCap} min={1000} max={20000} step={500} onChange={setCycleCap} format={v => v.toLocaleString()} />
          </C>
          <C>
            <Label>Simulated Output</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Matched Points', value: matched.toLocaleString(), color: '#3b82f6' },
                { label: 'Est. Cycle Incentive', value: `$${incentive.toFixed(0)}`, color: '#34d399' },
                { label: 'Carry-Fwd Left', value: cfLeft.toLocaleString(), color: cfLeft > 0 ? '#f59e0b' : 'rgba(255,255,255,0.3)' },
                { label: 'Carry-Fwd Right', value: cfRight.toLocaleString(), color: cfRight > 0 ? '#f59e0b' : 'rgba(255,255,255,0.3)' },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 22, color: item.color, marginBottom: 4 }}>{item.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{item.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: 12, background: 'rgba(59,130,246,0.06)', borderRadius: 10, color: 'rgba(255,255,255,0.35)', fontSize: 10, lineHeight: 1.5 }}>
              Figures shown reflect system calculations based on your inputs. Nothing displayed constitutes a guarantee of future outcomes.
            </div>
          </C>
        </div>
      )}

      {activeTab === 'referral' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <C>
            <Label>Inputs — Referral Growth</Label>
            <Slider label="Monthly Direct Activations" value={activations} min={1} max={20} step={1} onChange={setActivations} />
            <Slider label="Avg Activity Points per Member" value={actPts} min={100} max={5000} step={100} onChange={setActPts} format={v => v.toLocaleString()} />
            <Slider label="Time Frame (months)" value={months} min={1} max={24} step={1} onChange={setMonths} />
          </C>
          <C>
            <Label>Projected Outcomes</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Projected Network Size', value: Math.round(projectedNetwork), unit: ' members' },
                { label: 'Projected Structure Points', value: Math.round(projectedPts).toLocaleString(), unit: ' pts' },
                { label: 'Eligibility Milestones', value: projectedNetwork >= 50 ? 'Diamond path' : projectedNetwork >= 20 ? 'Platinum path' : 'Gold path', unit: '' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{item.label}</span>
                  <span style={{ color: 'white', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>{item.value}{item.unit}</span>
                </div>
              ))}
            </div>
          </C>
        </div>
      )}

      {activeTab === 'rank' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <C>
            <Label>Inputs — Rank Simulator</Label>
            <div style={{ marginBottom: 14, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              Current: <span style={{ color: '#FFD700', fontWeight: 700 }}>Gold</span> | 14 direct | 3,200 pts
            </div>
            <Slider label="Add Direct Referrals" value={addDirect} min={0} max={50} step={1} onChange={setAddDirect} />
            <Slider label="Add Activity Points" value={addPts} min={0} max={20000} step={500} onChange={setAddPts} format={v => v.toLocaleString()} />
          </C>
          <C>
            <Label>Gap Analysis & Projected Rank</Label>
            <div style={{ textAlign: 'center', marginBottom: 16, padding: '16px 0' }}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 6 }}>Simulated Rank</div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: '#3b82f6', fontSize: 36 }}>{projRank}</div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} barCategoryGap="40%">
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis hide />
                <Tooltip contentStyle={tt} />
                <Bar dataKey="direct" name="Direct Refs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </C>
        </div>
      )}
    </div>
  );
}