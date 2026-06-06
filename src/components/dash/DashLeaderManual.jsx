import { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Users, BookOpen, Calendar, TrendingUp, Award, AlertTriangle, CheckCircle, XCircle, Repeat, Target, Clock } from 'lucide-react';

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

function Section({ icon: Icon, color = '#3b82f6', title, subtitle, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${color}25` }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: open ? `${color}10` : 'rgba(255,255,255,0.02)', cursor: 'pointer', border: 'none', textAlign: 'left', transition: 'background 0.2s' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, color: 'white', fontSize: 14 }}>{title}</div>
          {subtitle && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 }}>{subtitle}</div>}
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />}
      </button>
      {open && (
        <div style={{ padding: '4px 18px 18px', background: `${color}06` }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Pill({ text, type = 'do' }) {
  const colors = {
    do:    { bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)',  text: '#34d399' },
    dont:  { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   text: '#f87171' },
    info:  { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  text: '#60a5fa' },
  };
  const c = colors[type];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '4px 12px', borderRadius: 20, background: c.bg, border: `1px solid ${c.border}`, color: c.text, margin: '3px' }}>
      {type === 'do' ? <CheckCircle size={11} /> : type === 'dont' ? <XCircle size={11} /> : null}
      {text}
    </span>
  );
}

function Rule({ icon: Icon, color, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <Icon size={14} style={{ color, marginTop: 1, flexShrink: 0 }} />
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

const identityDo   = ['Clarity', 'Stability', 'Consistency', 'Control', 'Vision'];
const identityDont = ['Hype', 'Desperation', 'Pressure', 'Unrealistic expectations'];

const responsibilities = [
  {
    icon: BookOpen, color: '#3b82f6', title: '1 — Onboarding', subtitle: 'Help new members start correctly',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {['Help new members understand what the system is — and what it is NOT', 'Ensure activation is clear and completed before anything else', 'Place members correctly in the structure (left / right balance)', 'Run a short 60-second orientation every new person needs to hear'].map(t => (
          <Rule key={t} icon={CheckCircle} color="#3b82f6" text={t} />
        ))}
      </div>
    ),
  },
  {
    icon: BookOpen, color: '#10b981', title: '2 — Education', subtitle: 'Simple, never overwhelming',
    content: (
      <div style={{ marginTop: 12 }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>Use only three tools to educate your team:</div>
        {[['60-Second Explanation', 'The core pitch — done in one minute. Anyone can repeat it.'], ['3-Step System', 'Invite → Explain → Connect. If it is more complex, it breaks.'], ['Visual Examples', 'Show the structure visually. People follow what they can see.']].map(([title, desc]) => (
          <div key={title} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginTop: 5, flexShrink: 0 }} />
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>{title}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Calendar, color: '#f59e0b', title: '3 — Follow-Up System', subtitle: 'Daily, weekly, monthly rhythm',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {[['Daily', '#3b82f6', 'Check new members. Answer doubts. Keep momentum going.'],
          ['Weekly', '#10b981', 'Review structure growth. Identify weak legs. Support builders.'],
          ['Monthly', '#f59e0b', 'Review rank progression. Recognize achievements. Set next goals.']].map(([freq, color, desc]) => (
          <div key={freq} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 10, background: `${color}0a`, border: `1px solid ${color}20` }}>
            <span style={{ fontSize: 10, fontWeight: 800, color, fontFamily: 'Montserrat, sans-serif', paddingTop: 2, minWidth: 52 }}>{freq.toUpperCase()}</span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{desc}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: TrendingUp, color: '#a78bfa', title: '4 — Structure Building', subtitle: 'Balance, avoid dead legs',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {['Always balance left and right legs — never pile on one side', 'Identify and support dead legs before they stagnate', 'Prioritize activating new builders over chasing cold leads', 'Your structure health is your team health — check it weekly'].map(t => (
          <Rule key={t} icon={Target} color="#a78bfa" text={t} />
        ))}
      </div>
    ),
  },
  {
    icon: Shield, color: '#ef4444', title: '5 — Culture Control', subtitle: 'Protect the system from bad language',
    content: (
      <div style={{ marginTop: 12 }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>Immediately correct anyone using:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {['investment / inversión', 'guaranteed returns', 'ROI', 'fake promises', 'aggressive pressure'].map(w => <Pill key={w} text={w} type="dont" />)}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>Reinforce these words constantly:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['estructura', 'sistema', 'participación', 'continuidad', 'crecimiento real'].map(w => <Pill key={w} text={w} type="do" />)}
        </div>
      </div>
    ),
  },
  {
    icon: Repeat, color: '#06b6d4', title: '6 — Duplication Model', subtitle: 'Teach only 3 things',
    content: (
      <div style={{ marginTop: 12 }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14 }}>If it is more complex than this — it breaks.</div>
        {[['01 — Invite', 'Bring the right people into the conversation. Quality over quantity.'],
          ['02 — Explain', 'Use the 60-second script. Nothing more. Keep it simple.'],
          ['03 — Connect', 'Connect them to the system and let the structure do the work.']].map(([step, desc]) => (
          <div key={step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 18, color: '#06b6d4', minWidth: 50 }}>{step.split('—')[0]}</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{step.split('— ')[1]}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

const dailyActions = [
  { count: '5', label: 'New conversations', icon: Users, color: '#3b82f6' },
  { count: '2', label: 'Presentations', icon: BookOpen, color: '#10b981' },
  { count: '1', label: 'Follow-up session', icon: Clock, color: '#f59e0b' },
  { count: '1', label: 'Team support action', icon: Shield, color: '#a78bfa' },
];

const recognitionLevels = [
  { label: 'New Activation', color: '#3b82f6', desc: 'First step in — member activates their account' },
  { label: 'First Builder', color: '#10b981', desc: 'Brings in their first direct member' },
  { label: 'First Team', color: '#f59e0b', desc: 'Has an active structure on both sides' },
  { label: 'First Rank', color: '#a78bfa', desc: 'Achieves first formal level in the system' },
  { label: 'Rank Upgrade', color: '#ef4444', desc: 'Advances to a higher level — celebrate publicly' },
];

const doSay   = ['"es un sistema"', '"depende de tu participación"', '"esto es estructura"'];
const dontSay = ['"vas a ganar seguro"', '"esto es inversión"', '"esto duplica dinero"'];

export default function DashLeaderManual() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 4 }}>Leadership Manual</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Internal system for building consistent, scalable, and culture-aligned teams</p>
      </div>

      {/* Core principle */}
      <div style={{ padding: '20px 24px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(10,22,40,0.8))', border: '1px solid rgba(59,130,246,0.35)', textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', marginBottom: 10 }}>Core Principle</div>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 6 }}>"This is not about selling."</div>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: '#3b82f6', fontSize: 20 }}>"This is about building structure."</div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          {['The system is the product', 'Structure creates growth', 'People follow clarity, not hype'].map(t => (
            <span key={t} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={12} style={{ color: '#3b82f6' }} /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* Leader identity */}
      <C>
        <Label>Leader Identity</Label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ color: '#34d399', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>A leader represents</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {identityDo.map(w => <Pill key={w} text={w} type="do" />)}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ color: '#f87171', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>A leader NEVER shows</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {identityDont.map(w => <Pill key={w} text={w} type="dont" />)}
            </div>
          </div>
        </div>
      </C>

      {/* Responsibilities */}
      <C>
        <Label>Leader Responsibilities</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {responsibilities.map(r => (
            <Section key={r.title} icon={r.icon} color={r.color} title={r.title} subtitle={r.subtitle}>
              {r.content}
            </Section>
          ))}
        </div>
      </C>

      {/* Daily system */}
      <C>
        <Label>Leader Daily System</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          {dailyActions.map(a => (
            <div key={a.label} style={{ padding: '16px', borderRadius: 12, background: `${a.color}0c`, border: `1px solid ${a.color}25`, textAlign: 'center' }}>
              <a.icon size={20} style={{ color: a.color, marginBottom: 8 }} />
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 28, lineHeight: 1 }}>{a.count}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>{a.label}</div>
            </div>
          ))}
        </div>
      </C>

      {/* Recognition system */}
      <C>
        <Label>Recognition System</Label>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14 }}>Recognition is critical for retention and team energy. Celebrate every milestone — publicly.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recognitionLevels.map((r, i) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: `${r.color}0a`, border: `1px solid ${r.color}25` }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${r.color}20`, border: `2px solid ${r.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Award size={14} style={{ color: r.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{r.label}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{r.desc}</div>
              </div>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 11, color: r.color }}>#{i + 1}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Dashboard badges', 'WhatsApp groups', 'Events', 'Leaderboards'].map(ch => (
            <span key={ch} style={{ fontSize: 11, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.25)' }}>
              {ch}
            </span>
          ))}
        </div>
      </C>

      {/* Leader rules */}
      <C>
        <Label>Leader Rules — Language</Label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, padding: '14px', borderRadius: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ color: '#f87171', fontSize: 11, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <XCircle size={13} /> NEVER SAY
            </div>
            {dontSay.map(s => (
              <div key={s} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{s}</div>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 200, padding: '14px', borderRadius: 12, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <div style={{ color: '#34d399', fontSize: 11, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={13} /> ALWAYS SAY
            </div>
            {doSay.map(s => (
              <div key={s} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{s}</div>
            ))}
          </div>
        </div>
      </C>

      {/* Performance tracking */}
      <C>
        <Label>Performance Tracking</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {['Direct Activations', 'Active Team Members', 'Structure Balance', 'Retention Rate', 'Rank Growth'].map(metric => (
            <div key={metric} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={13} style={{ color: '#3b82f6' }} />
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{metric}</span>
            </div>
          ))}
        </div>
      </C>

      {/* Disclaimer */}
      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'rgba(255,255,255,0.3)', fontSize: 10, lineHeight: 1.6 }}>
        This manual is for internal leadership alignment only. No specific income, rank progression, or team growth outcomes are guaranteed. All results depend on individual activity and participation within the platform.
      </div>
    </div>
  );
}