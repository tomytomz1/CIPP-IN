/**
 * Phase 2C provider-adapter and activation-boundary tests.
 *
 * Proves that notification delivery fails closed without real configuration, that synthetic
 * values can never activate production, and that the Resend/Twilio adapters parse documented
 * responses correctly — all without a network call, account, key, or phone number. Global
 * `fetch` is stubbed to throw, so any real request fails the suite.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emailMessageSchema, smsMessageSchema } from '../../src/lib/leads/contract.ts';
import { processDeliveryMessage } from '../../src/lib/leads/delivery.ts';
import {
  TEST_TEMPLATE_MARKER,
  renderLeadSms,
  renderOperatorFallbackNotice,
  renderPartnerLeadNotice,
  resolveNotificationActivation,
} from '../../src/lib/leads/notifications.ts';
import { RESEND_SEND_URL, createResendEmailProvider } from '../../src/lib/leads/providers/resend.ts';
import { createTwilioSmsProvider, twilioMessagesUrl } from '../../src/lib/leads/providers/twilio.ts';
import { PROVIDER_TIMEOUT_MS } from '../../src/lib/leads/providers/types.ts';
import { FIXTURE_FROM_EMAIL, FIXTURE_OPERATOR_EMAIL, FakeEmailProvider, testNotificationEnv } from '../fixtures/leads.ts';

let networkCalls = 0;
beforeEach(() => {
  networkCalls = 0;
  vi.stubGlobal('fetch', () => {
    networkCalls += 1;
    throw new Error('network access is not allowed in tests');
  });
});
afterEach(() => {
  expect(networkCalls).toBe(0);
  vi.unstubAllGlobals();
});

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const message = {
  from: FIXTURE_FROM_EMAIL,
  to: FIXTURE_OPERATOR_EMAIL,
  subject: `${TEST_TEMPLATE_MARKER} test`,
  text: `${TEST_TEMPLATE_MARKER} body`,
  idempotencyKey: 'isr-delivery-fixture-email',
};

describe('17-18. notification delivery fails closed without complete configuration', () => {
  it('an empty environment cannot send, and says why', () => {
    const activation = resolveNotificationActivation({});
    expect(activation.enabled).toBe(false);
    expect(activation.email).toBeNull();
    expect(activation.reasons.join(' ')).toMatch(/NOTIFICATIONS_ENABLED/);
    expect(activation.reasons.join(' ')).toMatch(/RESEND_API_KEY/);
    expect(activation.reasons.join(' ')).toMatch(/NOTIFICATION_FROM_EMAIL/);
    expect(activation.reasons.join(' ')).toMatch(/OPERATOR_NOTIFICATION_EMAIL/);
    expect(activation.reasons.join(' ')).toMatch(/D1 binding DB/);
  });

  it('every partial configuration is disabled', () => {
    const cases: [string, Record<string, unknown>][] = [
      ['flag not "true"', { NOTIFICATIONS_ENABLED: 'yes' }],
      ['flag missing', { NOTIFICATIONS_ENABLED: undefined }],
      ['api key missing', { RESEND_API_KEY: '' }],
      ['from address missing', { NOTIFICATION_FROM_EMAIL: '' }],
      ['from address invalid', { NOTIFICATION_FROM_EMAIL: 'not-an-email' }],
      ['operator address missing', { OPERATOR_NOTIFICATION_EMAIL: '' }],
      ['database binding missing', { DB: undefined }],
      ['database binding is not a database', { DB: { nope: true } }],
      ['partial Twilio configuration', { TWILIO_ACCOUNT_SID: 'TEST-ONLY-sid' }],
      ['invalid Twilio number', { TWILIO_ACCOUNT_SID: 'a', TWILIO_AUTH_TOKEN: 'b', TWILIO_FROM_NUMBER: '3175550199' }],
    ];
    for (const [name, override] of cases) {
      const activation = resolveNotificationActivation(testNotificationEnv(override));
      expect({ name, enabled: activation.enabled }).toEqual({ name, enabled: false });
    }
  });

  it('no committed configuration or CI environment enables notifications', () => {
    expect(resolveNotificationActivation(process.env as Record<string, unknown>).enabled).toBe(false);
  });

  it('a disabled pipeline never calls a provider', async () => {
    const email = new FakeEmailProvider();
    const outcome = await processDeliveryMessage(
      { schemaVersion: 1, kind: 'deliver_to_partner', leadId: crypto.randomUUID(), routeId: crypto.randomUUID(), deliveryId: crypto.randomUUID() },
      { db: { prepare: () => { throw new Error('database must not be touched'); }, batch: async () => [] }, activation: resolveNotificationActivation({}), email },
    );
    expect(outcome).toMatchObject({ status: 'retry', reason: 'notifications_disabled' });
    expect(email.sent).toHaveLength(0);
  });
});

describe('19. test-only configuration cannot activate production', () => {
  it('rejects synthetic keys and reserved test domains when SITE_ENV is production', () => {
    const activation = resolveNotificationActivation(testNotificationEnv({ SITE_ENV: 'production' }));
    expect(activation.enabled).toBe(false);
    const reasons = activation.reasons.join(' ');
    expect(reasons).toMatch(/test-only RESEND_API_KEY/);
    expect(reasons).toMatch(/test-only NOTIFICATION_FROM_EMAIL/);
    expect(reasons).toMatch(/test-only OPERATOR_NOTIFICATION_EMAIL/);
  });

  it('rejects test Twilio credentials in production', () => {
    const activation = resolveNotificationActivation(
      testNotificationEnv({
        SITE_ENV: 'production',
        RESEND_API_KEY: 'plausible-but-unused',
        NOTIFICATION_FROM_EMAIL: 'alerts@indysewerresource.example',
        OPERATOR_NOTIFICATION_EMAIL: 'operator@indysewerresource.example',
        TWILIO_ACCOUNT_SID: 'TEST-ONLY-sid',
        TWILIO_AUTH_TOKEN: 'TEST-ONLY-token',
        TWILIO_FROM_NUMBER: '+13175550199',
      }),
    );
    expect(activation.enabled).toBe(false);
    expect(activation.reasons.join(' ')).toMatch(/test-only Twilio credentials/);
  });

  it('enables only when everything is present (never the case in this repository)', () => {
    const activation = resolveNotificationActivation(testNotificationEnv());
    expect(activation.enabled).toBe(true);
    expect(activation.sms).toBeNull();
  });
});

describe('20-21. Resend adapter parses documented responses', () => {
  it('sends the documented request and parses a success id', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = ((url: string, init: RequestInit) => {
      calls.push({ url, init });
      return Promise.resolve(jsonResponse(200, { id: '49a3999c-0ce1-4ea6-ab68-afcd6dc2e794' }));
    }) as unknown as typeof fetch;

    const provider = createResendEmailProvider({ apiKey: 'TEST-ONLY-key', fetchImpl });
    const result = await provider.send(message);

    expect(result).toEqual({ ok: true, providerMessageId: '49a3999c-0ce1-4ea6-ab68-afcd6dc2e794' });
    expect(calls[0]?.url).toBe(RESEND_SEND_URL);
    expect(calls[0]?.init.method).toBe('POST');
    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer TEST-ONLY-key');
    expect(headers['Idempotency-Key']).toBe(message.idempotencyKey);
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    expect(calls[0]?.init.signal).toBeDefined();
    expect(PROVIDER_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it('maps non-2xx responses to retryable or terminal outcomes', async () => {
    const cases: [number, unknown, boolean, string][] = [
      [422, { name: 'validation_error', message: 'x' }, false, 'validation_error'],
      [401, { name: 'missing_api_key', message: 'x' }, false, 'missing_api_key'],
      [429, { name: 'rate_limit_exceeded', message: 'x' }, true, 'rate_limit_exceeded'],
      [500, { name: 'application_error', message: 'x' }, true, 'application_error'],
      [409, { name: 'concurrent_idempotent_requests', message: 'x' }, true, 'concurrent_idempotent_requests'],
    ];
    for (const [status, body, retryable, code] of cases) {
      const provider = createResendEmailProvider({
        apiKey: 'TEST-ONLY-key',
        fetchImpl: (() => Promise.resolve(jsonResponse(status, body))) as unknown as typeof fetch,
      });
      expect(await provider.send(message)).toEqual({ ok: false, retryable, code, status });
    }
  });

  it('treats an unparsable 2xx as terminal rather than risking a duplicate send', async () => {
    const provider = createResendEmailProvider({
      apiKey: 'TEST-ONLY-key',
      fetchImpl: (() => Promise.resolve(new Response('not json', { status: 200 }))) as unknown as typeof fetch,
    });
    expect(await provider.send(message)).toMatchObject({ ok: false, retryable: false, code: 'unparsable_success_response' });
  });

  it('refuses to send without an API key or with an invalid message', async () => {
    const fetchImpl = vi.fn();
    const provider = createResendEmailProvider({ apiKey: '', fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(await provider.send(message)).toMatchObject({ ok: false, code: 'missing_api_key' });
    const configured = createResendEmailProvider({ apiKey: 'TEST-ONLY-key', fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(await configured.send({ ...message, to: 'not-an-email' })).toMatchObject({ ok: false, code: 'invalid_email_message' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps transport failures to a retryable outcome', async () => {
    const provider = createResendEmailProvider({
      apiKey: 'TEST-ONLY-key',
      fetchImpl: (() => Promise.reject(new Error('connection reset'))) as unknown as typeof fetch,
    });
    expect(await provider.send(message)).toEqual({ ok: false, retryable: true, code: 'provider_unreachable' });
  });
});

describe('22. SMS contract and Twilio adapter stay minimal', () => {
  it('the SMS contract accepts identifiers only', () => {
    const valid = {
      to: '+13175550188',
      from: '+13175550199',
      body: `${TEST_TEMPLATE_MARKER} New routed lead.`,
      idempotencyKey: 'isr-delivery-fixture-sms',
    };
    expect(smsMessageSchema.safeParse(valid).success).toBe(true);
    for (const extra of [{ firstName: 'Fixture' }, { homeownerPhone: '+13175550142' }, { description: 'backup' }]) {
      expect(smsMessageSchema.safeParse({ ...valid, ...extra }).success).toBe(false);
    }
    expect(smsMessageSchema.safeParse({ ...valid, to: '3175550188' }).success).toBe(false);
    expect(emailMessageSchema.safeParse({ ...message, phone: '+13175550142' }).success).toBe(false);
  });

  it('templates carry identifiers, a test marker, and no contractor impersonation', () => {
    const ctx = { leadId: crypto.randomUUID(), routeId: crypto.randomUUID(), deliveryId: crypto.randomUUID(), channel: 'email' as const };
    const partner = renderPartnerLeadNotice(ctx);
    const operator = renderOperatorFallbackNotice({ ...ctx, reason: 'no_active_partner' });
    const sms = renderLeadSms({ ...ctx, kind: 'partner' });

    for (const text of [partner.subject, partner.text, operator.subject, operator.text, sms]) {
      expect(text).toContain(TEST_TEMPLATE_MARKER);
      expect(text).not.toMatch(/we will (repair|line|replace)/i);
    }
    expect(partner.text).toContain(ctx.leadId);
    expect(partner.text).toContain('does not perform plumbing work');
    expect(sms.length).toBeLessThanOrEqual(320);
  });

  it('posts the documented Twilio request and parses the response', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = ((url: string, init: RequestInit) => {
      calls.push({ url, init });
      return Promise.resolve(jsonResponse(201, { sid: 'SMFIXTURE0001', status: 'queued' }));
    }) as unknown as typeof fetch;
    const provider = createTwilioSmsProvider({ accountSid: 'ACFIXTURE', authToken: 'TEST-ONLY-token', fetchImpl });

    const result = await provider.send({
      to: '+13175550188',
      from: '+13175550199',
      body: `${TEST_TEMPLATE_MARKER} New routed lead.`,
      idempotencyKey: 'isr-delivery-fixture-sms',
    });

    expect(result).toEqual({ ok: true, providerMessageId: 'SMFIXTURE0001' });
    expect(calls[0]?.url).toBe(twilioMessagesUrl('ACFIXTURE'));
    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(headers['Authorization']).toMatch(/^Basic /);
    expect([...new URLSearchParams(String(calls[0]?.init.body)).keys()].sort()).toEqual(['Body', 'From', 'To']);
  });

  it('maps Twilio failures and refuses to send without credentials', async () => {
    const failing = createTwilioSmsProvider({
      accountSid: 'ACFIXTURE',
      authToken: 'TEST-ONLY-token',
      fetchImpl: (() => Promise.resolve(jsonResponse(400, { code: 21211, message: 'invalid' }))) as unknown as typeof fetch,
    });
    expect(await failing.send({ to: '+13175550188', from: '+13175550199', body: 'x', idempotencyKey: 'k' })).toMatchObject({
      ok: false,
      retryable: false,
      code: 'twilio_21211',
    });

    const unconfigured = createTwilioSmsProvider({ accountSid: '', authToken: '' });
    expect(await unconfigured.send({ to: '+13175550188', from: '+13175550199', body: 'x', idempotencyKey: 'k' })).toMatchObject({
      ok: false,
      code: 'missing_credentials',
    });
  });
});

describe('23. no real network call occurs', () => {
  it('global fetch is never used by the adapters in this suite', async () => {
    const provider = createResendEmailProvider({
      apiKey: 'TEST-ONLY-key',
      fetchImpl: (() => Promise.resolve(jsonResponse(200, { id: 'FIXTURE' }))) as unknown as typeof fetch,
    });
    await provider.send(message);
    expect(networkCalls).toBe(0);
  });
});
