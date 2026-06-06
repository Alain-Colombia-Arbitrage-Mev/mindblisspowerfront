import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Mail, Lock, User, CreditCard, Loader2, Layers, BookOpen, Network, LayoutDashboard, ChevronRight } from 'lucide-react';

const LOGO = 'https://media.base44.com/images/public/user_695e30996105919ca32ab3e0/4441f7807_logodevcion.png';

const STEPS = [
  { id: 1, label: 'Registro', icon: User, api: 'POST /auth/register' },
  { id: 2, label: 'Confirmar correo', icon: Mail, api: 'POST /auth/verify-email' },
  { id: 3, label: 'Activar código', icon: Lock, api: 'POST /auth/activate' },
  { id: 4, label: 'Tu decisión', icon: Layers, api: 'POST /decision/choice' },
  { id: 5, label: 'Elegir plan', icon: Layers, api: 'POST /plans/select' },
  { id: 6, label: 'Confirmar pago', icon: CreditCard, api: 'POST /payments/confirm' },
  { id: 7, label: 'Asignación de acceso', icon: CheckCircle, api: 'POST /user/state' },
  { id: 8, label: 'Dashboard', icon: LayoutDashboard, api: 'GET /dashboard' },
  { id: 9, label: 'Solicitud crecimiento', icon: ArrowRight, api: 'POST /growth/request' },
  { id: 10, label: 'Formación', icon: BookOpen, api: 'GET /academy/modules' },
  { id: 11, label: 'Activación red', icon: Network, api: 'POST /network/activate' },
];

const PLANS = [
  { label: 'Inicio', value: 500, desc: 'Acceso inicial al ecosistema' },
  { label: 'Base', value: 1000, desc: 'Participación fundamental en el sistema' },
  { label: 'Progreso', value: 2500, desc: 'Participación más amplia y estructurada', recommended: true },
  { label: 'Expansión', value: 5000, desc: 'Mayor posicionamiento dentro del sistema' },
  { label: 'Avance', value: 10000, desc: 'Acceso a beneficios avanzados' },
  { label: 'Posición', value: 25000, desc: 'Máximo posicionamiento en la estructura' },
];

function useSimulatedCall(onDone) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const run = () => {
    setLoading(true);
    setSuccess(false);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(onDone, 900);
    }, 1400);
  };

  return { loading, success, run };
}

/* ── Shared primitives ───────────────────────────────────────────────── */

function StepShell({ title, subtitle, api, children }) {
  return (
    <div style={{ background: 'linear-gradient(135deg,#0d1f3c,#0a1628)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20, padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div />
        <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 9, fontFamily: 'Montserrat,sans-serif', letterSpacing: 1 }}>{api}</span>
      </div>
      <h2 style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 22, marginBottom: 6 }}>{title}</h2>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 22, lineHeight: 1.6 }}>{subtitle}</p>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}

