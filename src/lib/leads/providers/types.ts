/**
 * Notification provider contracts (docs/05 -> Approved Stack: Resend for email, Twilio for SMS).
 *
 * Providers are injectable so the delivery pipeline is fully testable without a network call,
 * an account, an API key, or a phone number. No provider is configured in this repository.
 *
 * A provider result is deliberately narrow: the consumer must be able to decide "retry" vs
 * "stop" without parsing vendor-specific error text, and no provider payload or response may
 * carry homeowner contact details into logs.
 */
import type { EmailMessage, SmsMessage } from '../contract.ts';

export type ProviderSendResult =
  | { ok: true; providerMessageId: string }
  | {
      ok: false;
      /** True only for failures where an identical retry is safe and may succeed. */
      retryable: boolean;
      /** Stable, enum-like reason code. Never free-form provider text. */
      code: string;
      status?: number;
    };

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<ProviderSendResult>;
}

export interface SmsProvider {
  readonly name: string;
  send(message: SmsMessage): Promise<ProviderSendResult>;
}

/** Default request timeout for provider HTTP calls. */
export const PROVIDER_TIMEOUT_MS = 10_000;

/**
 * Runs a provider HTTP call with an abort-based timeout and maps transport failures to a
 * retryable result. Never throws: a delivery attempt must always produce a durable outcome.
 */
export async function withTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<{ response: Response } | { failure: { code: string; retryable: boolean } }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { ...init, signal: controller.signal });
    return { response };
  } catch (err) {
    const aborted = controller.signal.aborted || (err instanceof Error && err.name === 'AbortError');
    // A timeout leaves the provider's state uncertain, so retries reuse the same idempotency
    // key: the provider, not this code, decides whether a duplicate send happens.
    return { failure: { code: aborted ? 'provider_timeout' : 'provider_unreachable', retryable: true } };
  } finally {
    clearTimeout(timer);
  }
}

/** Shared HTTP status mapping. 429 and 5xx are transient; 4xx configuration errors are not. */
export function retryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}
