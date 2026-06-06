/**
 * OnboardingResume — redirects user back to onboarding at their exact saved step.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sessionManager } from '@/lib/sessionManager';

export default function OnboardingResume() {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthed = sessionManager.isAuthenticated();
    const status = sessionManager.getStatus();

    if (!isAuthed) {
      navigate('/login', { replace: true });
      return;
    }

    if (status === 'active') {
      navigate('/dashboard/home', { replace: true });
      return;
    }

    // status === 'onboarding' — go to start (step is restored inside OnboardingStart via sessionStorage)
    setTimeout(() => {
      navigate('/onboarding/start', { replace: true });
    }, 800);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#050c1a 0%,#0a1628 50%,#07101f 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      fontFamily: 'Inter,sans-serif',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '3px solid rgba(59,130,246,0.2)',
          borderTop: '3px solid #3b82f6',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ textAlign: 'center' }}
      >
        <p style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
          Retomando tu proceso
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          Volvemos exactamente donde lo dejaste...
        </p>
      </motion.div>
    </div>
  );
}