/**
 * SYNTHETIC TEST FIXTURES — NOT REAL DATA.
 *
 * Every name, phone number, email, municipality, partner, and consent artifact below is invented
 * for tests. No real homeowner, contractor, or research candidate appears here, and none of this
 * is first-party data. Phone numbers use the 555-01xx reserved fictional range; emails use the
 * reserved .invalid TLD; partners are named FIXTURE-*; consent artifacts carry the TEST-ONLY
 * prefix that production activation rejects.
 */
import type { ConsentArtifact, LeadQueue, LeadQueueMessage } from '../../src/lib/leads/contract.ts';
import type { Runtime, SqlDatabase } from '../../src/lib/leads/db.ts';

export const TEST_CONSENT: ConsentArtifact = {
  artifactId: 'TEST-ONLY-contractor-sharing-consent',
  artifactVersion: 'test-0',
};

export const FIXTURE_MUNICIPALITY = 'Fixtureville';

/** A valid minimum intake submission. Override any field per test. */
export function intakeInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    submissionKey: crypto.randomUUID(),
    firstName: 'Fixture',
    phone: '(317) 555-0142',
    preferredContact: 'phone',
    municipality: FIXTURE_MUNICIPALITY,
    zip: '46226',
    problemCategory: 'backup_or_slow_drains',
    description: 'FIXTURE: synthetic test submission, not a real homeowner report.',
    urgency: 'within_days',
    cameraInspection: 'unsure',
    decisionMaker: 'homeowner_decision_maker',
    sharingConsentAccepted: true,
    ...overrides,
  };
}

/** Deterministic clock/id generator for assertions. */
export function testRuntime(startIso = '2026-09-19T12:00:00.000Z'): Runtime {
  let tick = 0;
  const base = new Date(startIso).getTime();
  return {
    now: () => new Date(base + tick++ * 1000),
    newId: () => crypto.randomUUID(),
  };
}

/** Records every message a test enqueues; can be made to fail. */
export class FakeQueue implements LeadQueue {
  readonly sent: LeadQueueMessage[] = [];
  constructor(private readonly failWith?: Error) {}
  async send(message: LeadQueueMessage): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.sent.push(message);
  }
}

/** Inserts a synthetic partner and an active catch-all routing rule. */
export async function seedPartner(
  db: SqlDatabase,
  options: {
    partnerId?: string;
    name?: string;
    status?: 'active' | 'inactive';
    ruleStatus?: 'active' | 'inactive';
    priority?: number;
    municipality?: string | null;
    effectiveFrom?: string;
    effectiveTo?: string | null;
  } = {},
): Promise<{ partnerId: string; ruleId: string }> {
  const partnerId = options.partnerId ?? crypto.randomUUID();
  const ruleId = crypto.randomUUID();
  const now = '2026-01-01T00:00:00.000Z';
  await db
    .prepare(`INSERT INTO partners (id, display_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(partnerId, options.name ?? 'FIXTURE-PARTNER (synthetic)', options.status ?? 'active', now, now)
    .run();
  await db
    .prepare(
      `INSERT INTO routing_rules (id, partner_id, status, priority, municipality, effective_from, effective_to, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      ruleId,
      partnerId,
      options.ruleStatus ?? 'active',
      options.priority ?? 100,
      options.municipality === undefined ? null : options.municipality,
      options.effectiveFrom ?? now,
      options.effectiveTo ?? null,
      now,
    )
    .run();
  return { partnerId, ruleId };
}

export async function setPartnerStatus(db: SqlDatabase, partnerId: string, status: 'active' | 'inactive'): Promise<void> {
  await db.prepare(`UPDATE partners SET status = ?, updated_at = ? WHERE id = ?`).bind(status, new Date().toISOString(), partnerId).run();
}

export async function countRows(db: SqlDatabase, table: string): Promise<number> {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>();
  return row?.n ?? 0;
}
