/**
 * Resend email adapter.
 *
 * Implements the documented HTTP API (POST https://api.resend.com/emails, bearer API key, JSON
 * body, optional `Idempotency-Key` header valid for 24 hours and up to 256 characters). It is
 * ready for future use but makes NO network call in this repository: no Resend account, domain,
 * or API key exists, and the delivery pipeline is disabled (see notifications.ts).
 *
 * Server-only. The API key is supplied by a Worker secret at runtime and is never logged,
 * echoed, or written to the database.
 */
import { emailMessageSchema, type EmailMessage } from '../contract.ts';
import { PROVIDER_TIMEOUT_MS, retryableStatus, withTimeout, type EmailProvider, type ProviderSendResult } from './types.ts';

export const RESEND_SEND_URL = 'https://api.resend.com/emails';

export interface ResendOptions {
  apiKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** Documented Resend error codes that are worth another attempt. */
const RETRYABLE_ERROR_NAMES = new Set([
  'rate_limit_exceeded',
  'concurrent_idempotent_requests',
  'application_error',
  'service_unavailable',
]);

export function createResendEmailProvider(options: ResendOptions): EmailProvider {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? PROVIDER_TIMEOUT_MS;

  return {
    name: 'resend',
    async send(message: EmailMessage): Promise<ProviderSendResult> {
      const parsed = emailMessageSchema.safeParse(message);
      if (!parsed.success) return { ok: false, retryable: false, code: 'invalid_email_message' };
      if (!options.apiKey) return { ok: false, retryable: false, code: 'missing_api_key' };

      const attempt = await withTimeout(
        fetchImpl,
        RESEND_SEND_URL,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': parsed.data.idempotencyKey,
          },
          body: JSON.stringify({
            from: parsed.data.from,
            to: parsed.data.to,
            subject: parsed.data.subject,
            text: parsed.data.text,
          }),
        },
        timeoutMs,
      );
      if ('failure' in attempt) return { ok: false, ...attempt.failure };

      const { response } = attempt;
      const body = await readJson(response);

      if (response.ok) {
        const id = typeof body?.['id'] === 'string' ? (body['id'] as string) : null;
        // A 2xx without a parsable id means the message may already be accepted; retrying could
        // duplicate it, so this is terminal and surfaces to the operator instead.
        if (!id) return { ok: false, retryable: false, code: 'unparsable_success_response', status: response.status };
        return { ok: true, providerMessageId: id };
      }

      const name = typeof body?.['name'] === 'string' ? (body['name'] as string) : 'provider_error';
      return {
        ok: false,
        retryable: retryableStatus(response.status) || RETRYABLE_ERROR_NAMES.has(name),
        code: sanitizeCode(name),
        status: response.status,
      };
    },
  };
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await response.json();
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Provider text is never logged verbatim; only a bounded enum-like token survives. */
function sanitizeCode(raw: string): string {
  const token = raw.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 40);
  return token.length > 0 ? token : 'provider_error';
}
