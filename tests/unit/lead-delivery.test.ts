/**
 * Phase 2C queue-consumer / delivery tests.
 *
 * Everything here runs against a local D1 (Miniflare) database with SYNTHETIC fixtures. No
 * Cloudflare Queue, Resend account, Twilio account, phone number, API key, or network call is
 * involved: providers are injected fakes, and `fetch` is stubbed to throw so a real request
 * would fail the suite loudly.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ATTEMPT_LEASE_SECONDS,
  MAX_DELIVERY_ATTEMPTS,
  handleDeliveryBatch,
  processDeliveryMessage,
  providerIdempotencyKey,
} from '../../src/lib/leads/delivery.ts';
import { leadQueueMessageSchema } from '../../src/lib/leads/contract.ts';
import { submitLead } from '../../src/lib/leads/intake.ts';
import { resolveNotificationActivation } from '../../src/lib/leads/notifications.ts';
import { listLeadsNeedingAttention, getLeadContactForOperator } from '../../src/lib/leads/operator.ts';
import { createResendEmailProvider } from '../../src/lib/leads/providers/resend.ts';
import { listEvents, listRoutes } from '../../src/lib/leads/repository.ts';
import type { SqlDatabase } from '../../src/lib/leads/db.ts';
import { createTestDb, type TestDb } from '../helpers/d1.ts';
import {
  FIXTURE_MUNICIPALITY,
  FIXTURE_OPERATOR_EMAIL,
  FIXTURE_PARTNER_EMAIL,
  FIXTURE_PARTNER_PHONE,
  FakeEmailProvider,
  FakeQueue,
  FakeQueueMessage,
  FakeSmsProvider,
  TEST_CONSENT,
  intakeInput,
  seedPartner,
  setPartnerStatus,
  testNotificationEnv,
  testRuntime,
} from '../fixtures/leads.ts';

let harness: TestDb;
let db: SqlDatabase;
/** Any real network call in this suite is a test failure (required test 23). */
let networkCalls = 0;

beforeEach(async () => {
  harness = await createTestDb();
  db = harness.db;
  networkCalls = 0;
  vi.stubGlobal('fetch', () => {
    networkCalls += 1;
    throw new Error('network access is not allowed in tests');
  });
});
afterEach(async () => {
  expect(networkCalls).toBe(0);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await harness.dispose();
});

/** Values that must never leave the database: this lead's own contact details. */
const HOMEOWNER_NAME = 'Synthetica';
const PII = [HOMEOWNER_NAME, '(317) 555-0142', '+13175550142', 'homeowner@example.invalid'];

const activation = (overrides: Record<string, unknown> = {}) =>
  resolveNotificationActivation({ ...testNotificationEnv(overrides), DB: db as unknown as object });

async function seedLead(options: { partner?: boolean; email?: string | null; sms?: boolean } = {}) {
  const partner = options.partner === false ? null : await seedPartner(db, {
    ...(options.email === undefined ? {} : { notificationEmail: options.email, notifyEmail: options.email !== null }),
    ...(options.sms ? { notifySms: true, notifyEmail: false } : {}),
  });
  const queue = new FakeQueue();
  const result = await submitLead(intakeInput({ firstName: HOMEOWNER_NAME, email: 'homeowner@example.invalid' }), {
    db,
    queue,
    consentArtifact: TEST_CONSENT,
    source: 'test',
    runtime: testRuntime(),
  });
  return { ...result, partnerId: partner?.partnerId ?? null, message: queue.sent[0]! };
}

const eventTypes = async (leadId: string) => (await listEvents(db, leadId)).map((e) => e.event_type);

