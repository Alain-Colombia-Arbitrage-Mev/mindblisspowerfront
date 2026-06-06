import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { validateAdminAccess } from '@/lib/AdminRouteGuard';
import ContentVelocity from '@/components/admin/ContentVelocity';

export default function ContentVelocityPage() {
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
          PRODUCTION MONITORING
        </p>
      </motion.div>
      <ContentVelocity />
    </div>
  );
}