/**
 * Live-intake activation boundary and HTTP adapter. Proves live lead collection is disabled by
 * default and fails closed when any required configuration or legal approval is absent.
 * No network call is made; Turnstile verification uses an injected fetch.
 */
import { describe, expect, it, vi } from 'vitest';
import { resolveIntakeActivation } from '../../src/lib/leads/activation.ts';
import { handleLeadIntakeRequest, MAX_INTAKE_BODY_BYTES } from '../../src/lib/leads/http.ts';
import { verifyTurnstile, TURNSTILE_VERIFY_URL } from '../../src/lib/leads/turnstile.ts';
import { intakeInput } from '../fixtures/leads.ts';

/** A configuration that WOULD enable intake. It does not exist in the repository or in CI. */
function fullyConfiguredEnv(overrides: Record<string, unknown> = {}) {
  return {
    LEAD_INTAKE_ENABLED: 'true',
    LEAD_LEGAL_REVIEW_REF: 'FIXTURE-legal-review-ref',
    LEAD_CONSENT_ARTIFACT_ID: 'TEST-ONLY-contractor-sharing-consent',
    LEAD_CONSENT_ARTIFACT_VERSION: 'test-0',
    TURNSTILE_SECRET_KEY: 'FIXTURE-secret-not-a-real-key',
    DB: { prepare: () => ({}) },
    LEAD_QUEUE: { send: async () => {} },
    ...overrides,
  };
}

const post = (body: unknown) =>
  new Request('https://example.invalid/api/lead-intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('24. live intake is disabled by default', () => {
  it('an empty environment disables intake with explicit reasons', () => {
    const activation = resolveIntakeActivation({});
    expect(activation.enabled).toBe(false);
    if (activation.enabled) throw new Error('unreachable');
    expect(activation.reasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining('LEAD_INTAKE_ENABLED'),
        expect.stringContaining('LEAD_LEGAL_REVIEW_REF'),
        expect.stringContaining('consent artifact'),
        expect.stringContaining('TURNSTILE_SECRET_KEY'),
        expect.stringContaining('D1 binding DB'),
        expect.stringContaining('Queue binding LEAD_QUEUE'),
      ]),
    );
  });

  it('the endpoint returns 503 and never reads the submitted body', async () => {
    const request = post({ lead: intakeInput(), turnstileToken: 'x' });
    const spy = vi.spyOn(request, 'text');
    const response = await handleLeadIntakeRequest(request, { env: {} });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: 'lead_intake_disabled' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejects non-POST methods', async () => {
    const response = await handleLeadIntakeRequest(new Request('https://example.invalid/api/lead-intake'), { env: fullyConfiguredEnv() });
    expect(response.status).toBe(405);
  });
});

describe('25. production activation fails closed when any requirement is missing', () => {
  const cases: [string, Record<string, unknown>][] = [
    ['flag not "true"', { LEAD_INTAKE_ENABLED: 'yes' }],
    ['flag missing', { LEAD_INTAKE_ENABLED: undefined }],
    ['legal review reference missing', { LEAD_LEGAL_REVIEW_REF: '' }],
    ['consent artifact id missing', { LEAD_CONSENT_ARTIFACT_ID: '' }],
    ['consent artifact version missing', { LEAD_CONSENT_ARTIFACT_VERSION: '' }],
    ['Turnstile secret missing', { TURNSTILE_SECRET_KEY: '' }],
    ['D1 binding missing', { DB: undefined }],
    ['queue binding missing', { LEAD_QUEUE: undefined }],
    ['D1 binding is not a database', { DB: { notPrepare: true } }],
  ];
  for (const [name, override] of cases) {
    it(`disabled: ${name}`, async () => {
      const env = fullyConfiguredEnv(override);
      expect(resolveIntakeActivation(env).enabled).toBe(false);
      const response = await handleLeadIntakeRequest(post({ lead: intakeInput(), turnstileToken: 'x' }), { env });
      expect(response.status).toBe(503);
    });
  }

  it('a TEST-ONLY consent artifact can never be used in production', async () => {
    const env = fullyConfiguredEnv({ SITE_ENV: 'production' });
    const activation = resolveIntakeActivation(env);
    expect(activation.enabled).toBe(false);
    if (activation.enabled) throw new Error('unreachable');
    expect(activation.reasons.join()).toMatch(/TEST-ONLY consent artifact/);
  });

  it('enables only when every requirement is satisfied (not the case in this repository)', () => {
    const activation = resolveIntakeActivation(fullyConfiguredEnv());
    expect(activation.enabled).toBe(true);
  });

  it('no committed configuration or CI environment enables intake', () => {
    expect(resolveIntakeActivation(process.env as Record<string, unknown>).enabled).toBe(false);
  });
});

describe('turnstile verification', () => {
  it('fails closed without a secret, token, or reachable service', async () => {
    expect(await verifyTurnstile({ secret: '', token: 't' })).toMatchObject({ ok: false });
    expect(await verifyTurnstile({ secret: 's', token: '' })).toMatchObject({ ok: false });
    const failing = vi.fn(async () => {
      throw new Error('network down');
    });
    expect(await verifyTurnstile({ secret: 's', token: 't', fetchImpl: failing as unknown as typeof fetch })).toEqual({
      ok: false,
      errorCodes: ['verification-unavailable'],
    });
  });

  it('posts to the documented endpoint and reports failure codes', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toBe(TURNSTILE_VERIFY_URL);
      return new Response(JSON.stringify({ success: false, 'error-codes': ['timeout-or-duplicate'] }), { status: 200 });
    });
    const result = await verifyTurnstile({ secret: 's', token: 't', fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result).toEqual({ ok: false, errorCodes: ['timeout-or-duplicate'] });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('a failed Turnstile check blocks intake even when activation is complete', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), { status: 200 }));
    const response = await handleLeadIntakeRequest(post({ lead: intakeInput(), turnstileToken: 'bad' }), {
      env: fullyConfiguredEnv(),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(response.status).toBe(403);
  });

  it('a missing Turnstile token is rejected before any database work', async () => {
    const response = await handleLeadIntakeRequest(post({ lead: intakeInput() }), { env: fullyConfiguredEnv() });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'missing_turnstile_token' });
  });
});

describe('request hardening', () => {
  it('rejects oversized and malformed bodies', async () => {
    const big = new Request('https://example.invalid/api/lead-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': String(MAX_INTAKE_BODY_BYTES + 1) },
      body: 'x'.repeat(MAX_INTAKE_BODY_BYTES + 1),
    });
    expect((await handleLeadIntakeRequest(big, { env: fullyConfiguredEnv() })).status).toBe(413);

    const malformed = new Request('https://example.invalid/api/lead-intake', { method: 'POST', body: 'not json' });
    expect((await handleLeadIntakeRequest(malformed, { env: fullyConfiguredEnv() })).status).toBe(400);
  });
});
