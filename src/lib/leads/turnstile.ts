/**
 * Cloudflare Turnstile server-side verification (docs/05 → Security).
 * Injectable fetch, so tests never make a network call. Fails closed on any error.
 * No Turnstile widget, key, or secret exists yet; this is the verification path only.
 */
export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileResult {
  ok: boolean;
  errorCodes: string[];
}

export interface TurnstileOptions {
  secret: string;
  token: string;
  remoteIp?: string | undefined;
  idempotencyKey?: string | undefined;
  fetchImpl?: typeof fetch;
}

export async function verifyTurnstile(options: TurnstileOptions): Promise<TurnstileResult> {
  if (!options.secret) return { ok: false, errorCodes: ['missing-secret'] };
  if (!options.token) return { ok: false, errorCodes: ['missing-input-response'] };

  const body = new FormData();
  body.append('secret', options.secret);
  body.append('response', options.token);
  if (options.remoteIp) body.append('remoteip', options.remoteIp);
  if (options.idempotencyKey) body.append('idempotency_key', options.idempotencyKey);

  try {
    const doFetch = options.fetchImpl ?? fetch;
    const response = await doFetch(TURNSTILE_VERIFY_URL, { method: 'POST', body });
    if (!response.ok) return { ok: false, errorCodes: [`http-${response.status}`] };
    const json = (await response.json()) as { success?: unknown; 'error-codes'?: unknown };
    const errorCodes = Array.isArray(json['error-codes']) ? json['error-codes'].map(String) : [];
    return { ok: json.success === true, errorCodes };
  } catch {
    // Network/parse failure: fail closed.
    return { ok: false, errorCodes: ['verification-unavailable'] };
  }
}
