/**
 * SessionRedirect — shown during auth-based redirects.
 * Smooth loading screen with no flash.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sessionManager } from '@/lib/sessionManager';

export default function SessionRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Validate session safety
    const valid = sessionManager.validate();
    if (!valid) {
      navigate('/login', { replace: true });
      return;
    }

    const isAuthed = sessionManager.isAuthenticated();
    const status = sessionManager.getStatus();

    const timer = setTimeout(() => {
      if (!isAuthed) {
        navigate('/login', { replace: true });
      } else if (status === 'active') {
        navigate('/dashboard/home', { replace: true });
      } else if (status === 'onboarding') {
        navigate('/onboarding/resume', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#050c1a 0%,#0a1628 50%,#07101f 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 20,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid rgba(59,130,246,0.2)',
          borderTop: '3px solid #3b82f6',
        }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter,sans-serif' }}
      >
        Verificando sesión...
      </motion.p>
    </div>
  );
}