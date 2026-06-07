import { useState } from 'react';
import { Copy, CheckCircle, MessageCircle, Zap, Users, Target, ChevronDown, ChevronUp } from 'lucide-react';

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

function CopyBlock({ text, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, position: 'relative' }}>
      {label && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>}
      <pre style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif', margin: 0 }}>{text}</pre>
      <button onClick={copy}
        style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)', color: copied ? '#34d399' : 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}>
        {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function Accordion({ title, icon: Icon, color = '#3b82f6', children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${color}25`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: open ? `${color}12` : 'rgba(255,255,255,0.02)', cursor: 'pointer', border: 'none', color: 'white', textAlign: 'left', transition: 'background 0.2s' }}>
        <Icon size={16} style={{ color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13 }}>{title}</span>
        {open ? <ChevronUp size={15} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronDown size={15} style={{ color: 'rgba(255,255,255,0.3)' }} />}
      </button>
      {open && <div style={{ padding: '0 16px 16px', background: `${color}08` }}>{children}</div>}
    </div>
  );
}

const MASTER_SHORT = `"Te hago una pregunta rápida…

¿Tú crees que la mayoría de la gente falla porque no tiene dinero…
o porque no tiene un sistema que le permita sostenerlo?

La realidad es que la mayoría de personas nunca ha tenido acceso a una estructura.

Y por eso empiezan… pero no continúan.

Lo que estamos haciendo con Mindbliss Power es diferente.

No es un banco.
No es una inversión.

Es un sistema donde tú puedes organizarte, participar y crecer dentro de una estructura real.

Aquí no se trata de cuánto tienes hoy…
se trata de cuánto puedes sostener en el tiempo.

Y además, si decides construir equipo, el sistema reconoce esa actividad.

No es magia.

Es estructura.

Si quieres, te muestro cómo funciona en 2 minutos."`;

const PHASE_1 = `"La mayoría de la gente cree que necesita más dinero para cambiar su situación.

Pero la realidad es otra.

Hay personas que ganan mucho… y aún así no avanzan.

¿Sabes por qué?

Porque no tienen estructura."`;

const PHASE_2 = `"Especialmente para nosotros…

Latinos, migrantes, personas que no siempre tienen acceso a sistemas formales…

Siempre estamos empezando desde cero.

Sin herramientas.
Sin respaldo.
Sin un sistema que nos ayude a sostener lo que hacemos."`;

const PHASE_3 = `"Mindbliss Power nace precisamente para eso.

No es un banco.
No es una inversión.

Es una plataforma donde tú puedes:

- Organizar tu participación
- Acceder a beneficios
- Construir una estructura
- Y crecer con el tiempo

Además, tiene un sistema donde si tú decides compartirlo y construir red, puedes acceder a incentivos por esa actividad.

Pero lo importante no es eso.

Lo importante es que tienes un sistema."`;

const PHASE_4 = `"No tienes que entender todo hoy.

Solo necesitas ver cómo funciona.

Si te hace sentido, avanzas.
Si no, no pasa nada.

Pero por lo menos ya viste una alternativa real."`;

const WHATSAPP = `Te explico rápido…

No es inversión, ni banco.

Es una plataforma donde puedes organizarte, participar y crecer dentro de un sistema estructurado.

Y si decides construir equipo, puedes acceder a incentivos por esa actividad.

Es simple, pero está bien armado.

Si quieres, te lo muestro en 2 minutos.`;

const LEADER = `"Aquí no estamos vendiendo un producto.

Estamos construyendo estructura.

El dinero es una consecuencia del sistema, no el objetivo principal.

Si entiendes eso, esto escala."`;

const objections = [
  {
    q: '"Esto es inversión?"',
    a: 'No. No funciona como una inversión.\n\nFunciona como un sistema de participación donde tú decides cómo avanzar dentro de la estructura.',
    color: '#ef4444',
  },
  {
    q: '"¿Cuánto se gana?"',
    a: 'Depende completamente de la actividad y de cómo construyas tu estructura.\n\nAquí no hay promesas, hay un sistema.',
    color: '#f59e0b',
  },
  {
    q: '"¿Es como red de mercadeo?"',
    a: 'Tiene un componente de red, pero no se basa solo en eso.\n\nEstá estructurado para que las personas puedan crecer dentro de un sistema más organizado.',
    color: '#a78bfa',
  },
];

const closes = [
  { label: 'Soft Close', text: '"¿Quieres que te enseñe cómo funciona por dentro?"', color: '#3b82f6' },
  { label: 'Direct Close', text: '"Si lo vas a hacer, hazlo con estructura desde el inicio."', color: '#10b981' },
  { label: 'Emotional Close', text: '"No se trata de empezar otra cosa…\nse trata de hacerlo bien esta vez."', color: '#f59e0b' },
];

const keywords = ['estructura', 'continuidad', 'participación', 'sistema', 'crecimiento real', 'proceso'];
const avoid = ['inversión', 'ganancia garantizada', 'ingreso pasivo', 'ROI', 'banco'];

const phases = [
  { num: '01', title: 'Disruption', subtitle: 'Break the belief', icon: Zap, color: '#ef4444', text: PHASE_1 },
  { num: '02', title: 'Relatability', subtitle: 'Connect emotionally', icon: Users, color: '#f59e0b', text: PHASE_2 },
  { num: '03', title: 'Structure', subtitle: 'Explain simply', icon: Target, color: '#3b82f6', text: PHASE_3 },
  { num: '04', title: 'Action', subtitle: 'Close with clarity', icon: MessageCircle, color: '#10b981', text: PHASE_4 },
];

export default function DashSalesScript() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, color: 'white', fontSize: 20, marginBottom: 4 }}>Sales Script Engine</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Ready-to-use scripts, objection handlers, and conversation tools — in Spanish</p>
      </div>

      {/* Language & tone reminder */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 10, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <div style={{ color: '#34d399', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Always Use</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {keywords.map(w => <span key={w} style={{ fontSize: 11, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(52,211,153,0.25)' }}>{w}</span>)}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ color: '#f87171', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Never Say</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {avoid.map(w => <span key={w} style={{ fontSize: 11, color: '#f87171', background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.25)' }}>{w}</span>)}
          </div>
        </div>
      </div>

      {/* Master short script */}
      <C>
        <Label>Master Script — 60 Seconds</Label>
        <CopyBlock text={MASTER_SHORT} />
      </C>

      {/* 4-phase extended */}
      <C>
        <Label>Extended Script — 4 Phase Model (3–5 min)</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {phases.map(p => (
            <Accordion key={p.num} title={`Phase ${p.num} — ${p.title}: ${p.subtitle}`} icon={p.icon} color={p.color}>
              <div style={{ paddingTop: 12 }}>
                <CopyBlock text={p.text} />
              </div>
            </Accordion>
          ))}
        </div>
      </C>

      {/* Closing variations */}
      <C>
        <Label>Closing Variations</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {closes.map(c => (
            <CopyBlock key={c.label} text={c.text} label={c.label} />
          ))}
        </div>
      </C>

      {/* Objection handling */}
      <C>
        <Label>Objection Handling</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {objections.map(obj => (
            <div key={obj.q} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${obj.color}25` }}>
              <div style={{ padding: '10px 14px', background: `${obj.color}12`, color: obj.color, fontWeight: 700, fontSize: 13 }}>
                {obj.q}
              </div>
              <div style={{ padding: '0 14px 14px', paddingTop: 12 }}>
                <CopyBlock text={obj.a} />
              </div>
            </div>
          ))}
        </div>
      </C>

      {/* WhatsApp version */}
      <C>
        <Label>WhatsApp Message — Ultra Simple</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <MessageCircle size={16} style={{ color: '#25d366' }} />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Copy and paste directly into WhatsApp</span>
        </div>
        <CopyBlock text={WHATSAPP} />
      </C>

      {/* Leader script */}
      <C>
        <Label>Leader Script — High Level</Label>
        <CopyBlock text={LEADER} />
      </C>

      {/* Disclaimer */}
      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'rgba(255,255,255,0.3)', fontSize: 10, lineHeight: 1.6 }}>
        These scripts are for communication and community sharing purposes only. No financial returns are guaranteed. All participation is voluntary and activity-based. Always represent the platform honestly and accurately.
      </div>
    </div>
  );
}