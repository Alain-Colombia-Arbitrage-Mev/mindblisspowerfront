import { useState } from 'react';
import {
  AtSign,
  Bell,
  Calendar,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Share2,
  Shield,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DigitalIDModal from '@/components/member/DigitalIDModal';

const IDENTITY = {
  name: 'Javier Demo MVP',
  username: '@javierdemo.mvp',
  userId: 'VP-CA-0426-917',
  joinDate: '26/04/2026',
  status: 'Diamante Negro',
  rank: 'Diamante Negro',
  plan: 'Elite Network',
};

const REFERRAL_CODE = '823649';
const REFERRAL_URL = `https://vicion.app/register?ref=${REFERRAL_CODE}`;

const surface = {
  background: 'var(--vp-surface)',
  border: '1px solid var(--vp-border)',
  boxShadow: 'var(--vp-shadow)',
};

const eyebrow = {
  color: 'var(--vp-subtle)',
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '1.2px',
  lineHeight: 1,
  margin: 0,
  textTransform: 'uppercase',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  background: 'var(--vp-surface-raised)',
  border: '1px solid var(--vp-border)',
  color: 'var(--vp-text)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const smallButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '8px 12px',
  borderRadius: 8,
  background: 'var(--vp-surface-raised)',
  border: '1px solid var(--vp-border)',
  color: 'var(--vp-text-soft)',
  fontSize: 12,
  fontWeight: 750,
  cursor: 'pointer',
};

const primaryButton = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
  padding: '12px 18px',
  borderRadius: 10,
  background: 'var(--vp-accent)',
  border: '1px solid var(--vp-accent-strong)',
  color: 'var(--vp-shell)',
  fontSize: 13,
  fontWeight: 850,
  cursor: 'pointer',
};

const secondaryButton = {
  ...smallButton,
  color: 'var(--vp-accent)',
  background: 'var(--vp-accent-muted)',
  border: '1px solid var(--vp-accent-border)',
};

