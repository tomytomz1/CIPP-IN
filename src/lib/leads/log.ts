/**
 * Minimal logging helper. Only identifiers and enum-like reason codes are logged; homeowner
 * contact details, descriptions, and free text never are (docs/05 → Security).
 */
const ALLOWED_KEYS = new Set(['leadId', 'routeId', 'deliveryId', 'partnerId', 'reason', 'code', 'count', 'status']);

export function safeLog(level: 'info' | 'warn' | 'error', event: string, fields: Record<string, unknown> = {}): void {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!ALLOWED_KEYS.has(k)) continue;
    safe[k] = typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? v : String(v);
  }
  const line = JSON.stringify({ event, ...safe });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
