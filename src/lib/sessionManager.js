/**
 * SessionManager — single source of truth for user session state.
 * Handles localStorage read/write, validation, and safe reset.
 */

const KEYS = {
  USER_AUTH: 'user_auth',
  USER_ID: 'user_id',
  USER_STATUS: 'user_status',       // 'onboarding' | 'active'
  ONBOARDING_STEP: 'onboarding_step',
  USER_DATA: 'user_data',
  USER_ROLE: 'user_role',
  VP_ONBOARDING: 'vp_onboarding',
  VP_ACCOUNTS: 'vp_user_accounts',
};

export const sessionManager = {
  // ── Read ──────────────────────────────────────────────────────────────────

  isAuthenticated() {
    return localStorage.getItem(KEYS.USER_AUTH) === 'true';
  },

  getStatus() {
    return localStorage.getItem(KEYS.USER_STATUS) || null; // 'onboarding' | 'active'
  },

  getOnboardingStep() {
    const s = localStorage.getItem(KEYS.ONBOARDING_STEP);
    return s !== null ? parseInt(s, 10) : 0;
  },

  getUserData() {
    try {
      const raw = localStorage.getItem(KEYS.USER_DATA);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // ── Write ─────────────────────────────────────────────────────────────────

  startOnboarding(email) {
    localStorage.setItem(KEYS.USER_AUTH, 'true');
    localStorage.setItem(KEYS.USER_STATUS, 'onboarding');
    localStorage.setItem(KEYS.USER_ROLE, 'user');
    if (email) {
      localStorage.setItem(KEYS.USER_ID, `vp_onboarding_${email.replace(/[^a-z0-9]/gi, '_')}`);
    }
  },

  saveOnboardingStep(stepIndex) {
    localStorage.setItem(KEYS.ONBOARDING_STEP, String(stepIndex));
  },

  activateUser(userData) {
    const userId = userData.id || `vp_${Date.now()}`;
    localStorage.setItem(KEYS.USER_AUTH, 'true');
    localStorage.setItem(KEYS.USER_STATUS, 'active');
    localStorage.setItem(KEYS.USER_ID, userId);
    localStorage.setItem(KEYS.USER_ROLE, 'user');
    localStorage.setItem(KEYS.USER_DATA, JSON.stringify({ ...userData, id: userId }));
    localStorage.removeItem(KEYS.ONBOARDING_STEP);
    localStorage.removeItem(KEYS.VP_ONBOARDING);
    window.dispatchEvent(new Event('user-auth-updated'));
  },

  // ── Logout ────────────────────────────────────────────────────────────────

  logout() {
    localStorage.removeItem(KEYS.USER_AUTH);
    localStorage.removeItem(KEYS.USER_ID);
    localStorage.removeItem(KEYS.USER_STATUS);
    localStorage.removeItem(KEYS.ONBOARDING_STEP);
    localStorage.removeItem(KEYS.USER_DATA);
    localStorage.removeItem(KEYS.USER_ROLE);
    localStorage.removeItem(KEYS.VP_ONBOARDING);
    // Keep vp_user_accounts so the user can log back in
    window.dispatchEvent(new Event('user-auth-updated'));
  },

  // ── Register account (persist credentials for future login) ───────────────

  registerAccount(data) {
    if (!data.email || !data.password_hash) return;
    const accounts = JSON.parse(localStorage.getItem(KEYS.VP_ACCOUNTS) || '{}');
    accounts[data.email.toLowerCase()] = {
      ...data,
      status: 'active',
      registered_at: new Date().toISOString(),
    };
    localStorage.setItem(KEYS.VP_ACCOUNTS, JSON.stringify(accounts));
  },

  findAccount(email, passwordHash) {
    try {
      const accounts = JSON.parse(localStorage.getItem(KEYS.VP_ACCOUNTS) || '{}');
      const acc = accounts[email.toLowerCase()];
      if (acc && acc.password_hash === passwordHash) return acc;
      return null;
    } catch {
      return null;
    }
  },

  // ── Safety: reset corrupted session ───────────────────────────────────────

  safeReset() {
    localStorage.removeItem(KEYS.USER_AUTH);
    localStorage.removeItem(KEYS.USER_ID);
    localStorage.removeItem(KEYS.USER_STATUS);
    localStorage.removeItem(KEYS.ONBOARDING_STEP);
    localStorage.removeItem(KEYS.USER_DATA);
    localStorage.removeItem(KEYS.USER_ROLE);
  },

  validate() {
    try {
      const auth = localStorage.getItem(KEYS.USER_AUTH);
      const status = localStorage.getItem(KEYS.USER_STATUS);
      if (auth === 'true' && !status) {
        // Corrupted: auth=true but no status — reset
        this.safeReset();
        return false;
      }
      return true;
    } catch {
      this.safeReset();
      return false;
    }
  },
};