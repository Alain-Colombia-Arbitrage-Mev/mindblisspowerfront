import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '@/lib/sessionManager';
import {
  ArrowRight, ArrowLeft, CheckCircle, Mail, Phone, User, Shield,
  Users, Network, Loader2, X, ChevronRight, Globe, CreditCard,
  Upload, BookOpen, Zap, TrendingUp, Home
} from 'lucide-react';

const LOGO = 'https://media.base44.com/images/public/user_695e30996105919ca32ab3e0/4441f7807_logodevcion.png';

// Simulated sponsor dataset
const SPONSORS = {
  'VP2024': { name: 'Carlos Mendoza', country: 'México', team_status: 'Activo', support: 'WhatsApp +52 55 1234 5678' },
  'VP1001': { name: 'María García', country: 'Colombia', team_status: 'Activo', support: 'Telegram @mgarcia_vp' },
  'VP3310': { name: 'Roberto Silva', country: 'Argentina', team_status: 'Activo', support: 'WhatsApp +54 11 9876 5432' },
  'VICION': { name: 'Equipo Vicion', country: 'Global', team_status: 'Activo', support: 'support@vicionpower.com' },
};

const TOTAL_STEPS = 13;

function useSimulatedCall(delay = 1400) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const run = (onDone) => {
    setLoading(true);
    setSuccess(false);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(onDone, 800);
    }, delay);
  };

  return { loading, success, run };
}

