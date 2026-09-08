export function otpSendRules(email) {
  if (!email) return [];
  // Shared across signup, resend, reset and both login channels on this node.
  return [
    { key: `otp-send:cooldown:${email}`, limit: 1, windowMs: 45_000 },
    { key: `otp-send:hour:${email}`, limit: 12, windowMs: 3_600_000 },
  ];
}