function Btn({ children, onClick, loading, success, disabled, color = '#3b82f6' }) {
  return (
    <button onClick={onClick} disabled={disabled || loading || success}
      style={{ width: '100%', padding: '14px 0', borderRadius: 12, background: success ? 'rgba(52,211,153,0.2)' : `linear-gradient(135deg,${color === '#3b82f6' ? '#1d6ef5' : color},${color})`, border: success ? '1px solid rgba(52,211,153,0.4)' : 'none', color: success ? '#34d399' : 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 14, cursor: disabled || loading ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
      {loading ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Procesando...</> : success ? <><CheckCircle size={16} /> Completado</> : <>{children}</>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

/* ── Step components ───────────────────────────────────────────────── */

function StepRegister({ onNext }) {
   const [form, setForm] = useState({ name: '', email: '', password: '' });
   const { loading, success, run } = useSimulatedCall(onNext);
   const valid = form.name && form.email && form.password.length >= 6;
   const navigate = useNavigate();

   return (
     <StepShell title="Crea tu cuenta" subtitle="Ingresa tus datos para comenzar" api="POST /auth/register">
       <div style={{ marginBottom: 24, maxWidth: 400 }}>
         <p style={{ fontSize: 18, color: '#E5E7EB', lineHeight: 1.5, margin: 0, marginBottom: 8 }}>Estás a un paso de comenzar.</p>
         <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>Accede a una estructura diseñada para avanzar con claridad, sin depender del azar.</p>
       </div>
       <Input label="Nombre completo" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Tu nombre" />
       <Input label="Correo electrónico" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="correo@ejemplo.com" type="email" />
       <Input label="Contraseña" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="Mínimo 6 caracteres" type="password" />
       <Btn onClick={run} loading={loading} success={success} disabled={!valid}>Acceder al sistema</Btn>
       <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12 }}>Proceso guiado y seguro</p>
       <div style={{ marginTop: 16, textAlign: 'center' }}>
         <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 8px 0' }}>¿Ya tienes cuenta?</p>
         <button
           onClick={() => navigate('/login')}
           style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'color 200ms' }}
           onMouseEnter={e => e.target.style.color = '#60a5fa'}
           onMouseLeave={e => e.target.style.color = '#3b82f6'}
         >
           Inicia sesión aquí
         </button>
       </div>
     </StepShell>
   );
 }

function StepVerifyEmail({ onNext }) {
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Revisa tu correo" subtitle="Hemos enviado un enlace de verificación a tu dirección de correo." api="POST /auth/verify-email">
      <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center', marginBottom: 16 }}>
        <Mail size={36} style={{ color: '#3b82f6', marginBottom: 10 }} />
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6 }}>Haz clic en el enlace del correo para continuar. Si no lo ves, revisa tu carpeta de spam.</p>
      </div>
      <Btn onClick={run} loading={loading} success={success}>Ya verifiqué mi correo</Btn>
    </StepShell>
  );
}

function StepActivate({ onNext }) {
  const [code, setCode] = useState('');
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Estás a punto de completar tu acceso" subtitle="Todo está listo. Solo necesitas confirmar con claridad." api="POST /auth/activate">
      <div style={{ marginBottom: 16 }}>
        <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, display: 'block', marginBottom: 6 }}>Código de activación</label>
        <input
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="• • • • • •"
          style={{ width: '100%', padding: '16px 0', textAlign: 'center', letterSpacing: '0.4em', fontSize: 22, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12, color: 'white', outline: 'none', fontFamily: 'Montserrat,sans-serif', boxSizing: 'border-box' }}
        />
      </div>
      <Btn onClick={run} loading={loading} success={success} disabled={code.length < 6}>Verificar código</Btn>
    </StepShell>
  );
}