// ── Shared UI ──────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = 'text', options }) {
  if (options) {
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 600 }}>{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
          <option value="" style={{ background: '#0d1f3c' }}>Selecciona...</option>
          {options.map(o => <option key={o} value={o} style={{ background: '#0d1f3c' }}>{o}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 600 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}

function PrimaryBtn({ children, onClick, loading, success, disabled, color = '#3b82f6' }) {
  return (
    <button onClick={onClick} disabled={disabled || loading || success}
      style={{ width: '100%', padding: '14px 0', borderRadius: 12, background: success ? 'rgba(52,211,153,0.2)' : `linear-gradient(135deg,#1d6ef5,${color})`, border: success ? '1px solid rgba(52,211,153,0.4)' : 'none', color: success ? '#34d399' : 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 14, cursor: disabled || loading ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', marginTop: 8 }}>
      {loading ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Procesando...</>
        : success ? <><CheckCircle size={16} /> Verificado</>
        : <>{children}</>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

function Card({ children, highlight }) {
  return (
    <div style={{ background: highlight ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${highlight ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, padding: 20, marginBottom: 12 }}>
      {children}
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 22, marginBottom: 6, margin: '0 0 6px 0' }}>{title}</h2>
      {sub && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{sub}</p>}
    </div>
  );
}

// ── STEP 1: Path Selection ──────────────────────────────────────────────────

function StepPathSelection({ onNext, setData }) {
  const [selected, setSelected] = useState(null);

  const paths = [
    {
      id: 'direct',
      icon: User,
      title: 'Participación directa',
      desc: 'Accede al sistema como participante individual. Sin código de referido. Acceso a productos, actividad personal, perfil y formación.',
      badge: 'Acceso básico',
      color: '#3b82f6',
    },
    {
      id: 'network',
      icon: Network,
      title: 'Participación con estructura',
      desc: 'Tienes un código de referido o deseas construir red. Acceso completo a herramientas de crecimiento, equipo, bonificaciones y red binaria.',
      badge: 'Acceso completo',
      color: '#10b981',
    },
  ];

  const handleSelect = (id) => {
    setSelected(id);
    setData(d => ({ ...d, path: id }));
  };

  return (
    <div>
      <SectionTitle title="Elige tu forma de participar" sub="Esta selección define las herramientas y módulos a los que tendrás acceso dentro del sistema." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {paths.map(path => {
          const Icon = path.icon;
          const isSelected = selected === path.id;
          return (
            <motion.button key={path.id} onClick={() => handleSelect(path.id)}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              style={{ textAlign: 'left', padding: 20, borderRadius: 16, border: `2px solid ${isSelected ? path.color : 'rgba(255,255,255,0.1)'}`, background: isSelected ? `${path.color}15` : 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isSelected ? `0 8px 24px ${path.color}25` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${path.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} style={{ color: path.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 700, color: 'white', fontSize: 15 }}>{path.title}</span>
                    <span style={{ background: `${path.color}25`, color: path.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{path.badge}</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{path.desc}</p>
                </div>
                {isSelected && <CheckCircle size={20} style={{ color: path.color, flexShrink: 0 }} />}
              </div>
            </motion.button>
          );
        })}
      </div>

      <PrimaryBtn onClick={() => onNext()} disabled={!selected}>
        Continuar <ChevronRight size={16} />
      </PrimaryBtn>
    </div>
  );
}

// ── STEP 2: Personal Info ────────────────────────────────────────────────────

function StepPersonalInfo({ onNext, setData, data }) {
  const [form, setForm] = useState({ nombre: data.nombre || '', apellido: data.apellido || '', email: data.email || '', pais: data.pais || '', telefono: data.telefono || '' });
  const valid = form.nombre && form.apellido && form.email && form.pais && form.telefono;
  const { loading, success, run } = useSimulatedCall(800);

  const submit = () => {
    setData(d => ({ ...d, ...form }));
    run(onNext);
  };

  return (
    <div>
      <SectionTitle title="Información personal" sub="Tus datos son necesarios para crear tu perfil dentro del sistema." />
      <Field label="Nombre" value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} placeholder="Tu nombre" />
      <Field label="Apellido" value={form.apellido} onChange={v => setForm(f => ({ ...f, apellido: v }))} placeholder="Tu apellido" />
      <Field label="Correo electrónico" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="correo@ejemplo.com" type="email" />
      <Field label="País" value={form.pais} onChange={v => setForm(f => ({ ...f, pais: v }))} options={['México','Colombia','Argentina','España','Chile','Perú','Venezuela','Ecuador','Bolivia','Paraguay','Uruguay','Guatemala','Honduras','Costa Rica','Otro']} />
      <Field label="Teléfono" value={form.telefono} onChange={v => setForm(f => ({ ...f, telefono: v }))} placeholder="+52 55 1234 5678" type="tel" />
      <PrimaryBtn onClick={submit} loading={loading} success={success} disabled={!valid}>Guardar y continuar <ChevronRight size={16} /></PrimaryBtn>
    </div>
  );
}

// ── STEP 2b: Password Setup ──────────────────────────────────────────────────

function StepPasswordSetup({ onNext, setData, data }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const valid = password.length >= 6 && password === confirm;

  const submit = () => {
    // Simple hash-like obfuscation (not crypto — localStorage only)
    const hashed = btoa(unescape(encodeURIComponent(password)));
    setData(d => ({ ...d, password_hash: hashed }));
    onNext();
  };

  return (
    <div>
      <SectionTitle title="Crea tu contraseña" sub="Esta contraseña se usará para iniciar sesión en la plataforma después de completar el proceso." />
      <div style={{ marginBottom: 16 }}>
        <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 600 }}>Contraseña (mínimo 6 caracteres)</label>
        <div style={{ position: 'relative' }}>
          <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña segura"
            style={{ width: '100%', padding: '12px 40px 12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>
            {show ? '🙈' : '👁'}
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, display: 'block', marginBottom: 6, fontWeight: 600 }}>Confirmar contraseña</label>
        <input type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite tu contraseña"
          style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${confirm && password !== confirm ? 'rgba(239,68,68,0.5)' : 'rgba(59,130,246,0.25)'}`, borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>
      {confirm && password !== confirm && (
        <p style={{ color: '#ef4444', fontSize: 11, marginBottom: 12 }}>Las contraseñas no coinciden.</p>
      )}
      {password.length > 0 && password.length < 6 && (
        <p style={{ color: '#fb923c', fontSize: 11, marginBottom: 12 }}>Mínimo 6 caracteres.</p>
      )}
      <PrimaryBtn onClick={submit} disabled={!valid}>Establecer contraseña <ChevronRight size={16} /></PrimaryBtn>
    </div>
  );
}

// ── STEP 3: Email Verification ───────────────────────────────────────────────

function StepEmailVerification({ onNext, data }) {
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const { loading: sendLoading, success: sendSuccess, run: sendRun } = useSimulatedCall(1200);
  const { loading: verifyLoading, success: verifySuccess, run: verifyRun } = useSimulatedCall(1000);

  return (
    <div>
      <SectionTitle title="Verificación de correo" sub={`Enviaremos un código de 6 dígitos a ${data.email || 'tu correo'}.`} />

      {!sent ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <Mail size={40} style={{ color: '#3b82f6', marginBottom: 12 }} />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Haz clic para recibir tu código de verificación. Si no ves el correo, revisa tu carpeta de spam.
            </p>
          </div>
          <PrimaryBtn onClick={() => sendRun(() => setSent(true))} loading={sendLoading} success={sendSuccess}>
            Enviar código de verificación
          </PrimaryBtn>
        </Card>
      ) : (
        <Card>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 12 }}>Código de 6 dígitos</p>
          <input maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • • • •"
            style={{ width: '100%', padding: '16px 0', textAlign: 'center', letterSpacing: '0.5em', fontSize: 24, fontWeight: 700, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, color: 'white', outline: 'none', boxSizing: 'border-box', marginBottom: 4 }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', marginBottom: 16 }}>Para esta simulación, cualquier código de 6 dígitos es válido.</p>
          <PrimaryBtn onClick={() => verifyRun(onNext)} loading={verifyLoading} success={verifySuccess} disabled={code.length < 6}>
            Verificar correo
          </PrimaryBtn>
        </Card>
      )}
    </div>
  );
}

// ── STEP 4: Phone Verification ───────────────────────────────────────────────

function StepPhoneVerification({ onNext, data }) {
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const { loading: sL, success: sS, run: sRun } = useSimulatedCall(1000);
  const { loading: vL, success: vS, run: vRun } = useSimulatedCall(1000);

  return (
    <div>
      <SectionTitle title="Verificación de teléfono" sub={`Enviaremos un SMS al número ${data.telefono || 'registrado'}.`} />

      {!sent ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <Phone size={40} style={{ color: '#3b82f6', marginBottom: 12 }} />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Recibirás un SMS con tu código de verificación.
            </p>
          </div>
          <PrimaryBtn onClick={() => sRun(() => setSent(true))} loading={sL} success={sS}>
            Enviar SMS
          </PrimaryBtn>
        </Card>
      ) : (
        <Card>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 12 }}>Código SMS</p>
          <input maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • • • •"
            style={{ width: '100%', padding: '16px 0', textAlign: 'center', letterSpacing: '0.5em', fontSize: 24, fontWeight: 700, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, color: 'white', outline: 'none', boxSizing: 'border-box', marginBottom: 4 }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', marginBottom: 16 }}>Simulación: cualquier código de 6 dígitos.</p>
          <PrimaryBtn onClick={() => vRun(onNext)} loading={vL} success={vS} disabled={code.length < 6}>
            Verificar teléfono
          </PrimaryBtn>
        </Card>
      )}
    </div>
  );
}

// ── STEP 5: Identity Verification ────────────────────────────────────────────

function StepIdentityVerification({ onNext, setData }) {
  const [form, setForm] = useState({ docType: '', docNumber: '', issuingCountry: '' });
  const valid = form.docType && form.docNumber && form.issuingCountry;
  const { loading, success, run } = useSimulatedCall(1600);

  return (
    <div>
      <SectionTitle title="Verificación básica de identidad" sub="Confirmación de datos requerida antes de continuar. Esta información es utilizada para validar tu participación." />

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Shield size={18} style={{ color: '#3b82f6' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Validación de identidad básica — proceso estándar</span>
        </div>
        <Field label="Tipo de documento" value={form.docType} onChange={v => setForm(f => ({ ...f, docType: v }))} options={['Pasaporte','Cédula de identidad','DNI','Licencia de conducir']} />
        <Field label="Número de documento" value={form.docNumber} onChange={v => setForm(f => ({ ...f, docNumber: v }))} placeholder="Número de tu documento" />
        <Field label="País de emisión" value={form.issuingCountry} onChange={v => setForm(f => ({ ...f, issuingCountry: v }))} options={['México','Colombia','Argentina','España','Chile','Perú','Venezuela','Ecuador','Bolivia','Otro']} />
      </Card>

      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, lineHeight: 1.6, marginBottom: 16 }}>
        Tus datos están protegidos y son utilizados exclusivamente para validación interna dentro de la plataforma.
      </p>

      <PrimaryBtn onClick={() => { setData(d => ({ ...d, identity: form })); run(onNext); }} loading={loading} success={success} disabled={!valid}>
        Confirmar identidad
      </PrimaryBtn>
    </div>
  );
}

// ── STEP 6: Referral Code (PATH B only) ──────────────────────────────────────

function StepReferralCode({ onNext, setData, data }) {
  const [code, setCode] = useState('');
  const [sponsor, setSponsor] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const { loading, run } = useSimulatedCall(1000);

  const lookupCode = () => {
    run(() => {
      const found = SPONSORS[code.toUpperCase()];
      if (found) {
        setSponsor(found);
        setNotFound(false);
        setData(d => ({ ...d, referral_code: code.toUpperCase(), sponsor: found }));
      } else {
        setSponsor(null);
        setNotFound(true);
      }
    });
  };

  return (
    <div>
      <SectionTitle title="Código de referido" sub="Ingresa el código de tu representante directo para vincular tu cuenta a la estructura correcta." />

      <Field label="Código de referido" value={code} onChange={v => { setCode(v); setSponsor(null); setNotFound(false); }} placeholder="Ej: VP2024" />

      <PrimaryBtn onClick={lookupCode} loading={loading} disabled={!code || sponsor !== null}>
        Buscar representante
      </PrimaryBtn>

      {sponsor && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 16, padding: 20, borderRadius: 16, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <CheckCircle size={18} style={{ color: '#10b981' }} />
            <span style={{ color: '#10b981', fontWeight: 700, fontSize: 13 }}>Representante encontrado</span>
          </div>
          {[['Nombre', sponsor.name], ['País', sponsor.country], ['Estado del equipo', sponsor.team_status], ['Canal de apoyo', sponsor.support]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{k}</span>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <PrimaryBtn onClick={onNext} color="#10b981">Confirmar y continuar</PrimaryBtn>
        </motion.div>
      )}

      {notFound && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)' }}>
          <p style={{ color: '#fb923c', fontSize: 13, margin: '0 0 12px 0' }}>Código no encontrado. Puedes continuar sin código o verificarlo con tu representante.</p>
          <PrimaryBtn onClick={() => { setData(d => ({ ...d, referral_code: null, sponsor: null })); onNext(); }} color="#fb923c">
            Continuar sin código de referido
          </PrimaryBtn>
        </motion.div>
      )}

      <button onClick={() => { setData(d => ({ ...d, referral_code: null, sponsor: null })); onNext(); }}
        style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer', marginTop: 12, padding: 8 }}>
        Omitir este paso
      </button>
    </div>
  );
}

// ── STEP 7: Visual Simulator ──────────────────────────────────────────────────

function StepSimulator({ onNext, data }) {
  const [level, setLevel] = useState(1000);
  const [months, setMonths] = useState(24);
  const [scenario, setScenario] = useState('conservador');

  const scenarios = {
    conservador: { label: 'Conservador', mult: 1, color: '#3b82f6' },
    dinamico: { label: 'Dinámico', mult: 1.6, color: '#10b981' },
    expansion: { label: 'Expansión', mult: 2.4, color: '#f59e0b' },
  };

  const sc = scenarios[scenario];
  const baseMonthly = (level * 0.07) * sc.mult;
  const total = baseMonthly * months;
  const isNetwork = data.path === 'network';

  return (
    <div>
      <SectionTitle title="Simulador ilustrativo" sub="Explora escenarios estimados de acceso a beneficios. Estos valores son ilustrativos y no representan garantías." />

      <div style={{ padding: 4, borderRadius: 12, background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', marginBottom: 20 }}>
        <p style={{ color: '#fb923c', fontSize: 11, textAlign: 'center', padding: '8px 12px', margin: 0 }}>
          ⚠ Simulación educativa — no representa retornos garantizados ni promesas financieras
        </p>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Nivel de participación (USD)</label>
          <input type="range" min="500" max="25000" step="500" value={level} onChange={e => setLevel(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#3b82f6', marginBottom: 6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>$500</span>
            <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: 14 }}>${level.toLocaleString()} USD</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>$25,000</span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Horizonte de tiempo: {months} meses</label>
          <input type="range" min="6" max="60" step="6" value={months} onChange={e => setMonths(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#3b82f6' }} />
        </div>

        <div>
          <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>Escenario</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(scenarios).map(([key, s]) => (
              <button key={key} onClick={() => setScenario(key)}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${scenario === key ? s.color : 'rgba(255,255,255,0.1)'}`, background: scenario === key ? `${s.color}20` : 'transparent', color: scenario === key ? s.color : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <motion.div key={`${level}-${months}-${scenario}`}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Proyección mensual estimada', value: `$${baseMonthly.toFixed(0)}`, unit: 'USD / mes' },
            { label: `Proyección a ${months} meses`, value: `$${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, unit: 'USD total ilustrativo' },
            ...(isNetwork ? [
              { label: 'Con estructura de red', value: `+${(sc.mult * 30).toFixed(0)}%`, unit: 'potencial adicional' },
            ] : []),
          ].map((item, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 12, background: `${sc.color}12`, border: `1px solid ${sc.color}30`, textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: '0 0 6px 0', lineHeight: 1.4 }}>{item.label}</p>
              <p style={{ color: sc.color, fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 20, margin: '0 0 4px 0' }}>{item.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>{item.unit}</p>
            </div>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'center', lineHeight: 1.5 }}>
          * Proyección educativa basada en comportamiento estimado del ecosistema. No constituye garantía de resultados. Los valores reales dependen del funcionamiento del sistema y la actividad del participante.
        </p>
      </motion.div>

      <PrimaryBtn onClick={onNext}>Entendido, continuar</PrimaryBtn>
    </div>
  );
}

// ── STEP 8: Plan Selection ────────────────────────────────────────────────────

function StepPlanSelection({ onNext, setData }) {
  const [selected, setSelected] = useState(null);

  const plans = [
    { label: 'Inicio', value: 500 },
    { label: 'Base', value: 1000, recommended: true },
    { label: 'Progreso', value: 2500 },
    { label: 'Expansión', value: 5000 },
    { label: 'Avance', value: 10000 },
    { label: 'Posición', value: 25000 },
  ];

  return (
    <div>
      <SectionTitle title="Elige tu nivel de participación" sub="Selecciona el nivel que corresponde a tu visión y posibilidades actuales." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {plans.map(p => {
          const isSel = selected === p.value;
          return (
            <div key={p.value} style={{ position: 'relative' }}>
              {p.recommended && (
                <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#1d6ef5,#3b82f6)', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 12, zIndex: 10, whiteSpace: 'nowrap' }}>RECOMENDADO</div>
              )}
              <button onClick={() => { setSelected(p.value); setData(d => ({ ...d, planValue: p.value, planLabel: p.label })); }}
                style={{ width: '100%', padding: '16px 12px', borderRadius: 14, border: `2px solid ${isSel ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`, background: isSel ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', transform: isSel ? 'scale(1.02)' : 'scale(1)' }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 13, marginBottom: 4, fontFamily: 'Montserrat,sans-serif' }}>{p.label}</div>
                <div style={{ color: '#3b82f6', fontSize: 14, fontWeight: 800 }}>${p.value.toLocaleString()}</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>USD</div>
              </button>
            </div>
          );
        })}
      </div>

      <PrimaryBtn onClick={onNext} disabled={!selected}>Confirmar nivel</PrimaryBtn>
    </div>
  );
}

// ── STEP 9: Payment ───────────────────────────────────────────────────────────

function StepPayment({ onNext, data }) {
  const [method, setMethod] = useState(null);
  const { loading, success, run } = useSimulatedCall(2000);

  const methods = [
    { id: 'transfer', label: 'Transferencia bancaria', icon: '🏦' },
    { id: 'crypto', label: 'Criptomoneda (USDT/BTC)', icon: '₿' },
    { id: 'card', label: 'Tarjeta de crédito/débito', icon: '💳' },
  ];

  return (
    <div>
      <SectionTitle title="Proceso de activación" sub="Confirma tu método de pago para activar tu participación en el ecosistema." />

      <Card highlight>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Nivel seleccionado</span>
          <span style={{ color: 'white', fontWeight: 700 }}>{data.planLabel || 'Base'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Monto de participación</span>
          <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: 16 }}>${(data.planValue || 1000).toLocaleString()} USD</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Tipo de acceso</span>
          <span style={{ color: data.path === 'network' ? '#10b981' : '#3b82f6', fontWeight: 700 }}>{data.path === 'network' ? 'Acceso con red' : 'Acceso directo'}</span>
        </div>
      </Card>

      <div style={{ marginBottom: 20 }}>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>MÉTODO DE PAGO</p>
        {methods.map(m => (
          <button key={m.id} onClick={() => setMethod(m.id)}
            style={{ width: '100%', padding: '14px 16px', marginBottom: 8, borderRadius: 12, border: `1px solid ${method === m.id ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, background: method === m.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
            <span style={{ fontSize: 20 }}>{m.icon}</span>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{m.label}</span>
            {method === m.id && <CheckCircle size={16} style={{ color: '#3b82f6', marginLeft: 'auto' }} />}
          </button>
        ))}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', marginBottom: 12 }}>
        Esta es una simulación del proceso de pago. En producción, se integran pasarelas reales de pago.
      </p>

      <PrimaryBtn onClick={() => run(onNext)} loading={loading} success={success} disabled={!method}>
        Procesar activación
      </PrimaryBtn>
    </div>
  );
}

// ── STEP 10: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({ onNext, data }) {
  const isNetwork = data.path === 'network';

  return (
    <div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <div style={{ textAlign: 'center', padding: '20px 0 28px' }}>
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.6, delay: 0.2 }}
            style={{ width: 90, height: 90, margin: '0 auto 20px', background: 'rgba(52,211,153,0.15)', border: '2px solid rgba(52,211,153,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={44} style={{ color: '#34d399' }} />
          </motion.div>
          <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 26, marginBottom: 8 }}>
            ¡Bienvenido, {data.nombre || 'participante'}!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
            Tu participación ha sido registrada. Ahora eres parte del ecosistema Vicion Power.
          </p>
        </div>

        <Card>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>RESUMEN DE TU ACCESO</p>
          {[
            ['Tipo de participación', isNetwork ? 'Con estructura de red' : 'Directa'],
            ['Nivel activado', data.planLabel || 'Base'],
            ['Monto', `$${(data.planValue || 1000).toLocaleString()} USD`],
            ...(data.referral_code ? [['Referido por', data.sponsor?.name || data.referral_code]] : []),
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{k}</span>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </Card>

        <div style={{ marginTop: 16 }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 12 }}>Próximos pasos:</p>
          {['Completar verificación de documentos', isNetwork ? 'Completar formación de red' : 'Revisar módulo de inicio', 'Activar tu panel de control'].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{step}</span>
            </div>
          ))}
        </div>

        <PrimaryBtn onClick={onNext} color="#34d399">Continuar al siguiente paso</PrimaryBtn>
      </motion.div>
    </div>
  );
}

// ── STEP 11: Document Upload ────────────────────────────────────────────────

function StepDocumentUpload({ onNext }) {
  const [docs, setDocs] = useState({ front: false, back: false, selfie: false });
  const { loading, success, run } = useSimulatedCall(1800);

  const DocItem = ({ id, label, icon }) => (
    <button onClick={() => setDocs(d => ({ ...d, [id]: true }))}
      style={{ width: '100%', padding: '14px 16px', marginBottom: 8, borderRadius: 12, border: `1px solid ${docs[id] ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`, background: docs[id] ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ color: docs[id] ? '#34d399' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, flex: 1, textAlign: 'left' }}>{label}</span>
      {docs[id] ? <CheckCircle size={16} style={{ color: '#34d399' }} /> : <Upload size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />}
    </button>
  );

  return (
    <div>
      <SectionTitle title="Completar verificación de identidad" sub="Sube los documentos para finalizar tu proceso de validación. Este paso es post-activación." />

      <Card>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DOCUMENTOS REQUERIDOS</p>
        <DocItem id="front" label="Documento de identidad — Frente" icon="🪪" />
        <DocItem id="back" label="Documento de identidad — Reverso" icon="🪪" />
        <DocItem id="selfie" label="Selfie de verificación (opcional)" icon="🤳" />
      </Card>

      <Card>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.6 }}>
          Estado de verificación: {docs.front && docs.back ? <span style={{ color: '#34d399', fontWeight: 700 }}>En revisión</span> : <span style={{ color: '#fb923c', fontWeight: 700 }}>Pendiente</span>}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 8 }}>
          Simulación: haz clic en cada documento para marcarlo como cargado.
        </p>
      </Card>

      <PrimaryBtn onClick={() => run(onNext)} loading={loading} success={success} disabled={!docs.front || !docs.back}>
        Enviar documentos para revisión
      </PrimaryBtn>

      <button onClick={onNext} style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', marginTop: 8, padding: 8 }}>
        Completar más tarde
      </button>
    </div>
  );
}

