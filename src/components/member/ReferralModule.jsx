import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Clock, Copy, RotateCw, Share2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import ReferralShareModal from './ReferralShareModal';

const SIMULATED_REFERRALS = [
  { id: 1, name: 'Juan García', status: 'activo', date: '2024-04-10' },
  { id: 2, name: 'María López', status: 'activo', date: '2024-04-08' },
  { id: 3, name: 'Carlos Martínez', status: 'registrado', date: '2024-04-07' },
  { id: 4, name: 'Ana Rodríguez', status: 'activo', date: '2024-03-28' },
  { id: 5, name: 'Pedro Sánchez', status: 'pendiente', date: '2024-03-25' },
];

const STATUS_CONFIG = {
  activo: { label: 'Activo', color: 'var(--vp-accent)', bg: 'var(--vp-accent-muted)', border: 'var(--vp-accent-border)' },
  registrado: { label: 'Registrado', color: 'var(--vp-amber)', bg: 'var(--vp-amber-muted)', border: 'var(--vp-amber-border)' },
  pendiente: { label: 'Pendiente', color: 'var(--vp-muted)', bg: 'var(--vp-surface-raised)', border: 'var(--vp-border)' },
};

const cardStyle = {
  background: 'var(--vp-surface)',
  border: '1px solid var(--vp-border)',
  boxShadow: 'var(--vp-shadow)',
};

const labelStyle = {
  color: 'var(--vp-subtle)',
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  margin: 0,
};

const buttonBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: 10,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 780,
  transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
};