function StepDecisionLayer({ onNext }) {
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Elige cómo quieres avanzar" subtitle="No se trata de cuánto. Se trata de desde dónde empiezas." api="POST /decision/choice">
      <div style={{ padding: 28, borderRadius: 16, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center', marginBottom: 24 }}>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
          Tu punto de partida no define tu destino. Define tu velocidad. Elige con calma.
        </p>
      </div>
      <div style={{ padding: '20px 0', textAlign: 'center', marginBottom: 20 }}>
        <p style={{ color: 'white', fontSize: 14, fontWeight: 600, lineHeight: 1.6, margin: '0 0 8px 0' }}>
          La mayoría se queda pensando.
        </p>
        <p style={{ color: 'white', fontSize: 14, fontWeight: 600, lineHeight: 1.6, margin: '0 0 12px 0' }}>
          Otros deciden avanzar.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
          Hoy decides en cuál estás.
        </p>
      </div>
      <Btn onClick={run} loading={loading} success={success}>Continuar</Btn>
    </StepShell>
  );
}

function StepSelectPlan({ onNext }) {
  const [selected, setSelected] = useState(null);
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Elige tu nivel" subtitle="Selecciona el plan que mejor se adapta a tu visión." api="POST /plans/select">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {PLANS.map(p => {
          const isSelected = selected === p.value;
          const isRecommended = p.recommended;
          return (
            <div key={p.value} style={{ position: 'relative' }}>
              {isRecommended && (
                <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#1d6ef5,#3b82f6)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 12, zIndex: 10, fontFamily: 'Montserrat,sans-serif' }}>
                  RECOMENDADO
                </div>
              )}
              <button
                onClick={() => setSelected(p.value)}
                style={{
                  width: '100%',
                  padding: 16,
                  borderRadius: 14,
                  border: `2px solid ${isSelected || isRecommended ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.08)'}`,
                  background: isSelected ? 'rgba(59,130,246,0.2)' : isRecommended ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease',
                  boxShadow: isSelected || isRecommended ? '0 8px 24px rgba(59,130,246,0.15)' : '0 2px 8px rgba(0,0,0,0.2)',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 14, fontFamily: 'Montserrat,sans-serif', marginBottom: 2 }}>{p.label}</div>
                  <div style={{ color: '#3b82f6', fontSize: 12, fontWeight: 600 }}>${p.value.toLocaleString()} USD</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 1.4 }}>{p.desc}</div>
                {isRecommended && (
                  <div style={{ color: 'rgba(59,130,246,0.6)', fontSize: 10, lineHeight: 1.4, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(59,130,246,0.2)' }}>Elegido por muchas personas que comienzan</div>
                )}
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 20, textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.7, margin: '0 0 8px 0' }}>
          No necesitas tomar la decisión perfecta.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.7, margin: '0 0 8px 0' }}>
          Solo necesitas empezar con claridad.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
          Puedes avanzar progresivamente dentro del sistema.
        </p>
      </div>
      <Btn onClick={run} loading={loading} success={success} disabled={!selected}>Continuar con este nivel</Btn>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 10, margin: '10px 0 0 0' }}>Podrás revisar todo antes de confirmar</p>
    </StepShell>
  );
}

function StepConfirmPayment({ onNext }) {
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Proceso de activación" subtitle="Selecciona tu método de pago para completar tu acceso." api="POST /payments/confirm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {['Proceso seguro', 'Validación', 'Confirmación final'].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
            <span style={{ color: '#34d399', fontSize: 16, fontWeight: 700 }}>✓</span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>{item}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: 20, borderRadius: 14, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: 20 }}>
        {[['Nivel seleccionado', 'Avance'], ['Método de pago', 'A continuación'], ['Permanencia', 'Según tu actividad']].map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? '1px solid rgba(59,130,246,0.15)' : 'none' }}>
            <span style={{ color: '#3b82f6', fontSize: 12 }}>•</span>
            <div style={{ flex: 1 }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, display: 'block', marginBottom: 2 }}>{k}</span>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{v}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '16px 0', textAlign: 'center', marginBottom: 20 }}>
        <p style={{ color: 'white', fontSize: 14, fontWeight: 400, lineHeight: 1.6, margin: '0 0 8px 0' }}>
          Este es un proceso guiado.
        </p>
        <p style={{ color: 'white', fontSize: 14, fontWeight: 400, lineHeight: 1.6, margin: '0 0 12px 0' }}>
          Podrás ver cada paso antes de finalizar.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 300, lineHeight: 1.6, margin: 0 }}>
          No estás tomando una decisión a ciegas.
        </p>
      </div>
      <Btn onClick={run} loading={loading} success={success}>Continuar al pago</Btn>
    </StepShell>
  );
}

function StepFinalConfirmation({ onNext }) {
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Confirmación final" subtitle="Estás a punto de activar tu participación dentro del sistema." api="POST /confirmation/final">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {['Resumen de participación', 'Contrato aceptado', 'Estado listo para activar'].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
            <span style={{ color: '#34d399', fontSize: 18, fontWeight: 700 }}>✓</span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{item}</span>
          </div>
        ))}
      </div>
      <Btn onClick={run} loading={loading} success={success}>Proceder al pago</Btn>
    </StepShell>
  );
}

