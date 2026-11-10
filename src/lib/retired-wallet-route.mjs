/** Administrative funding is unavailable on the personal portal. No backend call. */
export function retiredWalletRoute() {
  return Response.json({ error: 'not_found' }, {
    status: 404,
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
  });
}
