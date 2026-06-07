import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Home, CheckCircle, Loader2, Mail, Phone, User,
  Shield, CreditCard, BookOpen, Zap, Users, TrendingUp, Globe, Upload,
  ChevronRight, Star, Lock, FileText, Eye, EyeOff, Smartphone
} from 'lucide-react';
import { sessionManager } from '@/lib/sessionManager';

const LOGO = 'https://media.base44.com/images/public/user_695e30996105919ca32ab3e0/4441f7807_logodevcion.png';

// Simulated sponsor data — MVP codes included
const SPONSORS = {
  'VP2024': { name: 'Carlos Martínez', country: 'España', status: 'Activo', team: '47 personas', channel: 'WhatsApp +34 612 345 678' },
  'GROW01': { name: 'María López', country: 'México', status: 'Activo', team: '83 personas', channel: 'Telegram @marialopez_vp' },
  'REF999': { name: 'Andrés Gómez', country: 'Colombia', status: 'Activo', team: '31 personas', channel: 'WhatsApp +57 300 123 456' },
  // MVP demo codes
  '123456': { name: 'Representante Vicion', country: 'Internacional', status: 'Activo', team: 'Estructura general', channel: 'soporte@vicion.com' },
  '111111': { name: 'Equipo Mindbliss Power', country: 'Internacional', status: 'Activo', team: 'Estructura general', channel: 'soporte@vicion.com' },
  '000000': { name: 'Acceso Directo VP', country: 'Internacional', status: 'Activo', team: 'Estructura general', channel: 'soporte@vicion.com' },
};

const COUNTRIES = ['Argentina', 'Bolivia', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador', 'España', 'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'República Dominicana', 'Uruguay', 'Venezuela', 'Otro'];

const PARTICIPATION_LEVELS = [
  { label: 'Start', value: 500 },
  { label: 'Base', value: 1000 },
  { label: 'Progreso', value: 2500, recommended: true },
  { label: 'Expansión', value: 5000 },
  { label: 'Avance', value: 10000 },
];

const TOTAL_STEPS = 13;

// --- Shared UI primitives ---
function Field({ label, value, onChange, placeholder, type = 'text', options }) {
  if (options) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'block', marginBottom: 6 }}>{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, color: value ? 'white' : 'rgba(255,255,255,0.3)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
          <option value="" style={{ background: '#0d1f3c', color: 'rgba(255,255,255,0.4)' }}>{placeholder}</option>
          {options.map(o => <option key={o} value={o} style={{ background: '#0d1f3c', color: 'white' }}>{o}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  );
}

function PrimaryBtn({ children, onClick, loading, success, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled || loading || success}
      style={{
        width: '100%', padding: '15px 0', borderRadius: 12, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        background: success ? 'rgba(52,211,153,0.15)' : 'linear-gradient(135deg,#1d6ef5,#3b82f6)',
        border: success ? '1px solid rgba(52,211,153,0.4)' : 'none',
        color: success ? '#34d399' : 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 14,
        opacity: disabled ? 0.45 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
        boxShadow: success ? 'none' : '0 4px 20px rgba(59,130,246,0.3)',
      }}>
      {loading ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Procesando...</>
        : success ? <><CheckCircle size={16} /> Completado</>
        : children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

function Card({ children, glow }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(13,31,60,0.8),rgba(10,22,40,0.9))',
      border: `1px solid ${glow ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.2)'}`,
      borderRadius: 20, padding: 28,
      boxShadow: glow ? '0 0 40px rgba(59,130,246,0.15)' : '0 8px 32px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(12px)',
    }}>{children}</div>
  );
}

function SectionTitle({ label, title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {label && <p style={{ color: '#3b82f6', fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>}
      <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 22, marginBottom: 6, lineHeight: 1.3 }}>{title}</h2>
      {subtitle && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  );
}

function useSimulate(delay = 1600) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const run = (cb) => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setSuccess(true); setTimeout(cb, 800); }, delay);
  };
  return { loading, success, run };
}

