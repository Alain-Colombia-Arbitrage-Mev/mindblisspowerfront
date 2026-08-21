import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Clock, Copy, Loader2, RotateCw, Share2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import ReferralShareModal from './ReferralShareModal';

const EMPTY_METRICS = { total: 0, active: 0, pending: 0 };

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
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [status, setStatus] = useState('loading');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hasReferral = status === 'ready' && referralCode && referralLink;

  useEffect(() => {
    let cancelled = false;
    loadReferral().then((next) => {
      if (!cancelled) applyReferral(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function applyReferral(data) {
    if (!data) {
      setStatus('error');
      setReferralCode('');
      setReferralLink('');
      setReferrals([]);
      setMetrics(EMPTY_METRICS);
      return;
    }
    if (!data.positioned || !data.code || !data.link) {
      setStatus('pending');
      setReferralCode('');
      setReferralLink('');
      setReferrals([]);
      setMetrics(EMPTY_METRICS);
      return;
    }
    setStatus('ready');
    setReferralCode(data.code);
    setReferralLink(data.link);
    setReferrals(Array.isArray(data.referrals) ? data.referrals : []);
    setMetrics(data.metrics || EMPTY_METRICS);
  }

  async function refreshReferral() {
    setRefreshing(true);
    try {
      applyReferral(await loadReferral());
    } finally {
      setRefreshing(false);
    }
  }

  const metricCards = useMemo(() => ([
    { label: 'Total invitados', value: metrics.total, color: 'var(--vp-text)', note: 'directos', icon: Users },
    { label: 'Activados', value: metrics.active, color: 'var(--vp-accent)', note: 'con membresía', icon: Check },
    { label: 'Pendientes', value: metrics.pending, color: 'var(--vp-amber)', note: 'sin activar', icon: Clock },
  ]), [metrics]);

  const copyCode = async () => {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  const copyLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {hasReferral ? (
        <ReferralShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} code={referralCode} memberName="Tu red" />
      ) : null}

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
          <div style={{ minWidth: 0 }}>
            <p style={{ ...labelStyle, color: 'var(--vp-accent)', marginBottom: 16 }}>Tu Código de Referido</p>
            <p
              style={{
                color: hasReferral ? 'var(--vp-text)' : 'var(--vp-muted)',
                fontSize: 'clamp(34px, 7vw, 64px)',
                fontWeight: 900,
                margin: 0,
                letterSpacing: hasReferral ? 4 : 0,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                overflowWrap: 'anywhere',
              }}
            >
              {status === 'loading' ? 'Cargando...' : hasReferral ? referralCode : 'Pendiente'}
            </p>
            <p style={{ color: 'var(--vp-muted)', fontSize: 11, margin: '8px 0 0', fontWeight: 650, maxWidth: 520 }}>
              {helperText(status)}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 178 }}>
            <button
              onClick={copyCode}
              disabled={!hasReferral}
              style={{
                ...buttonBase,
                padding: '11px 18px',
                background: codeCopied ? 'var(--vp-accent)' : 'var(--vp-accent-muted)',
                color: codeCopied ? 'var(--vp-shell)' : 'var(--vp-accent)',
                border: `1px solid ${codeCopied ? 'var(--vp-accent-strong)' : 'var(--vp-accent-border)'}`,
                cursor: hasReferral ? 'pointer' : 'default',
                opacity: hasReferral ? 1 : 0.55,
              }}
            >
              {codeCopied ? <Check size={14} /> : <Copy size={14} />}
              {codeCopied ? 'Copiado' : 'Copiar código'}
            </button>
            <button
              onClick={refreshReferral}
              disabled={refreshing}
              style={{
                ...buttonBase,
                padding: '10px 18px',
                background: 'var(--vp-surface-raised)',
                color: 'var(--vp-muted)',
                border: '1px solid var(--vp-border)',
                cursor: refreshing ? 'default' : 'pointer',
                opacity: refreshing ? 0.6 : 1,
              }}
            >
              <RotateCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
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
              color: hasReferral ? 'var(--vp-accent)' : 'var(--vp-muted)',
              fontSize: 12,
              margin: 0,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: hasReferral ? 'monospace' : 'inherit',
            }}
          >
            {hasReferral ? referralLink : sharePlaceholder(status)}
          </p>
          <button
            onClick={copyLink}
            disabled={!hasReferral}
            style={{
              ...buttonBase,
              padding: '8px 13px',
              flexShrink: 0,
              background: linkCopied ? 'var(--vp-accent)' : 'var(--vp-surface)',
              color: linkCopied ? 'var(--vp-shell)' : 'var(--vp-text-soft)',
              border: `1px solid ${linkCopied ? 'var(--vp-accent-strong)' : 'var(--vp-border)'}`,
              fontSize: 11,
              cursor: hasReferral ? 'pointer' : 'default',
              opacity: hasReferral ? 1 : 0.55,
            }}
          >
            {linkCopied ? <Check size={12} /> : <Copy size={12} />}
            {linkCopied ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        <button
          onClick={() => hasReferral && setShareModalOpen(true)}
          disabled={!hasReferral}
          style={{
            ...buttonBase,
            width: '100%',
            padding: '12px 18px',
            background: hasReferral ? 'var(--vp-amber-muted)' : 'var(--vp-surface-raised)',
            color: hasReferral ? 'var(--vp-amber)' : 'var(--vp-muted)',
            border: `1px solid ${hasReferral ? 'var(--vp-amber-border)' : 'var(--vp-border)'}`,
            cursor: hasReferral ? 'pointer' : 'default',
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
          {referrals.length === 0 ? (
            <EmptyReferralState status={status} />
          ) : (
            referrals.map((referral, index) => {
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
                    borderBottom: index < referrals.length - 1 ? '1px solid var(--vp-border)' : 'none',
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
                      {(referral.name || '?')[0]}
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
                    {formatDate(referral.date)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </motion.section>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

async function loadReferral() {
  try {
    const response = await fetch('/api/member/referral', { cache: 'no-store' });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

function helperText(status) {
  if (status === 'loading') return 'Consultando tu enlace real en la base de datos.';
  if (status === 'error') return 'No se pudo consultar tu enlace. Intenta actualizar en unos segundos.';
  if (status === 'pending') return 'El código se habilita cuando tu pago queda activado y tu cuenta entra al árbol binario.';
  return 'Código único, permanente y resoluble para nuevas activaciones.';
}

function sharePlaceholder(status) {
  if (status === 'loading') return 'Cargando link de referido...';
  if (status === 'error') return 'Link no disponible temporalmente';
  return 'Pendiente de activación y ubicación en el árbol';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function EmptyReferralState({ status }) {
  const loading = status === 'loading';
  const Icon = loading ? Loader2 : AlertCircle;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', background: 'var(--vp-surface-raised)' }}>
      <Icon size={16} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--vp-muted)', flexShrink: 0 }} />
      <div>
        <p style={{ color: 'var(--vp-text)', fontSize: 13, fontWeight: 800, margin: 0 }}>
          {loading ? 'Cargando invitaciones...' : 'Sin invitaciones visibles'}
        </p>
        <p style={{ color: 'var(--vp-muted)', fontSize: 11, margin: '4px 0 0' }}>
          {status === 'pending'
            ? 'Cuando tu enlace quede activo, tus referidos aparecerán aquí.'
            : 'Los registros directos por tu enlace se mostrarán en esta lista.'}
        </p>
      </div>
    </div>
  );
}
