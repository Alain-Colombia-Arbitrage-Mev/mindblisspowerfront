/**
 * userTypeEngine — determines user_type from session data.
 *
 * DIRECT:     no referral, no network path selected
 * TRANSITION: selected network/growth path but not fully activated
 * NETWORK:    has referral code OR completed network activation
 */

export const USER_TYPES = {
  DIRECT: 'DIRECT',
  TRANSITION: 'TRANSITION',
  NETWORK: 'NETWORK',
};

// Module → route mapping
export const MODULE_ROUTES = {
  home: '/dashboard/home',
  network: '/dashboard/network',
  team: '/dashboard/team',
  bonificaciones: '/dashboard/bonificaciones',
  communications: '/dashboard/communications',
  rank: '/dashboard/rank',
  products: '/dashboard/products',
  activity: '/dashboard/activity',
  profile: '/dashboard/profile',
  support: '/dashboard/support',
  ai: '/dashboard/ai',
  auto: '/dashboard/auto',
  war_room: '/dashboard/war-room',
};

// Visibility rules per user_type
const VISIBILITY = {
  [USER_TYPES.DIRECT]: {
    visible: ['home', 'products', 'activity', 'profile', 'support'],
    locked: ['network', 'team', 'bonificaciones', 'rank', 'ai', 'auto', 'war_room', 'communications'],
  },
  [USER_TYPES.TRANSITION]: {
    visible: ['home', 'products', 'activity', 'profile', 'support', 'communications'],
    locked: ['network', 'team', 'bonificaciones', 'rank', 'ai', 'auto', 'war_room'],
  },
  [USER_TYPES.NETWORK]: {
    visible: ['home', 'network', 'team', 'bonificaciones', 'rank', 'communications', 'products', 'activity', 'profile', 'support', 'ai', 'auto', 'war_room'],
    locked: [],
  },
};

// Accounts that are always NETWORK regardless of stored data
const PROTECTED_NETWORK_ACCOUNTS = ['corona@vicion.com'];

/**
 * Derive user_type from stored session/onboarding data.
 */
export function getUserType() {
  try {
    const raw = localStorage.getItem('user_data');
    const userData = raw ? JSON.parse(raw) : {};

    // Hard-lock protected accounts to NETWORK
    if (PROTECTED_NETWORK_ACCOUNTS.includes((userData.email || '').toLowerCase())) {
      return USER_TYPES.NETWORK;
    }

    // Explicit user_type stored at activation takes priority
    if (userData.user_type === 'NETWORK') return USER_TYPES.NETWORK;
    if (userData.user_type === 'DIRECT') return USER_TYPES.DIRECT;

    // Legacy fallback: derive from path / referral_code
    const path = userData.path;
    const referralCode = userData.referral_code;
    const planValue = userData.planValue;

    if (referralCode || path === 'network') {
      return USER_TYPES.NETWORK;
    }

    const onboarding = (() => {
      try { return JSON.parse(localStorage.getItem('vp_onboarding') || '{}'); } catch { return {}; }
    })();

    if (onboarding.path === 'network' && !planValue) {
      return USER_TYPES.TRANSITION;
    }

    return USER_TYPES.DIRECT;
  } catch {
    return USER_TYPES.DIRECT;
  }
}

/**
 * Returns { visible: string[], locked: string[] } for a given user_type
 */
export function getModuleVisibility(userType) {
  return VISIBILITY[userType] || VISIBILITY[USER_TYPES.DIRECT];
}

/**
 * Returns true if the given route is accessible for the user_type
 */
export function isRouteAccessible(route, userType) {
  const { locked } = getModuleVisibility(userType);
  return !locked.some(mod => MODULE_ROUTES[mod] === route);
}

/**
 * Returns the redirect route for the fallback lock screen
 */
export function getLockRedirect() {
  return '/dashboard/home';
}