export function buildUnconfirmedLoginTransition(email) {
  return {
    needsConfirm: true,
    email,
    confirmationCodeSent: false,
    error:
      "Tu cuenta aún no está confirmada. Te llevaremos a confirmarla y enviaremos un solo código nuevo. / " +
      "Your account isn't confirmed yet. We'll take you to confirmation and send one new code.",
    delivery: null,
  };
}
