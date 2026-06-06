import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SafePageWrapper({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const userAuth = localStorage.getItem('user_auth');
    const userRole = localStorage.getItem('user_role');
    
    // STRICT: only user_auth='true' AND role='user' is valid
    if (userAuth !== 'true' || userRole !== 'user') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const userAuth = localStorage.getItem('user_auth');
  const userRole = localStorage.getItem('user_role');
  
  // HARD BLOCK: if not authenticated or not user role, render nothing (navigate happens above)
  if (userAuth !== 'true' || userRole !== 'user') {
    return null;
  }

  return <>{children}</>;
}