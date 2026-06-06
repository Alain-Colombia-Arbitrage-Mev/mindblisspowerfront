import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserType, isRouteAccessible, getLockRedirect } from '@/lib/userTypeEngine';

/**
 * LockedRouteGuard — wraps member routes and redirects if the user_type
 * doesn't have access to the current path.
 */
export default function LockedRouteGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userType = getUserType();
    if (!isRouteAccessible(location.pathname, userType)) {
      navigate(getLockRedirect(), { replace: true, state: { locked: true, from: location.pathname } });
    }
  }, [location.pathname, navigate]);

  return children;
}