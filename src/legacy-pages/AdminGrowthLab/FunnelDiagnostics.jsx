import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { validateAdminAccess } from '@/lib/AdminRouteGuard';
import FunnelDiagnostics from '@/components/admin/FunnelDiagnostics';

export default function FunnelDiagnosticsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!validateAdminAccess()) {
      navigate('/admin-access');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-vicion-deep space-y-8 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat' }}>
          CONVERSION ANALYSIS
        </p>
      </motion.div>
      <FunnelDiagnostics />
    </div>
  );
}