describe('1-3. queue message, historical route, durable success', () => {
  it('loads the immutable route and records a durable success', async () => {
    const lead = await seedLead();
    const email = new FakeEmailProvider();
    const outcome = await processDeliveryMessage(lead.message, { db, activation: activation(), email });

    expect(outcome).toMatchObject({ status: 'delivered', channel: 'email' });
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]).toMatchObject({
      to: FIXTURE_PARTNER_EMAIL,
      idempotencyKey: providerIdempotencyKey(lead.message.deliveryId, 'email'),
    });

    const events = await listEvents(db, lead.leadId);
    const success = events.find((e) => e.event_type === 'delivery_succeeded');
    expect(success).toBeDefined();
    const payload = JSON.parse(success!.payload_json) as Record<string, unknown>;
    expect(payload).toMatchObject({ deliveryId: lead.message.deliveryId, routeId: lead.routeId, channel: 'email' });
    expect(success!.idempotency_key).toBe(`success:${lead.message.deliveryId}:email`);
    expect(await eventTypes(lead.leadId)).toContain('delivery_attempt_started');
  });

  it('does not rerun routing: a newer, higher-priority partner is ignored', async () => {
    const lead = await seedLead();
    // Configuration changes after intake: a municipality-specific rule that routing would now prefer.
    const newer = await seedPartner(db, {
      name: 'FIXTURE-PARTNER-B (synthetic)',
      municipality: FIXTURE_MUNICIPALITY,
      priority: 1,
      notificationEmail: 'fixture-partner-b@example.invalid',
    });
    const email = new FakeEmailProvider();
    await processDeliveryMessage(lead.message, { db, activation: activation(), email });

    expect(email.sent[0]?.to).toBe(FIXTURE_PARTNER_EMAIL);
    expect(email.sent[0]?.to).not.toContain('partner-b');
    const routes = await listRoutes(db, lead.leadId);
    expect(routes).toHaveLength(1);
    expect(routes[0]?.partner_id).toBe(lead.partnerId);
    expect(routes[0]?.partner_id).not.toBe(newer.partnerId);
  });
});

describe('4-5, 25. idempotency under redelivery, concurrency, and restart', () => {
  it('a duplicate queue delivery sends only once', async () => {
    const lead = await seedLead();
    const email = new FakeEmailProvider();
    const deps = { db, activation: activation(), email };

    const first = await processDeliveryMessage(lead.message, deps);
    const second = await processDeliveryMessage(lead.message, deps);

    expect(first.status).toBe('delivered');
    expect(second).toMatchObject({ status: 'duplicate', reason: 'already_delivered' });
    expect(email.sent).toHaveLength(1);
    expect((await eventTypes(lead.leadId)).filter((t) => t === 'delivery_succeeded')).toHaveLength(1);
  });

  it('concurrent duplicate processing does not double-send', async () => {
    const lead = await seedLead();
    const email = new FakeEmailProvider();
    const deps = { db, activation: activation(), email };

    const outcomes = await Promise.all([
      processDeliveryMessage(lead.message, deps),
      processDeliveryMessage(lead.message, deps),
    ]);

    expect(email.sent).toHaveLength(1);
    expect(outcomes.filter((o) => o.status === 'delivered')).toHaveLength(1);
    expect(outcomes.filter((o) => o.status === 'delivered' || o.status === 'retry' || o.status === 'duplicate')).toHaveLength(2);
  });

  it('stays complete for a brand-new service instance (restart)', async () => {
    const lead = await seedLead();
    await processDeliveryMessage(lead.message, { db, activation: activation(), email: new FakeEmailProvider() });

    // A fresh provider, activation, and runtime: nothing is remembered in memory.
    const afterRestart = new FakeEmailProvider();
    const outcome = await processDeliveryMessage(lead.message, {
      db,
      activation: activation(),
      email: afterRestart,
      runtime: testRuntime('2026-09-20T09:00:00.000Z'),
    });

    expect(outcome.status).toBe('duplicate');
    expect(afterRestart.sent).toHaveLength(0);
  });

  it('an in-flight attempt is retried later rather than sent twice', async () => {
    const lead = await seedLead();
    const hanging = {
      name: 'test-hanging',
      send: async () => new Promise<never>(() => {}),
    };
    const deps = { db, activation: activation(), email: hanging };
    void processDeliveryMessage(lead.message, deps);
    await new Promise((resolve) => setTimeout(resolve, 20));

    const second = await processDeliveryMessage(lead.message, { db, activation: activation(), email: new FakeEmailProvider() });
    expect(second).toMatchObject({ status: 'retry' });
    expect(['attempt_in_flight', 'claim_lost']).toContain(second.reason);
    expect(ATTEMPT_LEASE_SECONDS).toBeGreaterThan(0);
  });
});

