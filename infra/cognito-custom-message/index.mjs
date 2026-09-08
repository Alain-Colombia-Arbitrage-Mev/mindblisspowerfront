const purposes = {
  CustomMessage_SignUp: ["Confirma tu cuenta", "Confirm your account"],
  CustomMessage_ResendCode: ["Confirma tu cuenta", "Confirm your account"],
  CustomMessage_ForgotPassword: ["Restablece tu contrasena", "Reset your password"],
  CustomMessage_Authentication: ["Tu codigo de acceso", "Your sign-in code"],
  CustomMessage_UpdateUserAttribute: ["Verifica tus datos de contacto", "Verify your contact details"],
  CustomMessage_VerifyUserAttribute: ["Verifica tus datos de contacto", "Verify your contact details"],
  CustomMessage_AdminCreateUser: ["Tu acceso a Mindbliss Power", "Your Mindbliss Power access"],
};

export async function handler(event) {
  const purpose = purposes[event.triggerSource];
  if (!purpose) return event;
  const english = String(event.request?.userAttributes?.locale || "es").toLowerCase().startsWith("en");
  const code = event.request?.codeParameter || "{####}";
  const invitation = event.triggerSource === "CustomMessage_AdminCreateUser";
  const title = purpose[english ? 1 : 0];
  const username = invitation ? `<p>${english ? "Username" : "Usuario"}: ${escapeHtml(event.request?.usernameParameter || "{username}")}</p>` : "";
  event.response ||= {};
  event.response.emailSubject = `${title} - Mindbliss Power`;
  event.response.emailMessage = [
    '<!doctype html><html><body style="font-family:Arial,sans-serif;color:#161616;line-height:1.6">',
    `<h2>${title}</h2>`, username,
    `<p>${english ? "Enter this code in the step you requested:" : "Ingresa este codigo en el paso que solicitaste:"}</p>`,
    `<p style="font-size:28px;font-weight:bold">${escapeHtml(code)}</p>`,
    `<p>${english ? "Use the latest code for this step. Do not share it with anyone." : "Usa el ultimo codigo de este paso. No lo compartas con nadie."}</p>`,
    `<p>${english ? "If you did not request this message, ignore it." : "Si no solicitaste este mensaje, ignoralo."}</p>`,
    "<p>Mindbliss Power</p></body></html>",
  ].join("");
  // ASCII keeps transactional SMS within a single GSM-7 segment.
  event.response.smsMessage = invitation
    ? `Mindbliss Power: ${event.request?.usernameParameter || "{username}"}, ${code}`
    : `Mindbliss Power: ${english ? "your code is" : "tu codigo es"} ${code}. ${english ? "Do not share it." : "No lo compartas."}`;
  return event;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}
