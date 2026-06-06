import { useState } from 'react';
import { Zap, Users, Repeat, MessageCircle, ChevronDown, ChevronUp, TrendingUp, Shield, Calendar, Play, CheckCircle, ArrowRight } from 'lucide-react';

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

function Accordion({ icon: Icon, color, title, subtitle, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${color}25` }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: open ? `${color}10` : 'rgba(255,255,255,0.02)', cursor: 'pointer', border: 'none', textAlign: 'left' }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} style={{ color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, color: 'white', fontSize: 13 }}>{title}</div>
          {subtitle && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{subtitle}</div>}
        </div>
        {open ? <ChevronUp size={15} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronDown size={15} style={{ color: 'rgba(255,255,255,0.3)' }} />}
      </button>
      {open && <div style={{ padding: '4px 16px 16px', background: `${color}06` }}>{children}</div>}
    </div>
  );
}

function Row({ color = '#3b82f6', text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <CheckCircle size={13} style={{ color, marginTop: 1, flexShrink: 0 }} />
      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

const hooks = [
  '"El problema no es el dinero…"',
  '"Nadie te explicó esto…"',
  '"Si no tienes estructura, no avanzas"',
];

const conversionFlow = [
  { step: '01', label: 'Short WhatsApp message', desc: 'Open the conversation — simple, no pressure' },
  { step: '02', label: '60-second explanation', desc: 'Use the master script — nothing more' },
  { step: '03', label: '3-minute deep dive', desc: 'Walk through the 4-phase model if interest is high' },
  { step: '04', label: 'Show the dashboard', desc: 'Let the simulation speak — visuals close' },
  { step: '05', label: 'Close', desc: 'Soft, direct, or emotional — pick the right tone' },
];

const duplicationSteps = [
  'Watch the onboarding sequence (4-day flow)',
  'Learn and practice the 60-second script',
  'Invite a minimum of 3 people into the system',
  'Connect each person to their assigned leader',
];

const onboarding = [
  { day: 'Day 1', color: '#3b82f6', text: 'Welcome message + What is Vicion Power' },
  { day: 'Day 2', color: '#10b981', text: 'How the system works — structure overview' },
  { day: 'Day 3', color: '#f59e0b', text: 'How to invite — tools, scripts, channels' },
  { day: 'Day 4', color: '#a78bfa', text: 'First actions — activate, place, share' },
];

const events = [
  { freq: 'Weekly', color: '#3b82f6', event: 'Zoom presentation — live system walkthrough' },
  { freq: 'Monthly', color: '#10b981', event: 'Recognition event — celebrate milestones publicly' },
  { freq: 'Quarterly', color: '#f59e0b', event: 'Leadership event — strategy, culture, alignment' },
];

const metrics = [
  { label: 'Conversion Rate', icon: TrendingUp, color: '#3b82f6' },
  { label: 'Activation Rate', icon: Zap, color: '#10b981' },
  { label: 'Retention', icon: Users, color: '#f59e0b' },
  { label: 'Referrals / User', icon: Repeat, color: '#a78bfa' },
  { label: 'Rank Progression Speed', icon: TrendingUp, color: '#ef4444' },
];

const channels = [
  { name: 'WhatsApp', color: '#25d366' },
  { name: 'Instagram', color: '#e1306c' },
  { name: 'TikTok', color: '#69c9d0' },
  { name: 'YouTube Shorts', color: '#ff0000' },
];

export default function DashExpansion() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 4 }}>Mass Expansion System</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Scalable growth model — attraction, conversion, duplication</p>
      </div>

      {/* Viral loop banner */}
      <div style={{ padding: '16px 20px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(10,22,40,0.8))', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif', flexShrink: 0 }}>Viral Loop</span>
        {['User Joins', 'Invites', 'Activates', 'Sees Structure', 'Shares'].map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <ArrowRight size={13} style={{ color: 'rgba(59,130,246,0.5)' }} />}
            <span style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', background: 'rgba(59,130,246,0.12)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.25)' }}>{step}</span>
          </div>
        ))}
      </div>

      {/* 3-Level Growth Model */}
      <C>
        <Label>3-Level Growth Model</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Level 1 */}
          <Accordion icon={Zap} color="#ef4444" title="Level 1 — Attraction" subtitle="Get attention through the right channels and content">
            <div style={{ paddingTop: 12 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Channels</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {channels.map(c => (
                  <span key={c.name} style={{ fontSize: 12, color: c.color, background: `${c.color}12`, padding: '4px 12px', borderRadius: 20, border: `1px solid ${c.color}30` }}>{c.name}</span>
                ))}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Content Types</div>
              {['Lifestyle — real people, real stories, no hype', 'Emotional — connect with the feeling of having no structure', 'Simple explanation — 30-second videos that anyone can repeat'].map(t => <Row key={t} color="#ef4444" text={t} />)}
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: '14px 0 8px' }}>Hook Examples</div>
              {hooks.map(h => (
                <div key={h} style={{ padding: '8px 14px', marginBottom: 6, borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(255,255,255,0.75)', fontSize: 13, fontStyle: 'italic' }}>{h}</div>
              ))}
            </div>
          </Accordion>

          {/* Level 2 */}
          <Accordion icon={MessageCircle} color="#3b82f6" title="Level 2 — Conversion" subtitle="Turn curious people into activated members">
            <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {conversionFlow.map(f => (
                <div key={f.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 16, color: '#3b82f6', minWidth: 30 }}>{f.step}</div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{f.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 4 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Conversion Tools</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['Referral links', 'QR codes', 'Short videos', 'Live calls'].map(t => (
                    <span key={t} style={{ fontSize: 11, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(59,130,246,0.25)' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </Accordion>

          {/* Level 3 */}
          <Accordion icon={Repeat} color="#10b981" title="Level 3 — Duplication" subtitle="Every member becomes a builder">
            <div style={{ paddingTop: 12 }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>Every new member must complete these 4 steps:</div>
              {duplicationSteps.map(s => <Row key={s} color="#10b981" text={s} />)}
            </div>
          </Accordion>
        </div>
      </C>

      {/* Onboarding flow */}
      <C>
        <Label>Automated Onboarding Flow — 4 Days</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {onboarding.map(d => (
            <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: `${d.color}0a`, border: `1px solid ${d.color}22` }}>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 11, color: d.color, minWidth: 44, textAlign: 'center', padding: '4px 0', borderRadius: 8, background: `${d.color}18`, border: `1px solid ${d.color}35` }}>{d.day}</div>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>{d.text}</span>
            </div>
          ))}
        </div>
      </C>

      {/* Events system */}
      <C>
        <Label>Events System</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map(e => (
            <div key={e.freq} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: `${e.color}0a`, border: `1px solid ${e.color}22` }}>
              <Calendar size={15} style={{ color: e.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, color: e.color, fontSize: 11 }}>{e.freq.toUpperCase()} — </span>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>{e.event}</span>
              </div>
            </div>
          ))}
        </div>
      </C>

      {/* Growth metrics */}
      <C>
        <Label>Growth Metrics to Track</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ padding: '14px 12px', borderRadius: 10, background: `${m.color}0a`, border: `1px solid ${m.color}22`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <m.icon size={14} style={{ color: m.color, flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>{m.label}</span>
            </div>
          ))}
        </div>
      </C>

      {/* Risk control */}
      <C>
        <Label>Risk Control</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {['Monitor language across all team members — correct immediately', 'Detect and report fake promises before they spread', 'Track abnormal activation spikes — flag for compliance review', 'Flag high-risk accounts for admin review'].map(t => <Row key={t} color="#ef4444" text={t} />)}
        </div>
      </C>

      {/* Disclaimer */}
      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'rgba(255,255,255,0.3)', fontSize: 10, lineHeight: 1.6 }}>
        This expansion system is for internal planning and team coordination only. Individual results depend on personal participation and activity. No specific growth or income outcomes are guaranteed.
      </div>
    </div>
  );
}