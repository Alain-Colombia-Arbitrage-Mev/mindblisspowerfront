import { useState } from "framer-motion";
import { motion } from "framer-motion";
import { Shield, CheckCircle, Lock, ChevronRight, Mail, ExternalLink, AlertCircle } from "lucide-react";

const STEPS = [
  {
    id: 1,
    label: "Vincular BMP",
    desc: "Registra tu email de la plataforma BMP para recibir transferencias.",
  },
  {
    id: 2,
    label: "Verificación",
    desc: "El equipo confirma tu identidad y valida tu solicitud.",
  },
  {
    id: 3,
    label: "Procesamiento",
    desc: "La transferencia se ejecuta en la plataforma BMP externa.",
  },
];

export default function Withdrawal() {
  const [bmpEmail, setBmpEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [activeStep] = useState(1);

  const handleSaveEmail = () => {
    if (!bmpEmail || !bmpEmail.includes("@")) return;
    setEmailSaved(true);
  };

  const getStepState = (stepId) => {
    if (stepId < activeStep) return "completed";
    if (stepId === activeStep) return "active";
    return "locked";
  };

  return (
    <div style={{ background: '#05070D', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ color: 'rgba(59,130,246,0.7)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px 0' }}>
            Finanzas · Transferencias
          </p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Retiro de Fondos
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
            Gestión segura de transferencias externas a través de la plataforma BMP.
          </p>
        </motion.div>

        {/* ── BALANCE CARDS ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        >
          {[
            { label: "Saldo Disponible", value: "—", note: "Créditos confirmados por actividad" },
            { label: "En Proceso", value: "—", note: "Transferencias en curso" },
          ].map((b, i) => (
            <div key={i} style={{
              padding: '22px 24px',
              borderRadius: 14,
              background: 'rgba(8,18,40,0.8)',
              border: '1px solid rgba(59,130,246,0.1)',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>
                {b.label}
              </p>
              <p style={{ color: 'white', fontSize: 32, fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-1px' }}>
                {b.value}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, margin: 0 }}>{b.note}</p>
            </div>
          ))}
        </motion.div>

        {/* ── STEP FLOW ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          style={{
            padding: '28px',
            borderRadius: 14,
            background: 'rgba(8,18,40,0.8)',
            border: '1px solid rgba(59,130,246,0.1)',
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 24px 0' }}>
            Proceso de Retiro
          </p>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, position: 'relative' }}>
            {STEPS.map((step, i) => {
              const state = getStepState(step.id);
              const isLast = i === STEPS.length - 1;

              const circleColor = state === 'completed'
                ? '#3b82f6'
                : state === 'active'
                ? '#7c3aed'
                : 'rgba(255,255,255,0.06)';

              const circleBorder = state === 'completed'
                ? 'rgba(59,130,246,0.6)'
                : state === 'active'
                ? 'rgba(124,58,237,0.8)'
                : 'rgba(255,255,255,0.1)';

              const labelColor = state === 'locked' ? 'rgba(255,255,255,0.2)' : 'white';
              const descColor = state === 'locked' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.4)';

              return (
                <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {/* Connector line */}
                  {!isLast && (
                    <div style={{
                      position: 'absolute',
                      top: 16,
                      left: '50%',
                      width: '100%',
                      height: 1,
                      background: state === 'completed'
                        ? 'rgba(59,130,246,0.4)'
                        : 'rgba(255,255,255,0.06)',
                      zIndex: 0,
                    }} />
                  )}

                  {/* Circle */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: circleColor,
                    border: `1.5px solid ${circleBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', zIndex: 1,
                    boxShadow: state === 'active'
                      ? '0 0 16px rgba(124,58,237,0.5), 0 0 6px rgba(124,58,237,0.3)'
                      : state === 'completed'
                      ? '0 0 10px rgba(59,130,246,0.3)'
                      : 'none',
                    marginBottom: 12,
                  }}>
                    {state === 'completed' && <CheckCircle size={14} color="white" />}
                    {state === 'active' && (
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }}
                      />
                    )}
                    {state === 'locked' && <Lock size={12} color="rgba(255,255,255,0.2)" />}
                  </div>

                  {/* Label + desc */}
                  <p style={{ color: labelColor, fontSize: 11, fontWeight: 700, margin: '0 0 4px 0', textAlign: 'center', paddingInline: 8 }}>
                    {step.label}
                  </p>
                  <p style={{ color: descColor, fontSize: 9, textAlign: 'center', lineHeight: 1.5, paddingInline: 4 }}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── BMP IDENTITY STEP ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            padding: '28px',
            borderRadius: 14,
            background: 'rgba(8,18,40,0.8)',
            border: emailSaved ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: emailSaved ? 'rgba(59,130,246,0.1)' : 'rgba(124,58,237,0.1)',
              border: `1px solid ${emailSaved ? 'rgba(59,130,246,0.3)' : 'rgba(124,58,237,0.3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {emailSaved
                ? <CheckCircle size={18} color="#3b82f6" />
                : <Mail size={18} color="#a78bfa" />
              }
            </div>
            <div>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 800, margin: '0 0 2px 0' }}>
                Identidad BMP
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0 }}>
                Vincula el email de tu cuenta BMP para habilitar transferencias
              </p>
            </div>
          </div>

          {emailSaved ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 10,
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
                <span style={{ color: '#93c5fd', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                  {bmpEmail}
                </span>
              </div>
              <button
                onClick={() => setEmailSaved(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600,
                }}
              >
                Editar
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="email"
                value={bmpEmail}
                onChange={(e) => setBmpEmail(e.target.value)}
                placeholder="email@bmp-platform.com"
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: 12, outline: 'none',
                  fontFamily: 'monospace',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button
                onClick={handleSaveEmail}
                disabled={!bmpEmail || !bmpEmail.includes('@')}
                style={{
                  padding: '12px 20px', borderRadius: 10, cursor: bmpEmail && bmpEmail.includes('@') ? 'pointer' : 'not-allowed',
                  background: bmpEmail && bmpEmail.includes('@') ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${bmpEmail && bmpEmail.includes('@') ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  color: bmpEmail && bmpEmail.includes('@') ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                  fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Shield size={13} />
                Vincular
              </button>
            </div>
          )}
        </motion.div>

        {/* ── ACTION CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          style={{
            padding: '24px 28px',
            borderRadius: 14,
            background: 'rgba(8,18,40,0.8)',
            border: '1px solid rgba(59,130,246,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 800, margin: '0 0 4px 0' }}>
              Solicitar Retiro
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0, lineHeight: 1.5 }}>
              Una vez vinculado tu email BMP, el equipo de operaciones procesará tu solicitud en 24–72h.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              disabled={!emailSaved}
              style={{
                padding: '12px 22px', borderRadius: 10,
                cursor: emailSaved ? 'pointer' : 'not-allowed',
                background: emailSaved ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${emailSaved ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.06)'}`,
                color: emailSaved ? '#93c5fd' : 'rgba(255,255,255,0.15)',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.2s',
              }}
            >
              <ExternalLink size={13} />
              Iniciar proceso
              <ChevronRight size={12} />
            </button>
          </div>
        </motion.div>

        {/* ── COMPLIANCE NOTE ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          style={{
            padding: '14px 18px',
            borderRadius: 10,
            background: 'rgba(59,130,246,0.04)',
            border: '1px solid rgba(59,130,246,0.1)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}
        >
          <AlertCircle size={13} color="rgba(59,130,246,0.6)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0, lineHeight: 1.7 }}>
            <strong style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Cumplimiento:</strong>{' '}
            Todas las transferencias están sujetas a verificación de identidad y revisión de cumplimiento normativo. Los tiempos de procesamiento pueden variar según región y método utilizado.
          </p>
        </motion.div>

      </div>
    </div>
  );
}