function Toggle({ enabled, onClick, label }) {
  return (
    <motion.button
      aria-label={label}
      onClick={onClick}
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        position: 'relative',
        background: enabled ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)',
        border: `1px solid ${enabled ? 'var(--vp-accent-border)' : 'var(--vp-border)'}`,
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <motion.span
        animate={{ x: enabled ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        style={{
          position: 'absolute',
          top: 2,
          left: 0,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: enabled ? 'var(--vp-accent)' : 'var(--vp-subtle)',
        }}
      />
    </motion.button>
  );
}

export default function MemberProfile() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

  const [showIDModal, setShowIDModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: IDENTITY.name,
    email: userData.email || 'javier@vicion.com',
    phone: userData.phone || '+1 (555) 000-0001',
    country: userData.country || 'México',
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    localStorage.setItem('user_data', JSON.stringify({ ...userData, ...formData }));
    setEditing(false);
    showToast('Perfil actualizado correctamente');
  };

  const handlePasswordChange = () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      showToast('Completa todos los campos', 'error');
      return;
    }
    if (passwordData.new.length < 8) {
      showToast('Mínimo 8 caracteres', 'error');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }
    setPasswordData({ current: '', new: '', confirm: '' });
    setShowPasswordPanel(false);
    showToast('Contraseña actualizada');
  };

  const handleLogout = () => {
    ['user_auth', 'user_id', 'user_role', 'user_data'].forEach((key) => localStorage.removeItem(key));
    navigate('/login', { replace: true });
  };

  const copyText = async (value, message) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(message);
    } catch {
      showToast('No se pudo copiar', 'error');
    }
  };

  const shareReferral = async () => {
    if (!navigator.share) {
      copyText(REFERRAL_URL, 'Enlace copiado para compartir');
      return;
    }

    try {
      await navigator.share({
        title: 'Únete a mi red',
        text: `Regístrate con mi código ${REFERRAL_CODE}`,
        url: REFERRAL_URL,
      });
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('No se pudo compartir', 'error');
    }
  };

  const personalFields = [
    { label: 'Nombre', key: 'name', icon: User },
    { label: 'Email', key: 'email', locked: true, icon: Mail },
    { label: 'Teléfono', key: 'phone', icon: Phone },
    { label: 'País', key: 'country', icon: MapPin },
  ];

  const credentialCards = [
    { label: 'User ID', value: IDENTITY.userId, icon: IdCard, tone: 'accent' },
    { label: 'Ingreso', value: IDENTITY.joinDate, icon: Calendar, tone: 'neutral' },
    { label: 'Rango', value: IDENTITY.rank, icon: Shield, tone: 'amber' },
  ];

  const preferences = [
    {
      label: 'Notificaciones en plataforma',
      sub: 'Alertas de red y actividad',
      state: notificationsEnabled,
      toggle: () => setNotificationsEnabled(!notificationsEnabled),
    },
    {
      label: 'Resumen por email',
      sub: 'Resumen semanal de tu actividad',
      state: emailDigest,
      toggle: () => setEmailDigest(!emailDigest),
    },
  ];

  return (
    <div style={{ background: 'var(--vp-bg)', minHeight: '100vh', paddingBottom: 48 }}>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{
              position: 'fixed',
              top: 20,
              right: 24,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '11px 14px',
              borderRadius: 10,
              background: toast.type === 'error' ? 'var(--vp-danger-muted)' : 'var(--vp-accent-muted)',
              border: `1px solid ${toast.type === 'error' ? 'var(--vp-danger-border)' : 'var(--vp-accent-border)'}`,
              color: toast.type === 'error' ? 'var(--vp-danger)' : 'var(--vp-accent)',
              fontSize: 12,
              fontWeight: 750,
              boxShadow: 'var(--vp-shadow)',
            }}
          >
            <CheckCircle2 size={15} strokeWidth={1.8} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <section
        style={{
          background: 'var(--vp-shell)',
          borderBottom: '1px solid var(--vp-border)',
          padding: '38px clamp(20px, 4vw, 42px) 34px',
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 28,
            flexWrap: 'wrap',
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'flex', alignItems: 'center', gap: 22, minWidth: 280 }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  background: 'var(--vp-accent-muted)',
                  border: '1px solid var(--vp-accent-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 34,
                  fontWeight: 900,
                  color: 'var(--vp-accent)',
                }}
              >
                J
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 5,
                  right: 5,
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  background: 'var(--vp-accent)',
                  border: '2px solid var(--vp-shell)',
                }}
              />
            </div>

            <div>
              <p style={{ ...eyebrow, marginBottom: 9 }}>Control Personal</p>
              <h1
                style={{
                  color: 'var(--vp-text)',
                  fontSize: 30,
                  fontWeight: 900,
                  margin: '0 0 6px',
                  lineHeight: 1.1,
                }}
              >
                {IDENTITY.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--vp-muted)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                <AtSign size={13} strokeWidth={1.8} />
                {IDENTITY.username.replace('@', '')}
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: 'var(--vp-amber-muted)',
                  border: '1px solid var(--vp-amber-border)',
                  color: 'var(--vp-amber)',
                  fontSize: 10,
                  fontWeight: 850,
                  textTransform: 'uppercase',
                }}
              >
                <Shield size={12} strokeWidth={1.8} />
                {IDENTITY.status}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, delay: 0.04 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(138px, 1fr))',
              gap: 10,
              flex: '1 1 300px',
              width: '100%',
              maxWidth: 520,
              minWidth: 0,
            }}
          >
            {credentialCards.map((card) => {
              const Icon = card.icon;
              const toneBg = card.tone === 'amber' ? 'var(--vp-amber-muted)' : card.tone === 'accent' ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)';
              const toneBorder = card.tone === 'amber' ? 'var(--vp-amber-border)' : card.tone === 'accent' ? 'var(--vp-accent-border)' : 'var(--vp-border)';
              const toneText = card.tone === 'amber' ? 'var(--vp-amber)' : card.tone === 'accent' ? 'var(--vp-accent)' : 'var(--vp-text-soft)';

              return (
                <div
                  key={card.label}
                  style={{
                    ...surface,
                    padding: '14px 15px',
                    borderRadius: 12,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: toneBg,
                      border: `1px solid ${toneBorder}`,
                      color: toneText,
                      marginBottom: 10,
                    }}
                  >
                    <Icon size={15} strokeWidth={1.8} />
                  </div>
                  <p style={{ ...eyebrow, fontSize: 9, marginBottom: 6 }}>{card.label}</p>
                  <p style={{ color: 'var(--vp-text)', fontSize: 13, fontWeight: 800, margin: 0 }}>{card.value}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '28px clamp(18px, 4vw, 40px) 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.08 }}
          style={{
            ...surface,
            borderRadius: 16,
            padding: '24px clamp(20px, 3vw, 30px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 22,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 15, alignItems: 'flex-start', minWidth: 260, flex: '1 1 420px' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: 'var(--vp-accent-muted)',
                border: '1px solid var(--vp-accent-border)',
                color: 'var(--vp-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CreditCard size={20} strokeWidth={1.7} />
            </div>
            <div>
              <p style={{ ...eyebrow, marginBottom: 9 }}>Credencial Oficial</p>
              <h2 style={{ color: 'var(--vp-text)', fontSize: 22, fontWeight: 900, margin: '0 0 7px' }}>Tu Identidad Digital</h2>
              <p style={{ color: 'var(--vp-muted)', fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 520 }}>
                Accede y descarga tu ID oficial para uso digital o impresión.
              </p>
            </div>
          </div>

          <motion.button
            onClick={() => setShowIDModal(true)}
            whileHover={{ y: -1, backgroundColor: 'var(--vp-accent-strong)' }}
            whileTap={{ scale: 0.98 }}
            style={primaryButton}
          >
            <Download size={16} strokeWidth={2} />
            Descargar ID Digital
          </motion.button>
        </motion.section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 20 }}>
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.14 }}
            style={{ ...surface, padding: 24, borderRadius: 16, minWidth: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
              <p style={eyebrow}>Datos Personales</p>
              {!editing ? (
                <button onClick={() => setEditing(true)} style={secondaryButton}>
                  Editar
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={handleSave} style={secondaryButton}>
                    Guardar
                  </button>
                  <button onClick={() => setEditing(false)} style={smallButton}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 17 }}>
              {personalFields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.key}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                      <Icon size={13} strokeWidth={1.8} style={{ color: 'var(--vp-subtle)' }} />
                      <p style={{ ...eyebrow, fontSize: 9 }}>{field.label}</p>
                    </div>
                    {editing && !field.locked ? (
                      <input
                        type="text"
                        value={formData[field.key]}
                        onChange={(event) => setFormData({ ...formData, [field.key]: event.target.value })}
                        style={inputStyle}
                      />
                    ) : (
                      <p style={{ color: field.locked ? 'var(--vp-muted)' : 'var(--vp-text)', fontSize: 13, fontWeight: 700, margin: 0 }}>
                        {formData[field.key] || '-'}
                        {field.locked && (
                          <span style={{ color: 'var(--vp-subtle)', fontSize: 10, marginLeft: 7, fontWeight: 650 }}>
                            bloqueado
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            style={{ ...surface, padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}
          >
            <p style={eyebrow}>Seguridad</p>

            <div style={{ paddingBottom: 18, borderBottom: '1px solid var(--vp-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: showPasswordPanel ? 14 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--vp-accent-muted)', border: '1px solid var(--vp-accent-border)', color: 'var(--vp-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={15} strokeWidth={1.7} />
                  </div>
                  <div>
                    <p style={{ color: 'var(--vp-text)', fontSize: 13, fontWeight: 750, margin: 0 }}>Contraseña</p>
                    <p style={{ color: 'var(--vp-muted)', fontSize: 10, margin: '2px 0 0' }}>Actualizada desde tu cuenta</p>
                  </div>
                </div>
                <button onClick={() => setShowPasswordPanel(!showPasswordPanel)} style={secondaryButton}>
                  {showPasswordPanel ? 'Cancelar' : 'Cambiar'}
                </button>
              </div>

              <AnimatePresence>
                {showPasswordPanel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { placeholder: 'Contraseña actual', key: 'current', show: false },
                        { placeholder: 'Nueva contraseña', key: 'new', show: showPassword, toggle: () => setShowPassword(!showPassword) },
                        { placeholder: 'Confirmar nueva', key: 'confirm', show: showConfirmPassword, toggle: () => setShowConfirmPassword(!showConfirmPassword) },
                      ].map((field) => (
                        <div key={field.key} style={{ position: 'relative' }}>
                          <input
                            type={field.show ? 'text' : 'password'}
                            placeholder={field.placeholder}
                            value={passwordData[field.key]}
                            onChange={(event) => setPasswordData({ ...passwordData, [field.key]: event.target.value })}
                            style={{ ...inputStyle, paddingRight: 40 }}
                          />
                          {field.toggle && (
                            <button
                              aria-label={field.show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                              onClick={field.toggle}
                              style={{
                                position: 'absolute',
                                right: 10,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--vp-muted)',
                                cursor: 'pointer',
                                padding: 0,
                              }}
                            >
                              {field.show ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={handlePasswordChange} style={{ ...secondaryButton, width: '100%' }}>
                        <KeyRound size={14} strokeWidth={1.8} />
                        Actualizar Contraseña
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)', color: 'var(--vp-text-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={15} strokeWidth={1.7} />
                </div>
                <div>
                  <p style={{ color: 'var(--vp-text)', fontSize: 13, fontWeight: 750, margin: 0 }}>Autenticación 2FA</p>
                  <p style={{ color: twoFactorEnabled ? 'var(--vp-accent)' : 'var(--vp-muted)', fontSize: 10, margin: '2px 0 0', fontWeight: 650 }}>
                    {twoFactorEnabled ? 'Habilitado' : 'Deshabilitado'}
                  </p>
                </div>
              </div>
              <Toggle enabled={twoFactorEnabled} onClick={() => setTwoFactorEnabled(!twoFactorEnabled)} label="Alternar 2FA" />
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--vp-border)' }}>
              <button
                onClick={handleLogout}
                style={{
                  ...smallButton,
                  width: '100%',
                  color: 'var(--vp-danger)',
                  background: 'var(--vp-danger-muted)',
                  border: '1px solid var(--vp-danger-border)',
                }}
              >
                <LogOut size={14} strokeWidth={1.8} />
                Cerrar sesión
              </button>
            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
          style={{ ...surface, padding: 24, borderRadius: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
            <Bell size={15} strokeWidth={1.8} style={{ color: 'var(--vp-subtle)' }} />
            <p style={eyebrow}>Preferencias</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {preferences.map((pref) => (
              <div key={pref.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <p style={{ color: 'var(--vp-text)', fontSize: 13, fontWeight: 750, margin: '0 0 4px' }}>{pref.label}</p>
                  <p style={{ color: 'var(--vp-muted)', fontSize: 11, margin: 0 }}>{pref.sub}</p>
                </div>
                <Toggle enabled={pref.state} onClick={pref.toggle} label={pref.label} />
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          style={{ ...surface, padding: 24, borderRadius: 16 }}
        >
          <p style={{ ...eyebrow, marginBottom: 18 }}>Tu Código de Referido</p>

          <div
            style={{
              marginBottom: 18,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: 20,
              borderRadius: 12,
              background: 'var(--vp-accent-muted)',
              border: '1px solid var(--vp-accent-border)',
            }}
          >
            <p style={{ color: 'var(--vp-accent)', fontSize: 28, fontWeight: 850, letterSpacing: '2px', margin: '0 0 7px', fontFamily: 'Montserrat, monospace' }}>
              {REFERRAL_CODE}
            </p>
            <p style={{ color: 'var(--vp-muted)', fontSize: 12, margin: 0 }}>Código único - No transferible</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 20 }}>
            <motion.button
              onClick={() => copyText(REFERRAL_CODE, 'Código copiado correctamente')}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              style={secondaryButton}
            >
              <Copy size={14} strokeWidth={1.8} />
              Copiar código
            </motion.button>

            <motion.button
              onClick={() => showToast('Solicitud de nuevo código enviada')}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              style={smallButton}
            >
              <RefreshCw size={14} strokeWidth={1.8} />
              Nuevo código
            </motion.button>

            <motion.button
              onClick={shareReferral}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              style={{
                ...smallButton,
                background: 'var(--vp-amber-muted)',
                border: '1px solid var(--vp-amber-border)',
                color: 'var(--vp-amber)',
              }}
            >
              <Share2 size={14} strokeWidth={1.8} />
              Compartir
            </motion.button>
          </div>

          <div style={{ height: 1, background: 'var(--vp-border)', margin: '18px 0' }} />

          <p style={{ color: 'var(--vp-muted)', fontSize: 12, fontWeight: 700, margin: '0 0 10px' }}>Tu enlace de referido:</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div
              style={{
                flex: '1 1 320px',
                padding: '11px 13px',
                borderRadius: 10,
                background: 'var(--vp-surface-raised)',
                border: '1px solid var(--vp-border)',
                color: 'var(--vp-text-soft)',
                fontSize: 12,
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                lineHeight: 1.5,
              }}
            >
              {REFERRAL_URL}
            </div>
            <button onClick={() => copyText(REFERRAL_URL, 'Enlace copiado correctamente')} style={secondaryButton}>
              <Copy size={14} strokeWidth={1.8} />
              Copiar
            </button>
            <button
              onClick={shareReferral}
              style={{
                ...smallButton,
                background: 'var(--vp-amber-muted)',
                border: '1px solid var(--vp-amber-border)',
                color: 'var(--vp-amber)',
              }}
            >
              <Share2 size={14} strokeWidth={1.8} />
              Compartir
            </button>
          </div>
        </motion.section>
      </main>

      <AnimatePresence>
        {showIDModal && <DigitalIDModal onClose={() => setShowIDModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
