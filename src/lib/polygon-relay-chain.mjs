/** AppKit's embedded EVM provider returns numeric IDs; injected providers use hex.
 * Accept only explicit Polygon mainnet identities, without coercing RPC values.
 */
export function isPolygonRelayChain(value) {
  return value === 137 || value === '137' || value === '0x89' || value === 'eip155:137';
}