describe('6-8. provider failure behavior', () => {
  it('a transient failure is durable and retryable', async () => {
    const lead = await seedLead();
    const email = new FakeEmailProvider([{ ok: false, retryable: true, code: 'rate_limit_exceeded', status: 429 }]);
    const outcome = await processDeliveryMessage(lead.message, { db, activation: activation(), email, attempt: 1 });

    expect(outcome).toMatchObject({ status: 'retry', reason: 'rate_limit_exceeded' });
    expect(outcome.retryDelaySeconds).toBeGreaterThan(0);
    const types = await eventTypes(lead.leadId);
    expect(types).toContain('delivery_failed_retryable');
    expect(types).not.toContain('delivery_failed_permanent');
  });

  it('a permanent failure becomes operator follow-up and stops retrying', async () => {
    const lead = await seedLead();
    const email = new FakeEmailProvider([{ ok: false, retryable: false, code: 'validation_error', status: 422 }]);
    const outcome = await processDeliveryMessage(lead.message, { db, activation: activation(), email });

    expect(outcome).toMatchObject({ status: 'terminal', reason: 'validation_error' });
    expect(await eventTypes(lead.leadId)).toContain('delivery_failed_permanent');

    // A later redelivery must not send again.
    const again = await processDeliveryMessage(lead.message, { db, activation: activation(), email });
    expect(again.status).toBe('terminal');
    expect(email.sent).toHaveLength(1);

    const attention = await listLeadsNeedingAttention(db);
    expect(attention.find((a) => a.leadId === lead.leadId)).toMatchObject({
      reason: 'delivery_failed_permanently',
      detail: 'validation_error',
    });
  });

  it('exhausted attempts stop retrying instead of looping forever', async () => {
    const lead = await seedLead();
    const email = new FakeEmailProvider([{ ok: false, retryable: true, code: 'service_unavailable', status: 503 }]);
    const outcome = await processDeliveryMessage(lead.message, {
      db,
      activation: activation(),
      email,
      attempt: MAX_DELIVERY_ATTEMPTS,
    });
    expect(outcome).toMatchObject({ status: 'terminal', reason: 'max_attempts_exhausted' });
    expect(await eventTypes(lead.leadId)).toContain('delivery_failed_permanent');
  });

  it('a provider timeout is safe: retryable, no success recorded, no duplicate key change', async () => {
    const lead = await seedLead();
    // A fetch that respects the abort signal and never resolves on its own.
    const hangingFetch = ((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      })) as unknown as typeof fetch;
    const email = createResendEmailProvider({ apiKey: 'TEST-ONLY-key', fetchImpl: hangingFetch, timeoutMs: 15 });

    const outcome = await processDeliveryMessage(lead.message, { db, activation: activation(), email });
    expect(outcome).toMatchObject({ status: 'retry', reason: 'provider_timeout' });
    expect(await eventTypes(lead.leadId)).not.toContain('delivery_succeeded');
  });
});

describe('9-11. malformed and missing data fail safely', () => {
  it('a malformed queue message is rejected without touching lead data', async () => {
    const lead = await seedLead();
    const before = (await listEvents(db, lead.leadId)).length;
    const email = new FakeEmailProvider();

    for (const bad of [
      null,
      { schemaVersion: 1 },
      { ...lead.message, firstName: 'Fixture' },
      { ...lead.message, phone: '(317) 555-0142' },
      { ...lead.message, schemaVersion: 2 },
      { ...lead.message, leadId: 'not-a-uuid' },
    ]) {
      const outcome = await processDeliveryMessage(bad, { db, activation: activation(), email });
      expect(outcome).toEqual({ status: 'terminal', reason: 'malformed_message' });
    }
    expect(email.sent).toHaveLength(0);
    expect((await listEvents(db, lead.leadId)).length).toBe(before);
  });

  it('an unknown lead or delivery fails safely with no send and no mutation', async () => {
    const lead = await seedLead();
    const email = new FakeEmailProvider();
    const before = (await listEvents(db, lead.leadId)).length;

    const unknownLead = await processDeliveryMessage(
      { ...lead.message, leadId: crypto.randomUUID() },
      { db, activation: activation(), email },
    );
    expect(unknownLead).toEqual({ status: 'terminal', reason: 'lead_not_found' });

    const unknownDelivery = await processDeliveryMessage(
      { ...lead.message, deliveryId: crypto.randomUUID() },
      { db, activation: activation(), email },
    );
    expect(unknownDelivery).toEqual({ status: 'terminal', reason: 'delivery_not_found' });

    expect(email.sent).toHaveLength(0);
    expect((await listEvents(db, lead.leadId)).length).toBe(before);
  });

  it('an unknown route fails safely and creates operator follow-up', async () => {
    const lead = await seedLead();
    const email = new FakeEmailProvider();
    const outcome = await processDeliveryMessage(
      { ...lead.message, routeId: crypto.randomUUID() },
      { db, activation: activation(), email },
    );

    expect(outcome).toMatchObject({ status: 'terminal', reason: 'route_not_found' });
    expect(email.sent).toHaveLength(0);
    expect(await eventTypes(lead.leadId)).toContain('delivery_failed_permanent');
    expect((await listLeadsNeedingAttention(db)).some((a) => a.leadId === lead.leadId)).toBe(true);
  });
});

