/**
 * SYNTHETIC TEST FIXTURES — NOT REAL DATA.
 *
 * Every name, phone number, email, municipality, partner, and consent artifact below is invented
 * for tests. No real homeowner, contractor, or research candidate appears here, and none of this
 * is first-party data. Phone numbers use the 555-01xx reserved fictional range; emails use the
 * reserved .invalid TLD; partners are named FIXTURE-*; consent artifacts carry the TEST-ONLY
 * prefix that production activation rejects.
 */
import type { ConsentArtifact, EmailMessage, LeadQueue, LeadQueueMessage, SmsMessage } from '../../src/lib/leads/contract.ts';
import type { Runtime, SqlDatabase } from '../../src/lib/leads/db.ts';
import type { EmailProvider, ProviderSendResult, SmsProvider } from '../../src/lib/leads/providers/types.ts';

export const TEST_CONSENT: ConsentArtifact = {
  artifactId: 'TEST-ONLY-contractor-sharing-consent',
  artifactVersion: 'test-0',
};

export const FIXTURE_MUNICIPALITY = 'Fixtureville';
/** Synthetic partner destinations: reserved .invalid domain and the 555-01xx fictional range. */
export const FIXTURE_PARTNER_EMAIL = 'fixture-partner@example.invalid';
export const FIXTURE_PARTNER_PHONE = '+13175550188';
export const FIXTURE_OPERATOR_EMAIL = 'fixture-operator@example.invalid';
export const FIXTURE_FROM_EMAIL = 'fixture-sender@example.invalid';
export const FIXTURE_SMS_FROM = '+13175550199';

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
    /** Synthetic notification destinations (reserved fictional ranges only). */
    notificationEmail?: string | null;
    notificationPhone?: string | null;
    notifyEmail?: boolean;
    notifySms?: boolean;
  } = {},
): Promise<{ partnerId: string; ruleId: string }> {
  const partnerId = options.partnerId ?? crypto.randomUUID();
  const ruleId = crypto.randomUUID();
  const now = '2026-01-01T00:00:00.000Z';
  const notifyEmail = options.notifyEmail ?? true;
  const notifySms = options.notifySms ?? false;
  const notificationEmail =
    options.notificationEmail === undefined ? (notifyEmail ? FIXTURE_PARTNER_EMAIL : null) : options.notificationEmail;
  const notificationPhone =
    options.notificationPhone === undefined ? (notifySms ? FIXTURE_PARTNER_PHONE : null) : options.notificationPhone;
  await db
    .prepare(
      `INSERT INTO partners (id, display_name, status, created_at, updated_at,
                             notification_email, notification_phone_e164, notify_email_enabled, notify_sms_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      partnerId,
      options.name ?? 'FIXTURE-PARTNER (synthetic)',
      options.status ?? 'active',
      now,
      now,
      notificationEmail,
      notificationPhone,
      notifyEmail ? 1 : 0,
      notifySms ? 1 : 0,
    )
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

/**
 * A synthetic notification environment that activates the delivery pipeline in tests ONLY.
 * SITE_ENV is never "production" here, and every value is a reserved test value that production
 * activation rejects. No such configuration exists in the repository or in CI.
 */
export function testNotificationEnv(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    NOTIFICATIONS_ENABLED: 'true',
    RESEND_API_KEY: 'TEST-ONLY-resend-key-not-real',
    NOTIFICATION_FROM_EMAIL: FIXTURE_FROM_EMAIL,
    OPERATOR_NOTIFICATION_EMAIL: FIXTURE_OPERATOR_EMAIL,
    DB: { prepare: () => ({}) },
    SITE_ENV: 'development',
    ...overrides,
  };
}

/** Records what would have been sent. No network, no provider account, no message leaves. */
export class FakeEmailProvider implements EmailProvider {
  readonly name = 'test-email';
  readonly sent: EmailMessage[] = [];
  constructor(private readonly results: ProviderSendResult[] = []) {}
  async send(message: EmailMessage): Promise<ProviderSendResult> {
    this.sent.push(message);
    return this.results[this.sent.length - 1] ?? this.results[this.results.length - 1] ?? { ok: true, providerMessageId: `FIXTURE-EMAIL-${this.sent.length}` };
  }
}

export class FakeSmsProvider implements SmsProvider {
  readonly name = 'test-sms';
  readonly sent: SmsMessage[] = [];
  constructor(private readonly result: ProviderSendResult = { ok: true, providerMessageId: 'FIXTURE-SMS-1' }) {}
  async send(message: SmsMessage): Promise<ProviderSendResult> {
    this.sent.push(message);
    return this.result;
  }
}

/** Minimal stand-in for a Cloudflare queue message, recording ack/retry decisions. */
export class FakeQueueMessage {
  acked = 0;
  retried: { delaySeconds?: number }[] = [];
  constructor(readonly body: unknown, readonly attempts = 1) {}
  ack(): void {
    this.acked += 1;
  }
  retry(options?: { delaySeconds?: number }): void {
    this.retried.push(options ?? {});
  }
}

export async function countRows(db: SqlDatabase, table: string): Promise<number> {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>();
  return row?.n ?? 0;
}
