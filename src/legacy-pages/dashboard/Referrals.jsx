import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Users, TrendingUp, CheckCircle, Network, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const userId = localStorage.getItem('user_id') || 'REF000';
const referralCode = `VIC-${userId.slice(-6).toUpperCase()}`;
const referralLink = `${window.location.origin}?ref=${referralCode}`;

export default function Referrals() {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Enlace copiado");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success("Código copiado");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const stats = [
    { label: "Referidos Directos", value: "0", icon: Users, color: "#3b82f6", desc: "Personas en tu primer nivel" },
    { label: "Red Total", value: "0", icon: Network, color: "#7c3aed", desc: "Toda tu estructura profunda" },
    { label: "Activos este mes", value: "0", icon: TrendingUp, color: "#3b82f6", desc: "Con actividad confirmada" },
  ];

  return (
    <div style={{ background: '#05070D', minHeight: '100vh', padding: '32px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ color: 'rgba(59,130,246,0.7)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px 0' }}>
            Crecimiento · Estructura
          </p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Módulo de Referidos
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
            Expande tu red con precisión. Cada referido activa tu estructura binaria.
          </p>
        </motion.div>

        {/* ── IDENTITY BLOCK: CODE + LINK ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{
            padding: '28px 28px 24px',
            borderRadius: 14,
            background: 'rgba(8,18,40,0.8)',
            border: '1px solid rgba(59,130,246,0.12)',
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 20px 0' }}>
            Tu Identidad de Referido
          </p>

          {/* Code row */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, margin: '0 0 8px 0' }}>Código único</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                flex: 1, padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.2)',
                fontFamily: 'monospace', fontSize: 16, fontWeight: 800, letterSpacing: '3px',
                color: '#93c5fd',
              }}>
                {referralCode}
              </div>
              <button
                onClick={handleCopyCode}
                style={{
                  padding: '12px 18px', borderRadius: 10, cursor: 'pointer',
                  background: copiedCode ? 'rgba(124,58,237,0.15)' : 'rgba(59,130,246,0.08)',
                  border: `1px solid ${copiedCode ? 'rgba(124,58,237,0.4)' : 'rgba(59,130,246,0.25)'}`,
                  color: copiedCode ? '#a78bfa' : '#60a5fa',
                  fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {copiedCode ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copiedCode ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Link row */}
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, margin: '0 0 8px 0' }}>Enlace de acceso</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                flex: 1, padding: '11px 16px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'monospace', fontSize: 11,
                color: 'rgba(255,255,255,0.45)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {referralLink}
              </div>
              <button
                onClick={handleCopyLink}
                style={{
                  padding: '11px 18px', borderRadius: 10, cursor: 'pointer',
                  background: copiedLink ? 'rgba(124,58,237,0.15)' : 'rgba(8,18,40,0.9)',
                  border: `1px solid ${copiedLink ? 'rgba(124,58,237,0.4)' : 'rgba(59,130,246,0.2)'}`,
                  color: copiedLink ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                  fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {copiedLink ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copiedLink ? 'Copiado' : 'Copiar enlace'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── METRICS ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}
        >
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.06 }}
                style={{
                  padding: '20px 18px',
                  borderRadius: 14,
                  background: 'rgba(8,18,40,0.8)',
                  border: `1px solid rgba(59,130,246,0.1)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${s.color}14`,
                    border: `1px solid ${s.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color={s.color} />
                  </div>
                </div>
                <p style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
                  {s.value}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, margin: '0 0 2px 0' }}>{s.label}</p>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, margin: 0 }}>{s.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── EMPTY STATE ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            padding: '40px 28px',
            borderRadius: 14,
            background: 'rgba(8,18,40,0.8)',
            border: '1px solid rgba(59,130,246,0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Network size={24} color="#7c3aed" />
          </div>
          <h3 style={{ color: 'white', fontSize: 16, fontWeight: 800, margin: '0 0 8px 0' }}>
            Sin referidos activos aún
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '0 0 24px 0', lineHeight: 1.6, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Comparte tu código de acceso. Cada persona que ingrese a través de tu enlace se registra directamente en tu estructura binaria.
          </p>
          <button
            onClick={handleCopyLink}
            style={{
              padding: '12px 28px', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#93c5fd',
              fontSize: 12, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <Copy size={14} />
            Copiar enlace de referido
            <ArrowRight size={13} />
          </button>
        </motion.div>

        {/* ── METHODOLOGY NOTE ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          style={{
            padding: '14px 18px',
            borderRadius: 10,
            background: 'rgba(59,130,246,0.04)',
            border: '1px solid rgba(59,130,246,0.1)',
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0, lineHeight: 1.7 }}>
            <strong style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Estructura binaria:</strong>{' '}
            Cada referido se inserta en la rama con menor volumen para optimizar el balance de tu red. El bonus directo se activa con cada referido activo confirmado.
          </p>
        </motion.div>

      </div>
    </div>
  );
}