function StepContractReview({ onNext }) {
  const [checks, setChecks] = useState({ agree: false, understand: false, results: false, confirm: false });
  const allChecked = Object.values(checks).every(v => v);
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Acuerdo de participación" subtitle="Este acuerdo define tu acceso y funcionamiento dentro del sistema." api="POST /contracts/review">
      <div style={{ maxHeight: 300, overflowY: 'auto', padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7 }}>
          <p style={{ marginBottom: 12, fontWeight: 600, color: 'white' }}>Puntos clave del acuerdo:</p>
          {['Aceptas participar en la estructura del sistema con el nivel seleccionado.', 'Tu participación se regula según nuestras políticas de operación.', 'Mantendrás acceso mientras cumplas con los requisitos de actividad.', 'Aceptas las políticas de conducta y procedimientos del ecosistema.'].map((point, i) => (
            <p key={i} style={{ marginBottom: 10, display: 'flex', gap: 8 }}>
              <span style={{ color: '#3b82f6', flexShrink: 0 }}>•</span>
              <span>{point}</span>
            </p>
          ))}
        </div>
      </div>
      <button onClick={() => {}} style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: 'transparent', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, transition: 'all 0.2s' }}>Ver documento completo</button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {[{ key: 'agree', label: 'He leído y acepto el acuerdo' }, { key: 'understand', label: 'Comprendo el funcionamiento del sistema' }, { key: 'results', label: 'Entiendo que los resultados dependen del desarrollo del ecosistema' }, { key: 'confirm', label: 'Confirmo que deseo continuar' }].map(item => (
          <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={checks[item.key]} onChange={e => setChecks(c => ({ ...c, [item.key]: e.target.checked }))} style={{ width: 20, height: 20, marginTop: 2, cursor: 'pointer', accentColor: '#3b82f6' }} />
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.5 }}>{item.label}</span>
          </label>
        ))}
      </div>
      <Btn onClick={run} loading={loading} success={success} disabled={!allChecked}>Aceptar y continuar</Btn>
    </StepShell>
  );
}

function StepPaymentSuccess({ onNext }) {
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Tu acceso ha sido activado" subtitle="Ahora formas parte de una estructura diseñada para avanzar con claridad." api="POST /payment/success" showContent={false}>
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            width: 100,
            height: 100,
            margin: '0 auto 32px',
            background: 'rgba(52,211,153,0.15)',
            border: '2px solid rgba(52,211,153,0.4)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 28L24 38L44 18" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ marginBottom: 32 }}
        >
          <p style={{ color: 'white', fontSize: 15, fontWeight: 500, lineHeight: 1.7, marginBottom: 12 }}>
            Todo está en orden.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7 }}>
            Tu proceso ha sido registrado correctamente.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ marginBottom: 40 }}
        >
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>
            Ahora te guiaremos paso a paso.
          </p>
        </motion.div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {['Participación confirmada', 'Acceso inmediato habilitado', 'Red lista para activar'].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}
            >
              <span style={{ color: '#34d399', fontSize: 14 }}>✓</span>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>{item}</span>
            </motion.div>
          ))}
        </div>
        <Btn onClick={run} loading={loading} success={success}>Continuar</Btn>
      </div>
    </StepShell>
  );
}

function StepNextSteps({ onNext }) {
  const { loading, success, run } = useSimulatedCall(onNext);
  const steps = [
    { num: 1, text: 'Completar tu perfil', desc: 'Agrega información para personalizar tu experiencia' },
    { num: 2, text: 'Acceder a tu panel', desc: 'Visualiza beneficios, estado y progreso en tiempo real' },
    { num: 3, text: 'Revisar tu estructura', desc: 'Entiende cómo funciona tu red y oportunidades' },
    { num: 4, text: 'Activar tu guía', desc: 'Comienza con herramientas y formación' },
  ];
  return (
    <StepShell title="Tu siguiente paso" subtitle="Aquí está lo que puedes hacer ahora." api="POST /activation/next">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            style={{
              display: 'flex',
              gap: 14,
              padding: 16,
              borderRadius: 12,
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.15)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.12)';
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.06)';
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)';
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg,#1d6ef5,#3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontWeight: 700,
              color: 'white',
              fontSize: 14,
            }}>
              {step.num}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{step.text}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.4 }}>{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <Btn onClick={run} loading={loading} success={success}>Ir a mi panel</Btn>
    </StepShell>
  );
}