// ── STEP 12: Training ─────────────────────────────────────────────────────────

function StepTraining({ onNext, data }) {
  const [completed, setCompleted] = useState({});
  const { loading, success, run } = useSimulatedCall(1000);
  const isNetwork = data.path === 'network';

  const modules = [
    { id: 'what', title: '¿Qué es Vicion Power?', desc: 'Estructura, misión y propósito del ecosistema.', icon: '🌐' },
    { id: 'how', title: 'Cómo funciona el sistema', desc: 'Mecánica de participación, acceso y beneficios.', icon: '⚙️' },
    { id: 'benefits', title: 'Tu acceso y beneficios', desc: 'Lo que desbloqueas con tu nivel de participación.', icon: '⭐' },
    ...(isNetwork ? [
      { id: 'network', title: 'Cómo funciona la red', desc: 'Estructura binaria, referidos y posicionamiento.', icon: '🌿' },
      { id: 'sponsor', title: 'Primeras acciones con tu sponsor', desc: 'Cómo conectar, comunicarte y avanzar.', icon: '🤝' },
    ] : []),
    { id: 'faq', title: 'Preguntas frecuentes clave', desc: 'Respuestas a las dudas más comunes.', icon: '❓' },
  ];

  const allDone = modules.every(m => completed[m.id]);

  return (
    <div>
      <SectionTitle title="Formación inicial" sub="Completa los módulos antes de acceder a tu panel. Es rápido y necesario para entender el sistema." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {modules.map(mod => (
          <button key={mod.id} onClick={() => setCompleted(c => ({ ...c, [mod.id]: true }))}
            style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 12, border: `1px solid ${completed[mod.id] ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`, background: completed[mod.id] ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
            <span style={{ fontSize: 20 }}>{mod.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: completed[mod.id] ? '#34d399' : 'white', fontSize: 13, fontWeight: 600, margin: 0, marginBottom: 2 }}>{mod.title}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{mod.desc}</p>
            </div>
            {completed[mod.id] ? <CheckCircle size={16} style={{ color: '#34d399', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />}
          </button>
        ))}
      </div>

      <div style={{ padding: '10px 0', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Progreso de formación</span>
          <span style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700 }}>{Object.values(completed).filter(Boolean).length}/{modules.length}</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
          <motion.div animate={{ width: `${(Object.values(completed).filter(Boolean).length / modules.length) * 100}%` }}
            style={{ height: '100%', background: 'linear-gradient(90deg,#1d6ef5,#10b981)', borderRadius: 2 }} />
        </div>
      </div>

      <PrimaryBtn onClick={() => run(onNext)} loading={loading} success={success} disabled={!allDone}>
        Completar formación y activar panel
      </PrimaryBtn>

      <button onClick={onNext} style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', marginTop: 8, padding: 8 }}>
        Continuar sin completar formación
      </button>
    </div>
  );
}

// ── STEP 13: Activation ────────────────────────────────────────────────────────

function StepActivation({ onFinish, data }) {
  const [activated, setActivated] = useState(false);
  const { loading, success, run } = useSimulatedCall(2200);
  const isNetwork = data.path === 'network';

  if (activated) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', padding: '20px 0' }}>
        <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.5, delay: 0.1 }}
          style={{ fontSize: 64, marginBottom: 20 }}>🎉</motion.div>
        <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 26, marginBottom: 8 }}>
          Panel activado
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {isNetwork
            ? 'Acceso completo activado. Tu red binaria, equipo, bonificaciones y herramientas de crecimiento están disponibles.'
            : 'Acceso básico activado. Productos, actividad, perfil, soporte y formación están disponibles.'}
        </p>

        <div style={{ marginBottom: 24 }}>
          {(isNetwork
            ? ['Red binaria habilitada', 'Equipo visible', 'Bonificaciones activas', 'Herramientas de crecimiento', 'Panel de comunicaciones']
            : ['Dashboard de inicio', 'Catálogo de productos', 'Actividad personal', 'Perfil y configuración', 'Soporte y formación']
          ).map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', justifyContent: 'center' }}>
              <CheckCircle size={14} style={{ color: '#34d399' }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{item}</span>
            </motion.div>
          ))}
        </div>

        <button onClick={onFinish}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#1d6ef5,#3b82f6)', color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 15, padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(59,130,246,0.3)' }}>
          Ir a mi panel <ArrowRight size={18} />
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <SectionTitle title="Activación de panel" sub="Todo está listo. Activa tu panel de control para comenzar." />

      <Card highlight>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>MÓDULOS QUE SE ACTIVARÁN</p>
        {(isNetwork
          ? ['Dashboard de inicio', 'Red binaria', 'Equipo', 'Bonificaciones', 'Comunicaciones', 'Ranking', 'Perfil', 'Soporte']
          : ['Dashboard de inicio', 'Productos', 'Actividad', 'Perfil', 'Soporte', 'Formación']
        ).map((mod, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Zap size={12} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{mod}</span>
          </div>
        ))}
      </Card>

      <PrimaryBtn onClick={() => run(() => setActivated(true))} loading={loading} success={success}>
        Activar mi panel ahora
      </PrimaryBtn>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const STEP_DEFS = [
  { id: 'path', label: 'Participación', component: StepPathSelection, requiresNetwork: false },
  { id: 'info', label: 'Datos', component: StepPersonalInfo, requiresNetwork: false },
  { id: 'password', label: 'Contraseña', component: StepPasswordSetup, requiresNetwork: false },
  { id: 'email', label: 'Correo', component: StepEmailVerification, requiresNetwork: false },
  { id: 'phone', label: 'Teléfono', component: StepPhoneVerification, requiresNetwork: false },
  { id: 'identity', label: 'Identidad', component: StepIdentityVerification, requiresNetwork: false },
  { id: 'referral', label: 'Referido', component: StepReferralCode, requiresNetwork: true },
  { id: 'simulator', label: 'Simulador', component: StepSimulator, requiresNetwork: false },
  { id: 'plan', label: 'Nivel', component: StepPlanSelection, requiresNetwork: false },
  { id: 'payment', label: 'Activación', component: StepPayment, requiresNetwork: false },
  { id: 'welcome', label: 'Bienvenida', component: StepWelcome, requiresNetwork: false },
  { id: 'docs', label: 'Documentos', component: StepDocumentUpload, requiresNetwork: false },
  { id: 'training', label: 'Formación', component: StepTraining, requiresNetwork: false },
  { id: 'activation', label: 'Panel', component: StepActivation, requiresNetwork: false },
];