// --- STEP 1: Entry Selection ---
function Step1_Entry({ data, onNext, setData }) {
  const [selected, setSelected] = useState(data.path || null);
  const options = [
    {
      id: 'direct',
      icon: User,
      title: 'Participación directa',
      desc: 'Accede al sistema como participante individual. Sin construcción de red ni código de referido.',
      tags: ['Productos', 'Actividad personal', 'Formación', 'Soporte'],
      color: '#3b82f6',
    },
    {
      id: 'network',
      icon: Users,
      title: 'Participación con red',
      desc: 'Accede con un código de referido y construye estructura dentro del ecosistema.',
      tags: ['Red binaria', 'Bonificaciones', 'Equipo', 'Comunicaciones'],
      color: '#10b981',
    },
  ];

  return (
    <Card glow>
      <SectionTitle label="Paso 1" title="¿Cómo deseas participar?" subtitle="Elige tu camino dentro del ecosistema. Puedes avanzar sin construir red, o elegir el camino de estructura y crecimiento." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {options.map(opt => {
          const Icon = opt.icon;
          const isSelected = selected === opt.id;
          return (
            <motion.button key={opt.id} onClick={() => setSelected(opt.id)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              style={{
                textAlign: 'left', padding: 20, borderRadius: 14, cursor: 'pointer',
                background: isSelected ? `${opt.color}15` : 'rgba(255,255,255,0.02)',
                border: `2px solid ${isSelected ? opt.color : 'rgba(255,255,255,0.08)'}`,
                transition: 'all 0.2s',
              }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${opt.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} style={{ color: opt.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 4, fontFamily: 'Montserrat,sans-serif' }}>{opt.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>{opt.desc}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {opt.tags.map(t => (
                      <span key={t} style={{ background: `${opt.color}15`, color: opt.color, fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
                {isSelected && <CheckCircle size={20} style={{ color: opt.color, flexShrink: 0, marginTop: 2 }} />}
              </div>
            </motion.button>
          );
        })}
      </div>
      <PrimaryBtn disabled={!selected} onClick={() => { setData(d => ({ ...d, path: selected })); onNext(); }}>
        Continuar <ArrowRight size={16} />
      </PrimaryBtn>
    </Card>
  );
}

// --- STEP 2: Email ---
function Step2_Email({ data, onNext, setData }) {
  const [email, setEmail] = useState(data.email || '');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const { loading: sendLoading, success: sendSuccess, run: runSend } = useSimulate(1400);
  const { loading: verifyLoading, success: verifySuccess, run: runVerify } = useSimulate(1200);

  const handleSend = () => runSend(() => setCodeSent(true));
  const handleVerify = () => runVerify(() => { setData(d => ({ ...d, email, emailVerified: true })); setTimeout(onNext, 400); });

  return (
    <Card>
      <SectionTitle label="Paso 2" title="Verifica tu correo" subtitle="Ingresa tu email y te enviaremos un código de verificación." />
      {!codeSent ? (
        <>
          <Field label="Correo electrónico" value={email} onChange={setEmail} placeholder="correo@ejemplo.com" type="email" />
          <PrimaryBtn onClick={handleSend} loading={sendLoading} success={sendSuccess} disabled={!email.includes('@')}>
            Enviar código <Mail size={15} />
          </PrimaryBtn>
        </>
      ) : (
        <>
          <div style={{ padding: 16, borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: 16, textAlign: 'center' }}>
            <Mail size={28} style={{ color: '#3b82f6', marginBottom: 8 }} />
            <p style={{ color: 'white', fontSize: 13, marginBottom: 4 }}>Código enviado a <strong>{email}</strong></p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Revisa tu bandeja de entrada</p>
          </div>
          <Field label="Código de verificación" value={code} onChange={v => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="• • • • • •" />
          <PrimaryBtn onClick={handleVerify} loading={verifyLoading} success={verifySuccess} disabled={code.length < 6}>
            Verificar código <CheckCircle size={15} />
          </PrimaryBtn>
        </>
      )}
    </Card>
  );
}

// --- STEP 3: Personal Info ---
function Step3_PersonalInfo({ data, onNext, setData }) {
  const [form, setForm] = useState({ nombre: '', apellido: '', pais: '', direccion: '', ...(data.personalInfo || {}) });
  const valid = form.nombre && form.apellido && form.pais;
  const { loading, success, run } = useSimulate(1000);

  return (
    <Card>
      <SectionTitle label="Paso 3" title="Información personal" subtitle="Completa tus datos para continuar con el proceso." />
      <Field label="Nombre" value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} placeholder="Tu nombre" />
      <Field label="Apellido" value={form.apellido} onChange={v => setForm(f => ({ ...f, apellido: v }))} placeholder="Tu apellido" />
      <Field label="País de residencia" value={form.pais} onChange={v => setForm(f => ({ ...f, pais: v }))} placeholder="Selecciona tu país" options={COUNTRIES} />
      <Field label="Dirección (opcional)" value={form.direccion} onChange={v => setForm(f => ({ ...f, direccion: v }))} placeholder="Calle, ciudad" />
      <PrimaryBtn disabled={!valid} loading={loading} success={success} onClick={() => run(() => { setData(d => ({ ...d, personalInfo: form })); onNext(); })}>
        Guardar y continuar <ArrowRight size={15} />
      </PrimaryBtn>
    </Card>
  );
}

// --- STEP 4: Phone Verification ---
function Step4_Phone({ data, onNext, setData }) {
  const [phone, setPhone] = useState(data.phone || '');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const { loading: sendL, success: sendS, run: runSend } = useSimulate(1300);
  const { loading: verifyL, success: verifyS, run: runVerify } = useSimulate(1200);

  return (
    <Card>
      <SectionTitle label="Paso 4" title="Verificación telefónica" subtitle="Confirma tu número de teléfono para mayor seguridad." />
      {!codeSent ? (
        <>
          <Field label="Número de teléfono" value={phone} onChange={setPhone} placeholder="+1 555 000 0000" type="tel" />
          <PrimaryBtn onClick={() => runSend(() => setCodeSent(true))} loading={sendL} success={sendS} disabled={phone.length < 8}>
            Enviar código SMS <Phone size={15} />
          </PrimaryBtn>
        </>
      ) : (
        <>
          <div style={{ padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 16, textAlign: 'center' }}>
            <Phone size={28} style={{ color: '#10b981', marginBottom: 8 }} />
            <p style={{ color: 'white', fontSize: 13, marginBottom: 4 }}>SMS enviado a <strong>{phone}</strong></p>
          </div>
          <Field label="Código SMS" value={code} onChange={v => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="• • • • • •" />
          <PrimaryBtn onClick={() => runVerify(() => { setData(d => ({ ...d, phone, phoneVerified: true })); setTimeout(onNext, 400); })}
            loading={verifyL} success={verifyS} disabled={code.length < 6}>
            Verificar número <CheckCircle size={15} />
          </PrimaryBtn>
        </>
      )}
    </Card>
  );
}

// --- STEP 5: Identity KYC ---
function Step5_Identity({ data, onNext, setData }) {
  const [form, setForm] = useState({ docType: '', docNumber: '', docCountry: '', confirmed: false, ...(data.identity || {}) });
  const valid = form.docType && form.docNumber && form.docCountry && form.confirmed;
  const { loading, success, run } = useSimulate(1800);

  return (
    <Card>
      <SectionTitle label="Paso 5" title="Validación de identidad" subtitle="Verificación básica requerida antes de continuar. Esta es una confirmación de datos, no una aprobación regulatoria final." />
      <Field label="Tipo de documento" value={form.docType} onChange={v => setForm(f => ({ ...f, docType: v }))} placeholder="Selecciona" options={['DNI / Cédula', 'Pasaporte', 'Licencia de conducir', 'Otro']} />
      <Field label="Número de documento" value={form.docNumber} onChange={v => setForm(f => ({ ...f, docNumber: v }))} placeholder="Número del documento" />
      <Field label="País de emisión" value={form.docCountry} onChange={v => setForm(f => ({ ...f, docCountry: v }))} placeholder="Selecciona país" options={COUNTRIES} />
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
        <input type="checkbox" checked={form.confirmed} onChange={e => setForm(f => ({ ...f, confirmed: e.target.checked }))}
          style={{ width: 18, height: 18, marginTop: 2, accentColor: '#3b82f6', cursor: 'pointer' }} />
        <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.5 }}>Confirmo que los datos proporcionados son correctos y corresponden a mi identidad real.</span>
      </label>
      <PrimaryBtn disabled={!valid} loading={loading} success={success} onClick={() => run(() => { setData(d => ({ ...d, identity: { ...form, status: 'verified' } })); onNext(); })}>
        Confirmar identidad <Shield size={15} />
      </PrimaryBtn>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center', marginTop: 10 }}>Verificación básica simulada · Proceso completo en activación final</p>
    </Card>
  );
}

// --- STEP 6: Referral Code (PATH B only) ---
function Step6_Referral({ data, onNext, setData }) {
  const [code, setCode] = useState(data.referralCode || '');
  const [sponsor, setSponsor] = useState(data.sponsor || null);
  const [notFound, setNotFound] = useState(false);
  const { loading, success, run } = useSimulate(1400);

  const handleSearch = () => {
    run(() => {
      const found = SPONSORS[code.toUpperCase()];
      if (found) { setSponsor(found); setNotFound(false); setData(d => ({ ...d, referralCode: code, sponsor: found })); }
      else { setNotFound(true); setSponsor(null); }
    });
  };

  return (
    <Card>
      <SectionTitle label="Paso 6" title="Código de referido" subtitle="Ingresa el código de tu representante directo para vincularte a la estructura." />
      <Field label="Código de referido" value={code} onChange={v => { setCode(v.toUpperCase()); setSponsor(null); setNotFound(false); }} placeholder="Ej. VP2024" />
      <PrimaryBtn onClick={handleSearch} loading={loading} success={success && !!sponsor} disabled={code.length < 4}>
        Buscar representante <ChevronRight size={15} />
      </PrimaryBtn>

      <AnimatePresence>
        {sponsor && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginTop: 16, padding: 16, borderRadius: 14, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} style={{ color: '#10b981' }} />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{sponsor.name}</p>
                <p style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>Representante activo · {sponsor.country}</p>
              </div>
              <CheckCircle size={20} style={{ color: '#10b981', marginLeft: 'auto' }} />
            </div>
            {[['Equipo', sponsor.team], ['Canal de apoyo', sponsor.channel]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{k}</span>
                <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <button onClick={onNext} style={{ width: '100%', marginTop: 14, padding: '13px 0', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Montserrat,sans-serif' }}>
              Continuar con este representante <ArrowRight size={15} style={{ display: 'inline', marginLeft: 6 }} />
            </button>
          </motion.div>
        )}
        {notFound && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 16, padding: 14, borderRadius: 12, background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.3)' }}>
            <p style={{ color: '#fb923c', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Código no encontrado</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 12 }}>Verifica el código con tu representante. También puedes continuar sin código y recibir asignación manual.</p>
            <button onClick={() => { setData(d => ({ ...d, referralCode: null, sponsor: null })); onNext(); }}
              style={{ background: 'none', border: '1px solid rgba(251,146,60,0.4)', color: '#fb923c', padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              Continuar sin código →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// --- STEP 6b: Password Creation ---
function Step6b_Password({ data, onNext, setData }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { loading, success, run } = useSimulate(800);

  const valid = password.length >= 8 && password === confirm;
  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <Card>
      <SectionTitle label="Paso 6B" title="Crea tu contraseña" subtitle="Esta contraseña se usará para acceder a tu panel en el futuro." />
      <div style={{ marginBottom: 14 }}>
        <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'block', marginBottom: 6 }}>Contraseña</label>
        <div style={{ position: 'relative' }}>
          <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
            style={{ width: '100%', padding: '12px 40px 12px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${password.length > 0 && password.length < 8 ? 'rgba(251,146,60,0.4)' : 'rgba(59,130,246,0.25)'}`, borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {password.length > 0 && password.length < 8 && <p style={{ color: '#fb923c', fontSize: 10, marginTop: 4 }}>Mínimo 8 caracteres</p>}
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'block', marginBottom: 6 }}>Confirmar contraseña</label>
        <div style={{ position: 'relative' }}>
          <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite tu contraseña"
            style={{ width: '100%', padding: '12px 40px 12px 14px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${mismatch ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.25)'}`, borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {mismatch && <p style={{ color: '#ef4444', fontSize: 10, marginTop: 4 }}>Las contraseñas no coinciden</p>}
        {!mismatch && confirm.length > 0 && password === confirm && <p style={{ color: '#34d399', fontSize: 10, marginTop: 4 }}>✓ Las contraseñas coinciden</p>}
      </div>
      <PrimaryBtn disabled={!valid} loading={loading} success={success}
        onClick={() => run(() => { setData(d => ({ ...d, password_hash: btoa(password) })); onNext(); })}>
        Guardar contraseña <Lock size={15} />
      </PrimaryBtn>
    </Card>
  );
}

// --- STEP 6c: 2FA Choice ---
function Step6c_2FA({ data, onNext, setData }) {
  const [enabled, setEnabled] = useState(false);
  const [done, setDone] = useState(false);
  const { loading, success, run } = useSimulate(1200);

  const handleContinue = () => {
    if (enabled) {
      run(() => { setDone(true); setData(d => ({ ...d, twofa_enabled: true })); setTimeout(onNext, 600); });
    } else {
      setData(d => ({ ...d, twofa_enabled: false }));
      onNext();
    }
  };

  return (
    <Card>
      <SectionTitle label="Seguridad" title="Doble factor de autenticación" subtitle="Añade una capa adicional de seguridad a tu cuenta. Puedes cambiarlo después." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {[
          { val: false, label: 'No activar por ahora', desc: 'Acceso estándar con contraseña', color: '#6b7280' },
          { val: true, label: 'Sí, activar 2FA', desc: 'Mayor seguridad en cada inicio de sesión', color: '#10b981' },
        ].map(opt => (
          <motion.button key={String(opt.val)} onClick={() => setEnabled(opt.val)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            style={{ textAlign: 'left', padding: 16, borderRadius: 12, cursor: 'pointer', background: enabled === opt.val ? `${opt.color}12` : 'rgba(255,255,255,0.02)', border: `2px solid ${enabled === opt.val ? opt.color : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Smartphone size={18} style={{ color: opt.color }} />
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{opt.label}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{opt.desc}</p>
              </div>
              {enabled === opt.val && <CheckCircle size={16} style={{ color: opt.color, marginLeft: 'auto' }} />}
            </div>
          </motion.button>
        ))}
      </div>
      {enabled && success && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 14, borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', marginBottom: 16, textAlign: 'center' }}>
          <CheckCircle size={24} style={{ color: '#10b981', margin: '0 auto 8px' }} />
          <p style={{ color: '#10b981', fontWeight: 700, fontSize: 13 }}>2FA configurado correctamente</p>
        </motion.div>
      )}
      <PrimaryBtn loading={loading} success={success && enabled} onClick={handleContinue}>
        {enabled ? 'Activar 2FA y continuar' : 'Continuar sin 2FA'} <ArrowRight size={15} />
      </PrimaryBtn>
    </Card>
  );
}

// --- STEP 7: Simulator ---
const SIM_SCENARIOS = [
  { key: 'conservador', label: 'Conservador', pct: '100% anual', multiplier: 1.0, color: '#f97316' },
  { key: 'realista',    label: 'Realista',    pct: '110%',       multiplier: 1.1, color: '#3b82f6' },
  { key: 'optimista',  label: 'Muy optimista', pct: '120%',      multiplier: 1.2, color: '#8b5cf6' },
];

function Step7_Simulator({ data, onNext, setData }) {
  const [level, setLevel] = useState(data.level || 2500);
  const [scenario, setScenario] = useState('realista');

  const sc = SIM_SCENARIOS.find(s => s.key === scenario) || SIM_SCENARIOS[1];
  const annual = Math.round(level * sc.multiplier);
  const monthly = Math.round(annual / 12);

  return (
    <Card glow>
      <SectionTitle label="Paso 8" title="Simulación ilustrativa" subtitle="Explora estimaciones según tu nivel. No representa garantías ni rendimientos asegurados." />

      <div style={{ marginBottom: 20 }}>
        <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 8 }}>Nivel de participación</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {PARTICIPATION_LEVELS.map(p => (
            <button key={p.value} onClick={() => setLevel(p.value)}
              style={{ padding: '8px 4px', borderRadius: 8, border: `1px solid ${level === p.value ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`, background: level === p.value ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)', color: level === p.value ? '#60a5fa' : 'rgba(255,255,255,0.4)', fontSize: 10, cursor: 'pointer', fontWeight: 700, textAlign: 'center' }}>
              {p.label}<br /><span style={{ fontSize: 9 }}>${(p.value / 1000).toFixed(p.value < 1000 ? 1 : 0)}k</span>
            </button>
          ))}
        </div>
      </div>

      {/* Segmented scenario selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, display: 'block', marginBottom: 8 }}>Escenario de rendimiento</label>
        <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          {SIM_SCENARIOS.map((s, i) => (
            <motion.button key={s.key} onClick={() => setScenario(s.key)} whileTap={{ scale: 0.97 }}
              style={{ flex: 1, padding: '10px 6px', background: scenario === s.key ? `${s.color}20` : 'rgba(255,255,255,0.02)', border: 'none', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none', color: scenario === s.key ? s.color : 'rgba(255,255,255,0.4)', fontSize: 10, cursor: 'pointer', fontWeight: 700, textAlign: 'center', transition: 'all 0.2s' }}>
              <div>{s.label}</div>
              <div style={{ fontSize: 9, opacity: 0.8, marginTop: 2 }}>{s.pct}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Result cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Estimación anual', value: `$${annual.toLocaleString()}`, color: sc.color, sub: `Escenario ${sc.label.toLowerCase()}` },
          { label: 'Estimación mensual', value: `$${monthly.toLocaleString()}`, color: '#10b981', sub: 'Promedio estimado' },
        ].map((m, i) => (
          <motion.div key={i} animate={{ opacity: [0.7, 1] }} transition={{ duration: 0.3 }}
            style={{ padding: 16, borderRadius: 12, background: `${m.color}10`, border: `1px solid ${m.color}25`, textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 6, fontWeight: 600 }}>{m.label}</p>
            <motion.p key={m.value} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}
              style={{ color: m.color, fontWeight: 900, fontSize: 20, fontFamily: 'Montserrat,sans-serif', marginBottom: 4 }}>{m.value}</motion.p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{m.sub}</p>
          </motion.div>
        ))}
      </div>

      <PrimaryBtn onClick={() => { setData(d => ({ ...d, level, simScenario: scenario })); onNext(); }}>
        Continuar al pago <ArrowRight size={15} />
      </PrimaryBtn>
    </Card>
  );
}

// --- STEP 8: Payment ---
function Step8_Payment({ data, onNext, setData }) {
  const [method, setMethod] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const { loading, success, run } = useSimulate(2200);
  const levelName = PARTICIPATION_LEVELS.find(p => p.value === data.level)?.label || 'Progreso';

  return (
    <Card glow>
      <SectionTitle label="Paso 9" title="Activar participación" subtitle="Revisa el resumen y confirma tu activación." />

      <div style={{ padding: 16, borderRadius: 14, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: 16 }}>
        {[
          ['Nivel', levelName],
          ['Monto', `$${(data.level || 2500).toLocaleString()} USD`],
          ['Camino', data.path === 'network' ? 'Participación con red' : 'Participación directa'],
          ...(data.sponsor ? [['Representante', data.sponsor.name]] : []),
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{k}</span>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10 }}>Método de pago</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {['Transferencia bancaria', 'USDT / Cripto', 'Tarjeta internacional', 'Otro'].map(m => (
          <button key={m} onClick={() => setMethod(m)}
            style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${method === m ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`, background: method === m ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)', color: method === m ? '#60a5fa' : 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
            {m}
          </button>
        ))}
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2, accentColor: '#3b82f6', cursor: 'pointer' }} />
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 1.5 }}>He revisado el resumen y acepto los términos de participación del ecosistema Mindbliss Power.</span>
      </label>

      <PrimaryBtn disabled={!method || !confirmed} loading={loading} success={success}
        onClick={() => run(() => { setData(d => ({ ...d, paymentStatus: 'completed', paymentMethod: method })); onNext(); })}>
        {loading ? 'Procesando activación...' : success ? 'Activación confirmada' : 'Confirmar activación'} {!loading && !success && <CreditCard size={15} />}
      </PrimaryBtn>
    </Card>
  );
}

// --- STEP 9: Welcome ---
function Step9_Welcome({ data, onNext }) {
  const isNetwork = data.path === 'network';
  const levelName = PARTICIPATION_LEVELS.find(p => p.value === data.level)?.label || 'Progreso';
  const modules = isNetwork
    ? ['Dashboard', 'Red binaria', 'Equipo', 'Bonificaciones', 'Comunicaciones', 'Rango', 'Soporte']
    : ['Dashboard', 'Productos', 'Actividad', 'Perfil', 'Soporte', 'Formación'];

  return (
    <Card glow>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          style={{ width: 80, height: 80, margin: '0 auto 20px', borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '2px solid rgba(52,211,153,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={40} style={{ color: '#34d399' }} />
        </motion.div>
        <p style={{ color: '#34d399', fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>BIENVENIDO</p>
        <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 24, marginBottom: 8 }}>
          {data.personalInfo?.nombre ? `¡Bienvenido, ${data.personalInfo.nombre}!` : '¡Bienvenido al ecosistema!'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          {isNetwork ? 'Acceso a red habilitado.' : 'Participación directa activada.'}
          {' '}Nivel: <strong style={{ color: '#3b82f6' }}>{levelName}</strong>
        </p>
      </div>

      <div style={{ padding: 14, borderRadius: 12, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', marginBottom: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Módulos activados</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {modules.map(m => (
            <span key={m} style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>{m}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {['Identidad verificada', 'Pago procesado', isNetwork ? 'Red binaria vinculada' : 'Acceso directo activado', 'Módulos habilitados'].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={14} style={{ color: '#34d399', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{item}</span>
          </motion.div>
        ))}
      </div>

      <PrimaryBtn onClick={onNext}>
        Continuar al siguiente paso <ArrowRight size={15} />
      </PrimaryBtn>
    </Card>
  );
}

// --- STEP 10: Documents ---
function Step10_Documents({ data, onNext, setData }) {
  const [uploaded, setUploaded] = useState({ front: false, back: false });
  const [status, setStatus] = useState('idle');
  const { loading, success, run } = useSimulate(2000);

  const handleSubmit = () => run(() => { setStatus('review'); setData(d => ({ ...d, documentsStatus: 'pending_review' })); setTimeout(onNext, 400); });

  return (
    <Card>
      <SectionTitle label="Paso 10" title="Completar identidad" subtitle="Sube los documentos necesarios para completar tu verificación de identidad. Revisión en proceso." />
      {['Frente del documento', 'Reverso del documento'].map((label, i) => {
        const key = i === 0 ? 'front' : 'back';
        return (
          <div key={key} style={{ marginBottom: 12, padding: 16, borderRadius: 12, border: `1px dashed ${uploaded[key] ? 'rgba(52,211,153,0.4)' : 'rgba(59,130,246,0.25)'}`, background: uploaded[key] ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {uploaded[key] ? <CheckCircle size={18} style={{ color: '#34d399' }} /> : <Upload size={18} style={{ color: '#3b82f6' }} />}
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{label}</span>
            </div>
            <button onClick={() => setUploaded(u => ({ ...u, [key]: true }))}
              style={{ padding: '6px 14px', borderRadius: 8, background: uploaded[key] ? 'rgba(52,211,153,0.15)' : 'rgba(59,130,246,0.15)', border: 'none', color: uploaded[key] ? '#34d399' : '#3b82f6', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
              {uploaded[key] ? 'Subido ✓' : 'Seleccionar'}
            </button>
          </div>
        );
      })}
      <PrimaryBtn loading={loading} success={success}
        disabled={!uploaded.front && !uploaded.back}
        onClick={handleSubmit}>
        Enviar documentos <FileText size={15} />
      </PrimaryBtn>
      <button onClick={onNext} style={{ width: '100%', marginTop: 10, padding: '10px 0', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer' }}>
        Completar más adelante →
      </button>
    </Card>
  );
}

// --- STEP 11: Training ---
function Step11_Training({ data, onNext, setData }) {
  const [activeCard, setActiveCard] = useState(0);
  const isNetwork = data.path === 'network';
  const modules = [
    { icon: Globe, title: 'Qué es Mindbliss Power', body: 'Un ecosistema de participación estructurada con beneficios progresivos. No es una inversión tradicional: es un sistema de acceso con valor en el tiempo.' },
    { icon: Zap, title: 'Cómo funciona la participación', body: 'Al activar tu participación, accedes a beneficios según tu nivel, permanencia y actividad. El sistema recompensa la constancia.' },
    { icon: TrendingUp, title: 'Cómo crece tu posición', body: 'Tu posición evoluciona con el tiempo, la actividad y opcionalmente la construcción de estructura. No hay atajos, pero sí un camino claro.' },
    { icon: Shield, title: 'Lo que debes saber', body: 'No existen rendimientos garantizados. Los beneficios dependen del sistema y tu participación activa. Actúa con claridad y sin expectativas equivocadas.' },
    ...(isNetwork ? [{ icon: Users, title: 'Tu primer paso como líder', body: 'Comunica con claridad. No prometas resultados. Educa antes de invitar. Tu rol es guiar, no presionar.' }] : []),
  ];

  return (
    <Card>
      <SectionTitle label="Paso 11" title="Formación rápida" subtitle="Antes de activar tu panel, revisa estos puntos clave." />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {modules.map((m, i) => (
          <button key={i} onClick={() => setActiveCard(i)}
            style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${activeCard === i ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, background: activeCard === i ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeCard === i ? '#60a5fa' : 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
            {i + 1}. {m.title.split(' ').slice(0, 2).join(' ')}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeCard} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ padding: 18, borderRadius: 12, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: 20, minHeight: 110 }}>
          {(() => { const M = modules[activeCard]; const Icon = M.icon; return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Icon size={18} style={{ color: '#3b82f6' }} />
                <p style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{M.title}</p>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>{M.body}</p>
            </>
          ); })()}
        </motion.div>
      </AnimatePresence>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {activeCard > 0 && <button onClick={() => setActiveCard(a => a - 1)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer' }}>← Anterior</button>}
        {activeCard < modules.length - 1
          ? <button onClick={() => setActiveCard(a => a + 1)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Siguiente →</button>
          : <PrimaryBtn onClick={() => { setData(d => ({ ...d, trainingCompleted: true })); onNext(); }}>Completar formación <BookOpen size={14} /></PrimaryBtn>
        }
      </div>
    </Card>
  );
}

// --- STEP 12: Activation ---
function Step12_Activate({ data, onNext }) {
  const { loading, success, run } = useSimulate(2000);
  const navigate = useNavigate();
  const isNetwork = data.path === 'network';

  if (success) {
    return (
      <Card glow>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: 3, duration: 0.4 }}
            style={{ fontSize: 56, marginBottom: 16 }}>🎉</motion.div>
          <p style={{ color: '#34d399', fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>ACTIVACIÓN COMPLETA</p>
          <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 22, marginBottom: 10 }}>Tu panel está listo</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 28 }}>
            {isNetwork ? 'Acceso completo con red habilitado.' : 'Acceso básico activado correctamente.'}
          </p>
          <button onClick={() => {
            const isNetwork = data.path === 'network';
            const userName = data.personalInfo ? `${data.personalInfo.nombre} ${data.personalInfo.apellido}` : 'Participante';
            const userData = {
              id: `vp_${Date.now()}`,
              name: userName,
              email: data.email || '',
              phone: data.phone || '',
              path: data.path,
              referral_code: data.referralCode || null,
              referred_by: data.sponsor?.name || null,
              upline_id: data.referralCode || null,
              user_type: isNetwork ? 'NETWORK' : 'DIRECT',
              rank: 'Miembro',
              level: 1,
              planValue: data.level || 1000,
              twofa_enabled: data.twofa_enabled || false,
              identity_status: data.identity?.status || 'pending',
              payment_status: data.paymentStatus || 'completed',
              documents_status: data.documentsStatus || 'pending',
              training_status: data.trainingCompleted ? 'completed' : 'pending',
              activated_at: new Date().toISOString(),
            };
            // Register account for login
            if (data.password_hash) {
              sessionManager.registerAccount({ email: data.email?.toLowerCase(), password_hash: data.password_hash, ...userData });
            }
            sessionManager.activateUser(userData);
            navigate('/dashboard/home');
          }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#1d6ef5,#3b82f6)', color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 14, padding: '14px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}>
            Entrar al panel <ArrowRight size={18} />
          </button>
        </motion.div>
      </Card>
    );
  }

  return (
    <Card glow>
      <SectionTitle label="Paso 12" title="Activación del panel" subtitle="Todo está listo. Activa tu acceso y entra al ecosistema." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {[
          ['Correo verificado', data.emailVerified],
          ['Teléfono verificado', data.phoneVerified],
          ['Identidad confirmada', data.identity?.status === 'verified'],
          ['Pago procesado', data.paymentStatus === 'completed'],
          ['Formación completada', data.trainingCompleted],
        ].map(([label, done]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: done ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${done ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            {done ? <CheckCircle size={14} style={{ color: '#34d399' }} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />}
            <span style={{ color: done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', fontSize: 13 }}>{label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: done ? '#34d399' : 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{done ? 'Completado' : 'Pendiente'}</span>
          </div>
        ))}
      </div>
      <PrimaryBtn loading={loading} onClick={() => run(() => {})}>
        Activar panel ahora <Zap size={15} />
      </PrimaryBtn>
    </Card>
  );
}

// --- MAIN FLOW ---
const STEPS = [
  { id: 0, label: 'Inicio', Component: Step1_Entry },
  { id: 1, label: 'Email', Component: Step2_Email },
  { id: 2, label: 'Datos', Component: Step3_PersonalInfo },
  { id: 3, label: 'Teléfono', Component: Step4_Phone },
  { id: 4, label: 'Identidad', Component: Step5_Identity },
  { id: 5, label: 'Referido', Component: Step6_Referral },     // skipped for direct path
  { id: 6, label: 'Contraseña', Component: Step6b_Password },
  { id: 7, label: 'Seguridad', Component: Step6c_2FA },
  { id: 8, label: 'Simulación', Component: Step7_Simulator },
  { id: 9, label: 'Pago', Component: Step8_Payment },
  { id: 10, label: 'Bienvenida', Component: Step9_Welcome },
  { id: 11, label: 'Documentos', Component: Step10_Documents },
  { id: 12, label: 'Formación', Component: Step11_Training },
  { id: 13, label: 'Activación', Component: Step12_Activate },
];

export default function OnboardingStart() {
  const navigate = useNavigate();
  const savedStep = parseInt(sessionStorage.getItem('ob_step') || '0');
  const savedData = JSON.parse(sessionStorage.getItem('ob_data') || '{}');
  const [step, setStep] = useState(savedStep);
  const [data, setDataRaw] = useState(savedData);

  const setData = (updater) => {
    setDataRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      sessionStorage.setItem('ob_data', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => { sessionStorage.setItem('ob_step', String(step)); }, [step]);

  // Skip referral step for direct path (step 5)
  const goNext = () => {
    let nextStep = step + 1;
    if (step === 4 && data.path === 'direct') nextStep = 6; // skip referral step 5
    setStep(Math.min(nextStep, STEPS.length - 1));
  };

  const goBack = () => {
    let prevStep = step - 1;
    if (step === 6 && data.path === 'direct') prevStep = 4; // skip back over referral
    setStep(Math.max(0, prevStep));
  };

  const { Component } = STEPS[Math.min(step, STEPS.length - 1)];
  const progress = Math.min(((step) / (STEPS.length - 1)) * 100, 100);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 50%, #07101f 100%)',
      fontFamily: 'Inter,sans-serif',
      position: 'relative',
    }}>
      {/* Fixed Nav */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(5,12,26,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(59,130,246,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px',
      }}>
        <button onClick={goBack} disabled={step === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'white', fontSize: 12, cursor: step === 0 ? 'not-allowed' : 'pointer', opacity: step === 0 ? 0.2 : 0.7, fontFamily: 'Inter,sans-serif' }}>
          <ArrowLeft size={14} /> Volver
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={LOGO} alt="VP" style={{ height: 28, objectFit: 'contain', filter: 'brightness(0) invert(1) opacity(0.85)' }} />
          <div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 11, letterSpacing: 2 }}>MINDBLISS POWER</div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 600, color: '#3b82f6', fontSize: 7, letterSpacing: 2 }}>ACCESO</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{step + 1} / {STEPS.length}</span>
          <button onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            <Home size={13} /> Inicio
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 57, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.06)', zIndex: 49 }}>
        <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
          style={{ height: '100%', background: 'linear-gradient(90deg,#1d6ef5,#60a5fa)' }} />
      </div>

      {/* Background glow */}
      <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ paddingTop: 80, paddingBottom: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

        {/* Step indicator — clean, no image */}
        <div style={{ width: '100%', maxWidth: 520, marginBottom: 20, padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              {STEPS[Math.min(step, STEPS.length - 1)].label}
            </p>
            <div style={{ display: 'flex', gap: 4 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ width: i === step ? 20 : 6, height: 4, borderRadius: 4, background: i <= step ? '#3b82f6' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Step card */}
        <div style={{ width: '100%', maxWidth: 520, padding: '0 16px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}>
              <Component data={data} onNext={goNext} setData={setData} />
            </motion.div>
          </AnimatePresence>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 24, textAlign: 'center' }}>
          Mindbliss Power · Proceso seguro y guiado
        </p>
      </div>
    </div>
  );
}