describe('12-14. routing integrity and operator follow-up', () => {
  it('an inactive partner never causes rerouting to another contractor', async () => {
    const lead = await seedLead();
    const replacement = await seedPartner(db, {
      name: 'FIXTURE-PARTNER-C (synthetic)',
      notificationEmail: 'fixture-partner-c@example.invalid',
    });
    await setPartnerStatus(db, lead.partnerId!, 'inactive');

    const email = new FakeEmailProvider();
    const outcome = await processDeliveryMessage(lead.message, { db, activation: activation(), email });

    expect(outcome).toMatchObject({ status: 'terminal', reason: 'partner_inactive' });
    expect(email.sent).toHaveLength(0);
    expect(replacement.partnerId).not.toBe(lead.partnerId);
    expect((await listLeadsNeedingAttention(db)).some((a) => a.leadId === lead.leadId)).toBe(true);
  });

  it('switching the active partner does not alter an existing route', async () => {
    const lead = await seedLead();
    const routeBefore = (await listRoutes(db, lead.leadId))[0]!;
    await setPartnerStatus(db, lead.partnerId!, 'inactive');
    await seedPartner(db, { name: 'FIXTURE-PARTNER-D (synthetic)', notificationEmail: 'fixture-partner-d@example.invalid' });

    const routeAfter = (await listRoutes(db, lead.leadId))[0]!;
    expect(routeAfter).toEqual(routeBefore);
    await expect(
      db.prepare(`UPDATE lead_routes SET partner_id = ? WHERE id = ?`).bind(crypto.randomUUID(), routeBefore.id).run(),
    ).rejects.toThrow(/immutable/);
  });

  it('a lead with no active partner notifies the operator and stays on the follow-up list', async () => {
    const lead = await seedLead({ partner: false });
    expect(lead.routeOutcome).toBe('no_active_partner');

    const email = new FakeEmailProvider();
    const outcome = await processDeliveryMessage(lead.message, { db, activation: activation(), email });

    expect(outcome.status).toBe('delivered');
    expect(email.sent[0]?.to).toBe(FIXTURE_OPERATOR_EMAIL);
    expect(email.sent[0]?.text).toContain('operator follow-up');
    const attention = await listLeadsNeedingAttention(db);
    expect(attention.find((a) => a.leadId === lead.leadId)?.reason).toBe('no_active_partner');
  });

  it('a partner with no usable notification destination fails to operator follow-up', async () => {
    const lead = await seedLead({ email: null });
    const email = new FakeEmailProvider();
    const outcome = await processDeliveryMessage(lead.message, { db, activation: activation(), email });
    expect(outcome).toMatchObject({ status: 'terminal', reason: 'partner_notification_unconfigured' });
    expect(email.sent).toHaveLength(0);
  });
});

describe('15-16. no homeowner PII in queue payloads, events, or logs', () => {
  it('the queue payload carries identifiers only', async () => {
    const lead = await seedLead();
    expect(Object.keys(lead.message).sort()).toEqual(['deliveryId', 'kind', 'leadId', 'routeId', 'schemaVersion']);
    const serialized = JSON.stringify(lead.message);
    for (const value of PII) expect(serialized).not.toContain(value);
    // A producer cannot smuggle contact fields through the contract.
    expect(leadQueueMessageSchema.safeParse({ ...lead.message, email: 'homeowner@example.invalid' }).success).toBe(false);
  });

  it('delivery events, provider payloads, and logs contain no contact details', async () => {
    const logs: string[] = [];
    for (const level of ['log', 'warn', 'error'] as const) {
      vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
        logs.push(args.map(String).join(' '));
      });
    }

    const lead = await seedLead();
    const email = new FakeEmailProvider();
    await processDeliveryMessage(lead.message, { db, activation: activation(), email });

    const events = await listEvents(db, lead.leadId);
    const eventText = events.map((e) => e.payload_json).join(' ');
    const providerText = JSON.stringify(email.sent);
    for (const value of PII) {
      expect(eventText).not.toContain(value);
      expect(providerText).not.toContain(value);
      expect(logs.join(' ')).not.toContain(value);
    }
    // The contact record itself still exists, and is reachable only by explicit request.
    const contact = await getLeadContactForOperator(db, lead.leadId);
    expect(contact?.phone_e164).toBe('+13175550142');
    const attention = await listLeadsNeedingAttention(db);
    expect(JSON.stringify(attention)).not.toContain('+13175550142');
  });
});

