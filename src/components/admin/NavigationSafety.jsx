import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isValidAdminRoute, getFallbackRoute, validateNavigation } from '@/lib/NavigationGuard';

/**
 * Navigation Safety Wrapper
 * Validates routes and prevents traps
 * Wraps all admin routes
 */

export default function NavigationSafety({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Validate current route
    if (!isValidAdminRoute(location.pathname)) {
      console.warn(`Invalid route detected: ${location.pathname}, redirecting to overview`);
      navigate(getFallbackRoute(), { replace: true });
    }
  }, [location.pathname, navigate]);

  // Intercept broken navigation
  useEffect(() => {
    const handlePopState = (event) => {
      // Ensure we don't get stuck
      if (event.state?.invalid) {
        navigate(getFallbackRoute(), { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  return children;
}

// Hook to validate navigation before redirect
export function useNavigationValidator() {
  const navigate = useNavigate();

  return (targetPath) => {
    const validPath = validateNavigation(window.location.pathname, targetPath);
    navigate(validPath);
  };
}