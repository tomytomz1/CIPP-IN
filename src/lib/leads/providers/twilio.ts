/**
 * Twilio SMS adapter (optional channel under the locked architecture).
 *
 * Implements the documented Messaging API (POST
 * https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json, HTTP basic auth,
 * application/x-www-form-urlencoded body with To / From / Body). It makes NO network call here:
 * no Twilio account, auth token, number, or A2P registration exists, and SMS delivery is
 * disabled (see notifications.ts).
 *
 * SMS bodies stay minimal by contract (identifiers plus an operator action prompt); homeowner
 * contact details are never placed in an SMS.
 */
import { smsMessageSchema, type SmsMessage } from '../contract.ts';
import { PROVIDER_TIMEOUT_MS, retryableStatus, withTimeout, type ProviderSendResult, type SmsProvider } from './types.ts';

export const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

export interface TwilioOptions {
  accountSid: string;
  authToken: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export function twilioMessagesUrl(accountSid: string): string {
  return `${TWILIO_API_BASE}/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
}

/** Twilio statuses that mean the message was accepted for delivery. */
const ACCEPTED_STATUSES = new Set(['accepted', 'queued', 'sending', 'sent', 'delivered']);

export function createTwilioSmsProvider(options: TwilioOptions): SmsProvider {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? PROVIDER_TIMEOUT_MS;

  return {
    name: 'twilio',
    async send(message: SmsMessage): Promise<ProviderSendResult> {
      const parsed = smsMessageSchema.safeParse(message);
      if (!parsed.success) return { ok: false, retryable: false, code: 'invalid_sms_message' };
      if (!options.accountSid || !options.authToken) return { ok: false, retryable: false, code: 'missing_credentials' };

      const form = new URLSearchParams({ To: parsed.data.to, From: parsed.data.from, Body: parsed.data.body });
      const attempt = await withTimeout(
        fetchImpl,
        twilioMessagesUrl(options.accountSid),
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${btoa(`${options.accountSid}:${options.authToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            // Twilio deduplicates on this header for identical requests within a short window.
            'I-Twilio-Idempotency-Token': parsed.data.idempotencyKey,
          },
          body: form.toString(),
        },
        timeoutMs,
      );
      if ('failure' in attempt) return { ok: false, ...attempt.failure };

      const { response } = attempt;
      let body: Record<string, unknown> | null = null;
      try {
        const value: unknown = await response.json();
        body = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
      } catch {
        body = null;
      }

      if (response.ok) {
        const sid = typeof body?.['sid'] === 'string' ? (body['sid'] as string) : null;
        const status = typeof body?.['status'] === 'string' ? (body['status'] as string) : '';
        if (!sid) return { ok: false, retryable: false, code: 'unparsable_success_response', status: response.status };
        if (!ACCEPTED_STATUSES.has(status)) return { ok: false, retryable: false, code: 'not_accepted', status: response.status };
        return { ok: true, providerMessageId: sid };
      }

      const providerCode = typeof body?.['code'] === 'number' ? String(body['code']) : 'provider_error';
      return {
        ok: false,
        retryable: retryableStatus(response.status),
        code: `twilio_${providerCode}`.slice(0, 40),
        status: response.status,
      };
    },
  };
}