describe('24. operator follow-up query covers delivery failures', () => {
  it('lists retry-pending and permanently failed deliveries', async () => {
    const retrying = await seedLead();
    await processDeliveryMessage(retrying.message, {
      db,
      activation: activation(),
      email: new FakeEmailProvider([{ ok: false, retryable: true, code: 'service_unavailable', status: 503 }]),
    });

    const failed = await seedLead();
    await processDeliveryMessage(failed.message, {
      db,
      activation: activation(),
      email: new FakeEmailProvider([{ ok: false, retryable: false, code: 'invalid_parameter', status: 422 }]),
    });

    const attention = await listLeadsNeedingAttention(db);
    expect(attention.find((a) => a.leadId === retrying.leadId)?.reason).toBe('delivery_retry_pending');
    expect(attention.find((a) => a.leadId === failed.leadId)?.reason).toBe('delivery_failed_permanently');
    for (const item of attention) expect(Object.keys(item).sort()).toEqual(['detail', 'leadId', 'reason', 'since']);
  });
});

describe('queue batch handler', () => {
  it('acks completed messages and retries failures with a delay', async () => {
    const delivered = await seedLead();
    const retrying = await seedLead();
    const malformed = new FakeQueueMessage({ nope: true });
    const okMessage = new FakeQueueMessage(delivered.message, 1);
    const retryMessage = new FakeQueueMessage(retrying.message, 2);

    const email = {
      name: 'test-mixed',
      sent: [] as unknown[],
      async send(message: { to: string }) {
        this.sent.push(message);
        return this.sent.length === 1
          ? ({ ok: true, providerMessageId: 'FIXTURE-EMAIL-1' } as const)
          : ({ ok: false, retryable: true, code: 'service_unavailable' } as const);
      },
    };

    const outcomes = await handleDeliveryBatch(
      { messages: [okMessage, retryMessage, malformed] },
      { db, activation: activation(), email },
    );

    expect(outcomes.map((o) => o.status)).toEqual(['delivered', 'retry', 'terminal']);
    expect(okMessage.acked).toBe(1);
    expect(malformed.acked).toBe(1);
    expect(retryMessage.acked).toBe(0);
    expect(retryMessage.retried[0]?.delaySeconds).toBeGreaterThan(0);
  });

  it('retries rather than dropping a lead when processing throws', async () => {
    const lead = await seedLead();
    const exploding = {
      name: 'test-exploding',
      send: async () => {
        throw new Error('provider client blew up');
      },
    };
    const message = new FakeQueueMessage(lead.message, 1);
    const outcomes = await handleDeliveryBatch({ messages: [message] }, { db, activation: activation(), email: exploding });
    expect(outcomes[0]).toMatchObject({ status: 'retry', reason: 'unexpected_error' });
    expect(message.retried).toHaveLength(1);
  });
});

describe('sms channel', () => {
  it('delivers by SMS when that is the partner destination, with minimal content', async () => {
    const lead = await seedLead({ sms: true });
    const sms = new FakeSmsProvider();
    const outcome = await processDeliveryMessage(lead.message, {
      db,
      activation: activation({ TWILIO_ACCOUNT_SID: 'TEST-ONLY-sid', TWILIO_AUTH_TOKEN: 'TEST-ONLY-token', TWILIO_FROM_NUMBER: '+13175550199' }),
      email: new FakeEmailProvider(),
      sms,
    });

    expect(outcome).toMatchObject({ status: 'delivered', channel: 'sms' });
    expect(sms.sent[0]?.to).toBe(FIXTURE_PARTNER_PHONE);
    const body = sms.sent[0]?.body ?? '';
    for (const value of PII) expect(body).not.toContain(value);
    expect(body).toContain('[NON-PRODUCTION TEST TEMPLATE]');
  });
});
