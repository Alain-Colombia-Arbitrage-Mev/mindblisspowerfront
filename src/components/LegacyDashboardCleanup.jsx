import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LegacyDashboardCleanup() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const userAuth = localStorage.getItem('user_auth');
    const userId = localStorage.getItem('user_id');

    if (userAuth === 'true' && userId) {
      // Redirect to new member platform
      navigate('/dashboard/home', { replace: true });
    } else {
      // Redirect to login
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#060e1c' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Redirecting to member platform...</p>
      </div>
    </div>
  );
}