function StepStateAssign({ onNext }) {
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Asignación de acceso" subtitle="El sistema está configurando tu capa de acceso." api="POST /user/state">
      <div style={{ padding: 20, borderRadius: 14, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🔷</div>
        <p style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Estado 1 — Miembro activo</p>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>Acceso básico habilitado. Puedes avanzar completando la formación.</p>
      </div>
      <Btn onClick={run} loading={loading} success={success}>Continuar</Btn>
    </StepShell>
  );
}

function StepDashboardWelcome({ onNext }) {
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Bienvenido a tu espacio" subtitle="" api="POST /dashboard/welcome" showContent={false}>
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 40 }}
        >
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎯</div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.8, marginBottom: 16 }}>
            Aquí podrás ver tu evolución, tu posición y tus próximos pasos dentro del sistema.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6 }}>
            Todo en un solo lugar, actualizado en tiempo real.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Btn onClick={run} loading={loading} success={success}>Entrar al panel</Btn>
        </motion.div>
      </div>
    </StepShell>
  );
}

function StepDashboard({ onNext }) {
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Tu dashboard está listo" subtitle="Ya puedes acceder a tu panel privado." api="GET /dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {['Mi cuenta', 'Beneficios activos', 'Estado del sistema', 'Historial'].map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)' }}>
            <CheckCircle size={13} style={{ color: '#3b82f6' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{item}</span>
          </div>
        ))}
      </div>
      <Btn onClick={run} loading={loading} success={success}>Acceder</Btn>
    </StepShell>
  );
}

function StepGrowthRequest({ onNext }) {
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="¿Deseas desarrollar crecimiento?" subtitle="Puedes solicitar el acceso a la red y herramientas de desarrollo." api="POST /growth/request">
      <div style={{ padding: 16, borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>Al solicitar crecimiento, accederás a la formación obligatoria del sistema para habilitar la estructura y red.</p>
      </div>
      <Btn onClick={run} loading={loading} success={success} color="#f59e0b">Solicitar crecimiento</Btn>
    </StepShell>
  );
}

function StepAcademy({ onNext }) {
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Módulos de formación" subtitle="Completa los módulos para desbloquear el sistema completo." api="GET /academy/modules">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
        {['Qué es Vicion Power', 'Cómo funciona el sistema', 'Cómo explicarlo', 'Qué no decir', 'Cómo invitar'].map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#f59e0b', fontSize: 9, fontWeight: 700 }}>{i + 1}</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>{m}</span>
          </div>
        ))}
      </div>
      <Btn onClick={run} loading={loading} success={success} color="#f59e0b">Comenzar formación</Btn>
    </StepShell>
  );
}

