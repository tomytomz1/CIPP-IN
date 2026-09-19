/**
 * Lead intake service tests against local D1 (Miniflare). All data is SYNTHETIC (tests/fixtures/leads.ts).
 * Covers the required Phase 2B scenarios: validation, idempotency, PII separation, consent audit,
 * event history, routing, persistence-before-queue, and queue-failure durability.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IntakeValidationError, submitLead } from '../../src/lib/leads/intake.ts';
import { leadQueueMessageSchema } from '../../src/lib/leads/contract.ts';
import { getContactByLead, getLead, listEvents, listLeadsNeedingFollowUp, listRoutes } from '../../src/lib/leads/repository.ts';
import type { SqlDatabase } from '../../src/lib/leads/db.ts';
import { createTestDb, type TestDb } from '../helpers/d1.ts';
import { FakeQueue, TEST_CONSENT, countRows, intakeInput, seedPartner, setPartnerStatus, testRuntime } from '../fixtures/leads.ts';

let harness: TestDb;
let db: SqlDatabase;

beforeEach(async () => {
  harness = await createTestDb();
  db = harness.db;
});
afterEach(async () => {
  await harness.dispose();
});

const submit = (input: unknown, queue?: FakeQueue) =>
  submitLead(input, { db, queue, consentArtifact: TEST_CONSENT, source: 'test', runtime: testRuntime() });

describe('intake validation', () => {
  it('1. accepts a minimum lead with email only', async () => {
    const queue = new FakeQueue();
    const result = await submit(intakeInput({ phone: undefined, email: 'fixture@example.invalid', preferredContact: 'email' }), queue);
    expect(result.duplicate).toBe(false);
    const contact = await getContactByLead(db, result.leadId);
    expect(contact?.email_normalized).toBe('fixture@example.invalid');
    expect(contact?.phone_e164).toBeNull();
  });

  it('2. accepts a minimum lead with phone only and normalizes it to E.164', async () => {
    const result = await submit(intakeInput({ email: undefined, phone: '(317) 555-0142' }), new FakeQueue());
    const contact = await getContactByLead(db, result.leadId);
    expect(contact?.phone_e164).toBe('+13175550142');
    expect(contact?.phone_input).toBe('(317) 555-0142');
    expect(contact?.email).toBeNull();
  });

  it('3. rejects a submission with neither phone nor email', async () => {
    await expect(submit(intakeInput({ phone: undefined, email: undefined }))).rejects.toBeInstanceOf(IntakeValidationError);
    expect(await countRows(db, 'leads')).toBe(0);
  });

  it('4. rejects unexpected intake fields', async () => {
    for (const extra of [
      { streetAddress: '123 Fixture St' },
      { householdIncome: 120000 },
      { insurancePolicyNumber: 'X' },
      { pipeDepthFeet: 6 },
      { existingContractor: 'FIXTURE' },
      { exactProjectValue: 18000 },
      { cameraVideoBase64: 'AAAA' },
    ]) {
      await expect(submit(intakeInput(extra))).rejects.toBeInstanceOf(IntakeValidationError);
    }
    expect(await countRows(db, 'leads')).toBe(0);
  });

  it('5. rejects a submission without explicit sharing consent', async () => {
    await expect(submit(intakeInput({ sharingConsentAccepted: false }))).rejects.toBeInstanceOf(IntakeValidationError);
    await expect(submit(intakeInput({ sharingConsentAccepted: undefined }))).rejects.toBeInstanceOf(IntakeValidationError);
    expect(await countRows(db, 'consents')).toBe(0);
  });

  it('6. enforces bounded input lengths and formats', async () => {
    await expect(submit(intakeInput({ description: 'x'.repeat(1001) }))).rejects.toBeInstanceOf(IntakeValidationError);
    await expect(submit(intakeInput({ firstName: 'x'.repeat(61) }))).rejects.toBeInstanceOf(IntakeValidationError);
    await expect(submit(intakeInput({ zip: '4622' }))).rejects.toBeInstanceOf(IntakeValidationError);
    await expect(submit(intakeInput({ municipality: 'x'.repeat(81) }))).rejects.toBeInstanceOf(IntakeValidationError);
    await expect(submit(intakeInput({ phone: '555-0142' }))).rejects.toBeInstanceOf(IntakeValidationError);
    await expect(submit(intakeInput({ submissionKey: 'not-a-uuid' }))).rejects.toBeInstanceOf(IntakeValidationError);
    await expect(submit(intakeInput({ problemCategory: 'made_up' }))).rejects.toBeInstanceOf(IntakeValidationError);
  });

  it('20. treats SQL-injection-like input as data', async () => {
    const hostile = "Fixture'); DROP TABLE leads;--";
    const result = await submit(intakeInput({ description: hostile, firstName: "O'Fixture" }), new FakeQueue());
    const lead = await getLead(db, result.leadId);
    expect(lead?.description).toBe(hostile);
    expect(await countRows(db, 'leads')).toBe(1);
    // The table still exists and the value was stored verbatim, not executed.
    expect((await getContactByLead(db, result.leadId))?.first_name).toBe("O'Fixture");
  });
});

describe('idempotency', () => {
  it('7. a retry with the same submission key preserves one logical lead', async () => {
    await seedPartner(db);
    const input = intakeInput();
    const first = await submit(input, new FakeQueue());
    const second = await submit(input, new FakeQueue());
    expect(second.duplicate).toBe(true);
    expect(second.leadId).toBe(first.leadId);
    expect(await countRows(db, 'leads')).toBe(1);
    expect(await countRows(db, 'lead_contacts')).toBe(1);
    expect(await countRows(db, 'lead_routes')).toBe(1);
  });

  it('8. the database enforces idempotency on concurrent duplicates', async () => {
    await seedPartner(db);
    const input = intakeInput();
    const results = await Promise.all([submit(input, new FakeQueue()), submit(input, new FakeQueue())]);
    expect(new Set(results.map((r) => r.leadId)).size).toBe(1);
    expect(await countRows(db, 'leads')).toBe(1);
    await expect(
      db.prepare(`INSERT INTO leads (id, submission_key, source, municipality, zip, problem_category, description, urgency, camera_inspection, decision_maker, created_at)
                  VALUES (?, ?, 'test', 'Fixtureville', '46226', 'other', NULL, 'researching', 'unsure', 'homeowner_decision_maker', '2026-01-01T00:00:00.000Z')`)
        .bind(crypto.randomUUID(), String(input['submissionKey']))
        .run(),
    ).rejects.toThrow(/UNIQUE constraint failed/i);
  });

  it('a different submission key creates a separate lead even with identical contact details', async () => {
    await seedPartner(db);
    const a = await submit(intakeInput(), new FakeQueue());
    const b = await submit(intakeInput(), new FakeQueue());
    expect(b.leadId).not.toBe(a.leadId);
    expect(b.duplicate).toBe(false);
    expect(await countRows(db, 'leads')).toBe(2);
  });
});

describe('storage separation and audit', () => {
  it('9. contact PII is stored only in lead_contacts', async () => {
    const result = await submit(intakeInput({ email: 'fixture@example.invalid' }), new FakeQueue());
    const lead = (await getLead(db, result.leadId)) as unknown as Record<string, unknown>;
    const values = JSON.stringify(lead);
    expect(values).not.toContain('Fixture,');
    expect(values).not.toContain('fixture@example.invalid');
    expect(values).not.toContain('+13175550142');
    expect(Object.keys(lead)).not.toContain('first_name');
    expect(Object.keys(lead)).not.toContain('email');
    expect(Object.keys(lead)).not.toContain('phone_e164');
  });

  it('10. a consent audit record is persisted and is append-only', async () => {
    const result = await submit(intakeInput(), new FakeQueue());
    const consent = await db.prepare(`SELECT * FROM consents WHERE lead_id = ?`).bind(result.leadId).first<Record<string, unknown>>();
    expect(consent).toMatchObject({
      consent_type: 'contractor_sharing',
      artifact_id: TEST_CONSENT.artifactId,
      artifact_version: TEST_CONSENT.artifactVersion,
      accepted: 1,
      capture_channel: 'test',
    });
    expect(consent?.['accepted_at']).toBeTruthy();
    await expect(db.prepare(`UPDATE consents SET accepted = 0 WHERE lead_id = ?`).bind(result.leadId).run()).rejects.toThrow(/append-only/);
  });

  it('11. event history is created, ordered, append-only, and free of contact PII', async () => {
    await seedPartner(db);
    const result = await submit(intakeInput({ email: 'fixture@example.invalid' }), new FakeQueue());
    const events = await listEvents(db, result.leadId);
    expect(events.map((e) => e.event_type)).toEqual([
      'lead_created', 'consent_recorded', 'routing_evaluated', 'route_assigned', 'delivery_pending', 'delivery_enqueued',
    ]);
    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain('fixture@example.invalid');
    expect(serialized).not.toContain('+13175550142');
    expect(serialized).not.toContain('Fixture,');
    await expect(
      db.prepare(`UPDATE lead_events SET event_type = 'lead_created' WHERE lead_id = ?`).bind(result.leadId).run(),
    ).rejects.toThrow(/append-only/);
  });
});

describe('routing', () => {
  it('12. routes to the active partner', async () => {
    const { partnerId, ruleId } = await seedPartner(db);
    const result = await submit(intakeInput(), new FakeQueue());
    expect(result.routeOutcome).toBe('assigned');
    expect(result.partnerId).toBe(partnerId);
    const [route] = await listRoutes(db, result.leadId);
    expect(route?.routing_rule_id).toBe(ruleId);
    expect(JSON.parse(route?.decision_snapshot_json ?? '{}')).toMatchObject({ partnerId, ruleId });
  });

  it('13. excludes inactive partners and inactive/expired rules', async () => {
    await seedPartner(db, { status: 'inactive' });
    await seedPartner(db, { ruleStatus: 'inactive' });
    await seedPartner(db, { effectiveTo: '2026-01-02T00:00:00.000Z' });
    await seedPartner(db, { effectiveFrom: '2030-01-01T00:00:00.000Z' });
    const result = await submit(intakeInput(), new FakeQueue());
    expect(result.routeOutcome).toBe('no_active_partner');
    expect(result.partnerId).toBeNull();
  });

  it('prefers a municipality-specific rule, then priority', async () => {
    await seedPartner(db, { priority: 10, municipality: null });
    const specific = await seedPartner(db, { priority: 900, municipality: 'Fixtureville' });
    const result = await submit(intakeInput(), new FakeQueue());
    expect(result.partnerId).toBe(specific.partnerId);
  });

  it('14. with no active partner the lead is still fully persisted and flagged for follow-up', async () => {
    const queue = new FakeQueue();
    const result = await submit(intakeInput(), queue);
    expect(result.routeOutcome).toBe('no_active_partner');
    expect(await countRows(db, 'leads')).toBe(1);
    expect(await countRows(db, 'lead_contacts')).toBe(1);
    expect(await countRows(db, 'consents')).toBe(1);
    const [route] = await listRoutes(db, result.leadId);
    expect(route?.outcome).toBe('no_active_partner');
    expect((await listEvents(db, result.leadId)).map((e) => e.event_type)).toContain('route_unavailable');
    expect(queue.sent[0]?.kind).toBe('operator_follow_up');
    expect(await listLeadsNeedingFollowUp(db)).toEqual([{ lead_id: result.leadId, reason: 'no_active_partner' }]);
  });

  it('15./16. switching the active renter affects future routes only; history is immutable', async () => {
    const first = await seedPartner(db, { name: 'FIXTURE-PARTNER-A (synthetic)' });
    const before = await submit(intakeInput(), new FakeQueue());
    expect(before.partnerId).toBe(first.partnerId);

    // Switch renter: deactivate A, activate B. No content or historical row is touched.
    await setPartnerStatus(db, first.partnerId, 'inactive');
    const second = await seedPartner(db, { name: 'FIXTURE-PARTNER-B (synthetic)' });

    const after = await submit(intakeInput(), new FakeQueue());
    expect(after.partnerId).toBe(second.partnerId);

    const historical = (await listRoutes(db, before.leadId))[0];
    expect(historical?.partner_id).toBe(first.partnerId);
    await expect(
      db.prepare(`UPDATE lead_routes SET partner_id = ? WHERE id = ?`).bind(second.partnerId, historical?.id ?? '').run(),
    ).rejects.toThrow(/immutable/);
  });
});

describe('persistence before queue', () => {
  it('17. persists the lead before enqueueing', async () => {
    await seedPartner(db);
    const observed: string[] = [];
    const queue = {
      send: async () => {
        // At this point the lead must already be durable.
        observed.push(String(await countRows(db, 'leads')));
      },
    };
    const result = await submitLead(intakeInput(), { db, queue, consentArtifact: TEST_CONSENT, source: 'test' });
    expect(observed).toEqual(['1']);
    expect(result.enqueued).toBe(true);
    expect((await listEvents(db, result.leadId)).at(-1)?.event_type).toBe('delivery_enqueued');
  });

  it('18. a queue failure never loses the persisted lead', async () => {
    await seedPartner(db);
    const queue = new FakeQueue(new Error('queue outage'));
    const result = await submit(intakeInput(), queue);
    expect(result.enqueued).toBe(false);
    expect(result.enqueueError).toBeTruthy();
    expect(await countRows(db, 'leads')).toBe(1);
    expect(await countRows(db, 'lead_contacts')).toBe(1);
    const types = (await listEvents(db, result.leadId)).map((e) => e.event_type);
    expect(types).toContain('delivery_pending');
    expect(types).toContain('delivery_enqueue_failed');
    expect(types).not.toContain('delivery_enqueued');
    expect(await listLeadsNeedingFollowUp(db)).toContainEqual({ lead_id: result.leadId, reason: 'delivery_not_enqueued' });
  });

  it('a missing queue binding still persists the lead', async () => {
    await seedPartner(db);
    const result = await submitLead(intakeInput(), { db, consentArtifact: TEST_CONSENT, source: 'test' });
    expect(result.enqueued).toBe(false);
    expect(await countRows(db, 'leads')).toBe(1);
  });
});

describe('queue message contract', () => {
  it('19. carries identifiers only, and rejects contact PII', async () => {
    await seedPartner(db);
    const queue = new FakeQueue();
    const result = await submit(intakeInput({ email: 'fixture@example.invalid' }), queue);
    const message = queue.sent[0]!;
    expect(Object.keys(message).sort()).toEqual(['deliveryId', 'kind', 'leadId', 'routeId', 'schemaVersion']);
    expect(message.leadId).toBe(result.leadId);

    const serialized = JSON.stringify(message);
    for (const pii of ['fixture@example.invalid', '+13175550142', '(317) 555-0142', 'Fixture', '46226', 'Fixtureville']) {
      expect(serialized).not.toContain(pii);
    }
    for (const forbidden of [
      { firstName: 'Fixture' }, { email: 'fixture@example.invalid' }, { phone: '+13175550142' },
      { description: 'x' }, { municipality: 'Fixtureville' }, { zip: '46226' },
    ]) {
      expect(leadQueueMessageSchema.safeParse({ ...message, ...forbidden }).success).toBe(false);
    }
  });
});