export default function ReferralModule() {
  const [referralCode, setReferralCode] = useState('823649');
  const [referralLink, setReferralLink] = useState('https://app.mindblisspower.com/register?ref=823649');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Código real de referido desde RDS (mlm.affiliate.invitation_link).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/member/referral')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.code) return;
        setReferralCode(data.code);
        setReferralLink(data.link);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => ({
    total: SIMULATED_REFERRALS.length,
    active: SIMULATED_REFERRALS.filter((ref) => ref.status === 'activo').length,
    pending: SIMULATED_REFERRALS.filter((ref) => ref.status !== 'activo').length,
  }), []);

  const copyCode = async () => {
    await navigator.clipboard.writeText(referralCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  // Re-sincroniza el código real desde el servidor (es estable por afiliado).
  const generateCode = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/member/referral');
      const data = response.ok ? await response.json() : null;
      if (data?.code) {
        setReferralCode(data.code);
        setReferralLink(data.link);
      }
    } catch {
      // mantiene el código actual si falla
    }
    setGenerating(false);
  };

  const metricCards = [
    { label: 'Total invitados', value: metrics.total, color: 'var(--vp-text)', note: 'en tu red', icon: Users },
    { label: 'Activados', value: metrics.active, color: 'var(--vp-accent)', note: 'con membresía', icon: Check },
    { label: 'Pendientes', value: metrics.pending, color: 'var(--vp-amber)', note: 'sin activar', icon: Clock },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <ReferralShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} code={referralCode} memberName="You" />

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          ...cardStyle,
          padding: '28px clamp(20px, 4vw, 34px)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <p style={{ ...labelStyle, color: 'var(--vp-accent)', marginBottom: 16 }}>Tu Código de Referido</p>
            <p
              style={{
                color: 'var(--vp-text)',
                fontSize: 'clamp(42px, 7vw, 64px)',
                fontWeight: 900,
                margin: 0,
                letterSpacing: 6,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {referralCode}
            </p>
            <p style={{ color: 'var(--vp-muted)', fontSize: 11, margin: '8px 0 0', fontWeight: 650 }}>
              Código único · No transferible
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 178 }}>
            <button
              onClick={copyCode}
              style={{
                ...buttonBase,
                padding: '11px 18px',
                background: codeCopied ? 'var(--vp-accent)' : 'var(--vp-accent-muted)',
                color: codeCopied ? 'var(--vp-shell)' : 'var(--vp-accent)',
                border: `1px solid ${codeCopied ? 'var(--vp-accent-strong)' : 'var(--vp-accent-border)'}`,
              }}
            >
              {codeCopied ? <Check size={14} /> : <Copy size={14} />}
              {codeCopied ? 'Copiado' : 'Copiar código'}
            </button>
            <button
              onClick={generateCode}
              disabled={generating}
              style={{
                ...buttonBase,
                padding: '10px 18px',
                background: 'var(--vp-surface-raised)',
                color: 'var(--vp-muted)',
                border: '1px solid var(--vp-border)',
                cursor: generating ? 'default' : 'pointer',
                opacity: generating ? 0.6 : 1,
              }}
            >
              <RotateCw size={13} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
              {generating ? 'Generando...' : 'Nuevo código'}
            </button>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: 0.04 }}
        style={{ ...cardStyle, padding: '24px clamp(20px, 3vw, 28px)', borderRadius: 16 }}
      >
        <p style={{ ...labelStyle, marginBottom: 16 }}>Compartir</p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            borderRadius: 11,
            background: 'var(--vp-surface-raised)',
            border: '1px solid var(--vp-border)',
            marginBottom: 12,
            minWidth: 0,
          }}
        >
          <p
            style={{
              color: 'var(--vp-accent)',
              fontSize: 12,
              margin: 0,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
            }}
          >
            {referralLink}
          </p>
          <button
            onClick={copyLink}
            style={{
              ...buttonBase,
              padding: '8px 13px',
              flexShrink: 0,
              background: linkCopied ? 'var(--vp-accent)' : 'var(--vp-surface)',
              color: linkCopied ? 'var(--vp-shell)' : 'var(--vp-text-soft)',
              border: `1px solid ${linkCopied ? 'var(--vp-accent-strong)' : 'var(--vp-border)'}`,
              fontSize: 11,
            }}
          >
            {linkCopied ? <Check size={12} /> : <Copy size={12} />}
            {linkCopied ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        <button
          onClick={() => setShareModalOpen(true)}
          style={{
            ...buttonBase,
            width: '100%',
            padding: '12px 18px',
            background: 'var(--vp-amber-muted)',
            color: 'var(--vp-amber)',
            border: '1px solid var(--vp-amber-border)',
          }}
        >
          <Share2 size={14} />
          Compartir invitación
          <ArrowRight size={13} style={{ opacity: 0.65 }} />
        </button>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: 0.08 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}
      >
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} style={{ ...cardStyle, padding: '18px 20px', borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Icon size={14} strokeWidth={1.8} style={{ color: 'var(--vp-subtle)' }} />
                <p style={{ ...labelStyle, fontSize: 9 }}>{metric.label}</p>
              </div>
              <p style={{ color: metric.color, fontSize: 32, fontWeight: 900, margin: '0 0 3px', lineHeight: 1 }}>{metric.value}</p>
              <p style={{ color: 'var(--vp-muted)', fontSize: 11, margin: 0 }}>{metric.note}</p>
            </div>
          );
        })}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: 0.12 }}
        style={{
          ...cardStyle,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--vp-border)' }}>
          <p style={labelStyle}>Seguimiento de Invitaciones</p>
        </div>
        <div>
          {SIMULATED_REFERRALS.map((referral, index) => {
            const cfg = STATUS_CONFIG[referral.status] || STATUS_CONFIG.pendiente;
            return (
              <div
                key={referral.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  padding: '14px 22px',
                  borderBottom: index < SIMULATED_REFERRALS.length - 1 ? '1px solid var(--vp-border)' : 'none',
                  background: index % 2 === 0 ? 'var(--vp-surface)' : 'var(--vp-surface-raised)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 auto', minWidth: 0 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      flexShrink: 0,
                      background: 'var(--vp-accent-muted)',
                      border: '1px solid var(--vp-accent-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--vp-accent)',
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {referral.name[0]}
                  </div>
                  <p style={{ color: 'var(--vp-text)', fontSize: 13, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {referral.name}
                  </p>
                </div>

                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 7,
                    background: cfg.bg,
                    color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                    fontSize: 10,
                    fontWeight: 780,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cfg.label}
                </span>

                <p style={{ color: 'var(--vp-muted)', fontSize: 11, margin: 0, flexShrink: 0 }}>
                  {new Date(referral.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            );
          })}
        </div>
      </motion.section>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