export default function OnboardingStart() {
  const navigate = useNavigate();
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vp_onboarding') || '{}'); } catch { return {}; }
  });

  const isNetwork = data.path === 'network';
  const steps = STEP_DEFS.filter(s => !s.requiresNetwork || isNetwork);

  // Restore step from sessionManager (Phase 4 — resume exact step)
  const [step, setStep] = useState(() => {
    const saved = sessionManager.getOnboardingStep();
    return saved < steps.length ? saved : 0;
  });

  const currentStep = steps[step];
  const StepComp = currentStep?.component;
  const progress = ((step + 1) / steps.length) * 100;

  // Phase 1 + 3: Mark as onboarding session on entry
  useEffect(() => {
    if (!sessionManager.isAuthenticated()) {
      sessionManager.startOnboarding(data.email || null);
    }
  }, []);

  // Persist onboarding data
  useEffect(() => {
    localStorage.setItem('vp_onboarding', JSON.stringify(data));
    // If email is now set, update onboarding session with it
    if (data.email && sessionManager.getStatus() === 'onboarding') {
      sessionManager.startOnboarding(data.email);
    }
  }, [data]);

  // Phase 4: Persist step on every change
  useEffect(() => {
    sessionManager.saveOnboardingStep(step);
  }, [step]);

  const handleNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleFinish = () => {
    // Phase 2: Register account + auto-login + mark active
    sessionManager.registerAccount({
      email: data.email,
      password_hash: data.password_hash,
      nombre: data.nombre,
      apellido: data.apellido,
      pais: data.pais,
      telefono: data.telefono,
      path: data.path,
      planLabel: data.planLabel,
      planValue: data.planValue,
      referral_code: data.referral_code || null,
      sponsor: data.sponsor || null,
    });

    sessionManager.activateUser({
      id: `vp_${Date.now()}`,
      name: `${data.nombre || ''} ${data.apellido || ''}`.trim(),
      email: data.email,
      rank: data.planLabel || 'Miembro',
      role: 'user',
      path: data.path,
      planLabel: data.planLabel,
      planValue: data.planValue,
    });

    navigate('/dashboard/home', { replace: true });
  };

  if (!StepComp) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#050c1a 0%,#0a1628 50%,#07101f 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 60px', fontFamily: 'Inter,sans-serif' }}>

      {/* Navbar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(10,15,25,0.9)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
        <button onClick={handleBack} disabled={step === 0}
          style={{ background: 'none', border: 'none', color: 'white', fontSize: 12, cursor: step > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4, opacity: step > 0 ? 1 : 0.25, fontFamily: 'Inter,sans-serif' }}>
          <ArrowLeft size={14} /> Volver
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={LOGO} alt="VP" style={{ height: 28, objectFit: 'contain', filter: 'brightness(0) invert(1) opacity(0.9)' }} />
          <div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 11, letterSpacing: 2 }}>VICION POWER</div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 600, color: '#3b82f6', fontSize: 7, letterSpacing: 2 }}>ACCESO</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{step + 1}/{steps.length}</span>
          <button onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter,sans-serif' }}>
            <Home size={13} /> Inicio
          </button>
        </div>
      </div>

      {/* Glow */}
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, background: 'radial-gradient(circle,rgba(59,130,246,0.06) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ width: '100%', paddingTop: '74px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>

        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: 520, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginBottom: 8 }}>
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
            style={{ height: '100%', background: 'linear-gradient(90deg,#1d6ef5,#60a5fa)', borderRadius: 2 }} />
        </div>

        {/* Step labels */}
        <div style={{ width: '100%', maxWidth: 520, marginBottom: 28, overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', minWidth: 'max-content', margin: '0 auto' }}>
            {steps.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: i === step ? 1 : 0.35 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: i <= step ? '#3b82f6' : 'rgba(255,255,255,0.2)' }} />
                {i === step && <span style={{ color: '#3b82f6', fontSize: 9, fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{s.label}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Step card */}
        <div style={{ width: '100%', maxWidth: 480 }}>
          <motion.div style={{ background: 'linear-gradient(135deg,#0d1f3c,#0a1628)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20, padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.28 }}>
                <StepComp onNext={handleNext} onFinish={handleFinish} setData={setData} data={data} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}