function StepActivateNetwork({ onNext }) {
  const { loading, success, run } = useSimulatedCall(onNext);
  return (
    <StepShell title="Activación de red" subtitle="Completa el proceso para habilitar tu estructura y red de referidos." api="POST /network/activate">
      <div style={{ padding: 20, borderRadius: 14, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
        <p style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Formación completada</p>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>Ahora puedes activar tu red y acceder al sistema completo.</p>
      </div>
      <Btn onClick={run} loading={loading} success={success} color="#34d399">Activar red ahora</Btn>
    </StepShell>
  );
}

const STEP_COMPONENTS = [
  StepRegister, StepVerifyEmail, StepActivate, StepDecisionLayer, StepSelectPlan, StepConfirmPayment,
  StepContractReview, StepFinalConfirmation, StepPaymentSuccess, StepNextSteps, StepStateAssign, StepDashboardWelcome, StepDashboard, StepGrowthRequest, StepAcademy, StepActivateNetwork,
];

/* ── Main ────────────────────────────────────────────────────────────── */
export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const StepComp = STEP_COMPONENTS[step];

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#050c1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          style={{ maxWidth: 460, width: '100%', background: 'linear-gradient(135deg,#0d1f3c,#0a1628)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 24, padding: 40, textAlign: 'center', boxShadow: '0 0 60px rgba(52,211,153,0.12)' }}>
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: 3, duration: 0.4 }}
            style={{ fontSize: 56, marginBottom: 16 }}>🎉</motion.div>
          <p style={{ color: '#34d399', fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>PROCESO COMPLETADO</p>
          <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 26, marginBottom: 12 }}>¡Bienvenido al ecosistema!</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>Tu cuenta está activa, tu red habilitada y el sistema completo está disponible para ti.</p>
          <Link to="/dashboard"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#1d6ef5,#3b82f6)', color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 700, fontSize: 15, padding: '14px 28px', borderRadius: 12, textDecoration: 'none' }}>
            Ir al Dashboard <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 50%, #07101f 100%)', backgroundImage: 'linear-gradient(135deg, rgba(5,12,26,0.95) 0%, rgba(10,22,40,0.92) 50%, rgba(7,16,31,0.94) 100%), url("https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=900&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 60px', fontFamily: 'Inter,sans-serif', position: 'relative' }}>
      {/* Fixed Navbar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(10, 15, 25, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(59,130,246,0.1)'
      }}>
        {/* Left: Back Button */}
        <button
          onClick={() => step > 0 && setStep(s => s - 1)}
          disabled={step === 0}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: 12,
            cursor: step > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            opacity: step > 0 ? 1 : 0.3,
            transition: 'opacity 200ms',
            fontFamily: 'Inter,sans-serif',
            fontWeight: 500
          }}
          onMouseEnter={e => step > 0 && (e.target.style.opacity = '0.6')}
          onMouseLeave={e => step > 0 && (e.target.style.opacity = '1')}
        >
          ← Volver
        </button>

        {/* Center: Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, marginLeft: 24 }}>
          <img src={LOGO} alt="VP" style={{ height: 32, width: 32, objectFit: 'contain', filter: 'brightness(0) invert(1) opacity(0.9)' }} />
          <div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 12, letterSpacing: 2 }}>VICION POWER</div>
            <div style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 600, color: '#3b82f6', fontSize: 7, letterSpacing: 2 }}>ACCESO</div>
          </div>
        </div>

        {/* Right: Step counter and Exit Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginLeft: 'auto' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Paso {step + 1} de {STEPS.length}</div>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: 12,
              cursor: 'pointer',
              opacity: 1,
              transition: 'opacity 200ms',
              fontFamily: 'Inter,sans-serif',
              fontWeight: 500
            }}
            onMouseEnter={e => (e.target.style.opacity = '0.6')}
            onMouseLeave={e => (e.target.style.opacity = '1')}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Glow effect behind form */}
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0) 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Content offset for fixed navbar */}
      <div style={{ width: '100%', paddingTop: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>

        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: 520, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, marginBottom: 32 }}>
          <motion.div
            animate={{ width: `${((step + 1) / 5) * 100}%` }}
            transition={{ duration: 0.4 }}
            style={{ height: '100%', background: 'linear-gradient(90deg,#1d6ef5,#60a5fa)', borderRadius: 2 }}
          />
        </div>

        {/* Step */}
        <div style={{ width: '100%', maxWidth: 460 }}>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}>
              <StepComp onNext={() => step < STEPS.length - 1 ? setStep(s => s + 1) : setDone(true)} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress text */}
        <div style={{ marginTop: 28, color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Inter,sans-serif' }}>Paso {step + 1} de 5</div>
      </div>
    </div>
  );
}