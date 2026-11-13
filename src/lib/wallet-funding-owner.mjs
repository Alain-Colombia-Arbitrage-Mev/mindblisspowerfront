/** A view scope only: authorization always comes from the native backend session. */
export function walletFundingOwnerKey(session) {
  const email = typeof session?.email === 'string' ? session.email.trim().toLowerCase() : '';
  return email ? JSON.stringify([typeof session.subject === 'string' ? session.subject : '', email]) : '';
}
