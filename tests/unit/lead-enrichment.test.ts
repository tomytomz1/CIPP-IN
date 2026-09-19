/**
 * Outcome / call / upload enrichment tests. SYNTHETIC data only; none of it is first-party data,
 * and none of these subsystems is active (no Twilio number, no R2 bucket, no uploads enabled).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnrichmentValidationError, outcomeSnapshot, recordCall, recordOutcome, recordUpload } from '../../src/lib/leads/enrichment.ts';
import { submitLead } from '../../src/lib/leads/intake.ts';
import { listEvents, listOutcomes } from '../../src/lib/leads/repository.ts';
import type { SqlDatabase } from '../../src/lib/leads/db.ts';
import { createTestDb, type TestDb } from '../helpers/d1.ts';
import { FakeQueue, TEST_CONSENT, countRows, intakeInput, seedPartner, testRuntime } from '../fixtures/leads.ts';

let harness: TestDb;
let db: SqlDatabase;

beforeEach(async () => {
  harness = await createTestDb();
  db = harness.db;
});
afterEach(async () => {
  await harness.dispose();
});

async function seedLead() {
  const partner = await seedPartner(db);
  const result = await submitLead(intakeInput(), {
    db,
    queue: new FakeQueue(),
    consentArtifact: TEST_CONSENT,
    source: 'test',
    runtime: testRuntime(),
  });
  return { ...result, partnerId: partner.partnerId };
}

describe('21. outcome history', () => {
  it('appends entries, never overwrites, and derives the current view', async () => {
    const lead = await seedLead();
    await recordOutcome(db, {
      leadId: lead.leadId,
      routeId: lead.routeId,
      reportedBy: 'partner',
      firstContactAt: '2026-09-19T12:30:00.000Z',
      qualification: 'qualified',
      result: 'open',
    });
    await recordOutcome(db, {
      leadId: lead.leadId,
      routeId: lead.routeId,
      reportedBy: 'partner',
      appointmentStatus: 'held',
      proposedMethod: 'cipp_lining',
      quoteBand: '10k_20k',
      result: 'won',
      finalMethod: 'cipp_lining',
      finalProjectValueCents: 1_450_000,
      valueVoluntarilyProvided: true,
      completedAt: '2026-09-25T18:00:00.000Z',
    });

    const entries = await listOutcomes(db, lead.leadId);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.result).toBe('open');

    const snapshot = await outcomeSnapshot(db, lead.leadId);
    expect(snapshot).toMatchObject({
      entries: 2,
      firstContactAt: '2026-09-19T12:30:00.000Z',
      qualification: 'qualified',
      result: 'won',
      finalProjectValueCents: 1_450_000,
    });
    // Response time is derived from the routing decision, not stored twice.
    expect(snapshot.responseSeconds).toBeGreaterThan(0);

    expect((await listEvents(db, lead.leadId)).filter((e) => e.event_type === 'outcome_recorded')).toHaveLength(2);
    await expect(
      db.prepare(`UPDATE lead_outcomes SET result = 'lost' WHERE lead_id = ?`).bind(lead.leadId).run(),
    ).rejects.toThrow(/append-only/);
  });

  it('never fabricates a project value and rejects invalid combinations', async () => {
    const lead = await seedLead();
    await expect(
      recordOutcome(db, { leadId: lead.leadId, reportedBy: 'partner', finalProjectValueCents: 1000 }),
    ).rejects.toBeInstanceOf(EnrichmentValidationError);
    await expect(
      recordOutcome(db, { leadId: lead.leadId, reportedBy: 'partner', result: 'won', lostReason: 'price' }),
    ).rejects.toBeInstanceOf(EnrichmentValidationError);
    await expect(
      recordOutcome(db, { leadId: lead.leadId, reportedBy: 'partner', estimatedValue: 5000 }),
    ).rejects.toBeInstanceOf(EnrichmentValidationError);
    expect(await countRows(db, 'lead_outcomes')).toBe(0);
  });

  it('an empty outcome snapshot reports nothing rather than guessing', async () => {
    const lead = await seedLead();
    expect(await outcomeSnapshot(db, lead.leadId)).toEqual({
      entries: 0,
      firstContactAt: null,
      responseSeconds: null,
      qualification: null,
      result: null,
      finalProjectValueCents: null,
    });
  });
});

describe('22. call metadata', () => {
  it('accepts only schema-safe synthetic records and can never enable recording', async () => {
    const lead = await seedLead();
    const id = await recordCall(db, {
      provider: 'twilio',
      providerCallId: 'FIXTURE-CALL-0001',
      leadId: lead.leadId,
      partnerId: lead.partnerId,
      routeId: lead.routeId,
      startedAt: '2026-09-19T13:00:00.000Z',
      endedAt: '2026-09-19T13:04:12.000Z',
      durationSeconds: 252,
      disposition: 'answered',
    });
    const row = await db.prepare(`SELECT * FROM calls WHERE id = ?`).bind(id).first<Record<string, unknown>>();
    expect(row?.['recording_enabled']).toBe(0);
    expect(row?.['provider']).toBe('twilio');

    // Recording cannot be requested through the schema, nor forced through SQL.
    await expect(recordCall(db, { provider: 'twilio', providerCallId: 'X', startedAt: '2026-09-19T13:00:00.000Z', recordingUrl: 'https://example.invalid/r.mp3' })).rejects.toBeInstanceOf(EnrichmentValidationError);
    await expect(db.prepare(`UPDATE calls SET recording_enabled = 1 WHERE id = ?`).bind(id).run()).rejects.toThrow(/CHECK constraint failed/i);

    await expect(recordCall(db, { provider: 'other', providerCallId: 'Y', startedAt: '2026-09-19T13:00:00.000Z' })).rejects.toBeInstanceOf(EnrichmentValidationError);
    await expect(recordCall(db, { provider: 'twilio', providerCallId: 'Z', startedAt: 'not-a-date' })).rejects.toBeInstanceOf(EnrichmentValidationError);
  });
});

describe('23. upload metadata', () => {
  it('stores metadata only and never accepts file content', async () => {
    const lead = await seedLead();
    const id = await recordUpload(db, {
      leadId: lead.leadId,
      storageKey: `leads/${lead.leadId}/fixture-camera-report.pdf`,
      category: 'camera_report',
      mediaType: 'application/pdf',
      byteSize: 12345,
      status: 'pending',
    });
    const row = await db.prepare(`SELECT * FROM uploads WHERE id = ?`).bind(id).first<Record<string, unknown>>();
    expect(Object.keys(row ?? {})).toEqual([
      'id', 'lead_id', 'storage_key', 'category', 'media_type', 'byte_size', 'status', 'created_at',
    ]);
    // No column can hold bytes, and content fields are rejected by the schema.
    for (const bad of [
      { content: 'AAAA' }, { fileBase64: 'AAAA' }, { body: 'x' }, { data: [1, 2, 3] },
    ]) {
      await expect(
        recordUpload(db, { leadId: lead.leadId, storageKey: `leads/${lead.leadId}/x.pdf`, category: 'camera_report', mediaType: 'application/pdf', status: 'pending', ...bad }),
      ).rejects.toBeInstanceOf(EnrichmentValidationError);
    }
    await expect(
      recordUpload(db, { leadId: lead.leadId, storageKey: '../../etc/passwd', category: 'camera_image', mediaType: 'image/png', status: 'pending' }),
    ).rejects.toBeInstanceOf(EnrichmentValidationError);
    await expect(
      recordUpload(db, { leadId: lead.leadId, storageKey: `leads/${lead.leadId}/x.exe`, category: 'camera_image', mediaType: 'application/x-msdownload', status: 'pending' }),
    ).rejects.toBeInstanceOf(EnrichmentValidationError);
  });
});

describe('referential integrity', () => {
  it('rejects enrichment rows for unknown leads', async () => {
    const orphan = crypto.randomUUID();
    await expect(recordOutcome(db, { leadId: orphan, reportedBy: 'operator', result: 'open' })).rejects.toThrow(/FOREIGN KEY/i);
    await expect(
      recordUpload(db, { leadId: orphan, storageKey: `leads/${orphan}/x.pdf`, category: 'camera_report', mediaType: 'application/pdf', status: 'pending' }),
    ).rejects.toThrow(/FOREIGN KEY/i);
  });
});
